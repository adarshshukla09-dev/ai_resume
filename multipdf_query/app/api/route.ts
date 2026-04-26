"use server"
import { chunkText } from "@/lib/chunk";
import { embeddings } from "@/lib/embeddings";
import { extractPdfText } from "@/lib/pdf-parser";
import { COLLECTION_NAME, qdrant } from "@/lib/qdrant";
import { UUIDV5_NAMESPACE } from "@langchain/core/indexing";
import { randomUUID } from "crypto";
import { NextResponse } from "next/server";




export async function POST(request: Request) {
try {
    const formdata = await request.formData();
    const file = await formdata.get("file") as File;

    if (!file || !(file instanceof File)) {
        throw new Error("No valid PDF file uploaded");
    }
  const fileBuffer = Buffer.from(await file.arrayBuffer());

    const textFromPdf = await extractPdfText(fileBuffer as Buffer);


    const docs = await chunkText(textFromPdf);
const points:any = [];

for(const doc of docs){
    const vector =await embeddings.embedQuery(doc.pageContent);
    points.push({
        id:randomUUID(),
        vector,
        payload:{
            text:doc.pageContent
        }
    })
}

    await qdrant.createCollection(COLLECTION_NAME,{
        vectors:{
            size:points[0].vector.length,
            distance:"Cosine"   
        }
    }).catch(()=>{})

    await qdrant.upsert(COLLECTION_NAME,{points})

    return NextResponse.json({ message: "Uploaded & indexed successfully" });

}catch (error) {
    console.error("Indexing error:", error);
}}