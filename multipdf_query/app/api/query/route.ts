"use server";
import { embeddings } from "@/lib/embeddings";
import { COLLECTION_NAME, qdrant } from "@/lib/qdrant";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { query } = await req.json();

    if (!query || query.trim().length === 0) {
      return NextResponse.json({ error: "Empty query" }, { status: 400 });
    }
    console.log(query);
    // ✅ Step 1: Embed query
    const queryVector = await embeddings.embedDocuments(query);
    console.log(queryVector);
    // ✅ Step 2: Search Qdrant directly (faster than LangChain wrapper)
    const searchResults = await qdrant.search(COLLECTION_NAME, {
      vector: queryVector,
      limit: 5,
    });
    console.log(searchResults);

    if (!searchResults || searchResults.length === 0) {
      return NextResponse.json({
        answer: "I don't know based on the provided documents.",
      });
    }

    // ✅ Step 3: Build strong context
    const context = searchResults
      .map((r: any, i: number) => {
        return `Source ${i + 1} (${r.payload.fileName}):\n${r.payload.text}`;
      })
      .join("\n\n---\n\n");

    // ✅ Step 4: Strong prompt (reduces hallucination)
    const systemPrompt = `
You are a strict document-based assistant.

Rules:
- Answer ONLY using the provided context.
- If the answer is not present, say: "I don't know".
- Always mention the source file name.
- Be concise and accurate.
`;

    // ✅ Step 5: Call OpenRouter
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "Multi-PDF RAG",
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini", // 🔥 MUCH better than gemma
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: `Context:\n${context}\n\nQuestion: ${query}`,
          },
        ],
        temperature: 0.3, // lower = more factual
      }),
    });

    const data = await response.json();

    const answer =
      data.choices?.[0]?.message?.content ||
      "No answer generated.";

    return NextResponse.json({ answer });

  } catch (error) {
    console.error("Query Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}