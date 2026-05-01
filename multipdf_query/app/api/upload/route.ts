"use server";

import { loadPdf } from "@/lib/pdf-parser";
import { chunkText } from "@/lib/chunk";
import { COLLECTION_NAME, qdrant } from "@/lib/qdrant";
import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";

const MAX_FILE_SIZE = 50 * 1024 * 1024;

async function ensureCollection(vectorSize: number) {
  try {
    await qdrant.createCollection(COLLECTION_NAME, {
      vectors: { size: vectorSize, distance: "Cosine" },
    });
  } catch (err: any) {
    if (!err.message?.includes("already exists")) throw err;
  }
}

export async function POST(req: NextRequest) {
  try {
    const formdata = await req.formData();
    const files = formdata.getAll("files") as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No files uploaded" }, { status: 400 });
    }

    let totalChunks = 0;
    const fileIds: string[] = [];

    for (const file of files) {
      if (file.type !== "application/pdf") continue;
      if (file.size > MAX_FILE_SIZE) continue;

      const buffer = Buffer.from(await file.arrayBuffer());
      const rawDocs = await loadPdf(buffer);
      const docs = await chunkText(rawDocs.map(d => d.pageContent).join("\n"));

      const texts = docs
      if (texts.length === 0) continue;

      // ✅ CUSTOM EMBEDDING CALL
      // We call OpenRouter directly because LangChain's OpenAI wrapper 
      // often chokes on the specific multimodal 'content' array requirement.
      const response = await fetch("https://openrouter.ai/api/v1/embeddings", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "nvidia/llama-nemotron-embed-vl-1b-v2:free",
          input: texts.map(t => ({
            content: [{ type: "text", text: `passage: ${t}` }]
          }))
        })
      });

      const resData = await response.json();
      
      if (!resData.data) {
        console.error("OpenRouter API Error:", resData);
        throw new Error(resData.error?.message || "Embedding failed");
      }

      const vectors = resData.data.map((item: any) => item.embedding);

      // ✅ ensure collection with 2048 dimensions
      await ensureCollection(2048);

      const fileId = uuidv4();
      fileIds.push(fileId);

      const batchSize = 50; // Smaller batches for Qdrant stability
      for (let i = 0; i < vectors.length; i += batchSize) {
        const batchVectors = vectors.slice(i, i + batchSize);
        const batchDocs = docs.slice(i, i + batchSize);

        await qdrant.upsert(COLLECTION_NAME, {
          points: batchVectors.map((vec: any, j: any) => ({
            id: uuidv4(),
            vector: vec,
            payload: {
              text: batchDocs[j],
              fileId,
              fileName: file.name,
              uploadedAt: new Date().toISOString(),
              chunkIndex: i + j,
            },
          })),
        });
      }

      totalChunks += vectors.length;
    }

    return NextResponse.json({
      success: true,
      filesProcessed: fileIds.length,
      fileIds,
      totalChunks,
    });
  } catch (err: any) {
    console.error("[Upload Error]", err);
    return NextResponse.json({ error: err.message || "Failed to process PDFs" }, { status: 500 });
  }
}