import { Worker } from "bullmq";
import IORedis from "ioredis";
import pdf from "pdf-parse";
import fs from "fs";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { embeddings } from "@/lib/embedding";
import { client, COLLECTION_NAME } from "@/lib/qdrant";
import { randomUUID } from "crypto";

const connection = new IORedis(process.env.REDIS_URL!, {
  maxRetriesPerRequest: null,
});

new Worker(
  "pdfQueue",
  async (job) => {
    try {
      console.log(`[${job.id}] Processing:`, job.data.fileName || job.data.filePath);

      if (!fs.existsSync(job.data.filePath)) {
        throw new Error(`File not found: ${job.data.filePath}`);
      }

      const buffer = fs.readFileSync(job.data.filePath);
      const data = await pdf(buffer);
      const cleanText = data.text.replace(/\s+/g, ' ').trim();

      if (!cleanText || cleanText.length < 10) {
        throw new Error("No text extracted from PDF.");
      }

      // --- FIX 1: MATCH COLLECTION SIZE ---
      const collections = await client.getCollections();
      if (!collections.collections.some((c) => c.name === COLLECTION_NAME)) {
       await client.createCollection(COLLECTION_NAME, {
  vectors: { 
   size: 2048, // Matches nvidia/llama-nemotron
    distance: "Cosine" 
  },
});
      }

      const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: 800,
        chunkOverlap: 100,
      });
      const docs = await splitter.createDocuments([cleanText]);

      const batchSize = 20;
      for (let i = 0; i < docs.length; i += batchSize) {
        const currentBatch = docs.slice(i, i + batchSize);
        const batchTexts = currentBatch.map((d) => d.pageContent);

        console.log(`[${job.id}] Generating embeddings for batch...`);
        
        // --- FIX 2: Correct LangChain method call ---
      console.log("Calling embeddings...");
const vectors = await embeddings(batchTexts); // Call as function
console.log("Vectors received. Length of first vector:", vectors[0].length);

const points = currentBatch.map((doc, idx) => ({
  id: randomUUID(), 
  vector: vectors[idx],
  payload: {
    text: doc.pageContent,
    source: job.data.fileName,
  },
}));

await client.upsert(COLLECTION_NAME, { points });
        await job.updateProgress(Math.floor((i / docs.length) * 100));
      }

      console.log(`✅ Success: ${docs.length} chunks indexed.`);
      
      if (fs.existsSync(job.data.filePath)) {
        fs.unlinkSync(job.data.filePath);
      }

    } catch (error: any) {
      console.error(`❌ Worker Error [${job.id}]:`, error.message);
      throw error;
    }
  },
  { 
    connection,
    concurrency: 2 
  }
);