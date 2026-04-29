import { client, COLLECTION_NAME } from "@/lib/qdrant";
import { embeddings } from "@/lib/embedding"; // Use the fetch-based helper we made
import { ChatOpenAI } from "@langchain/openai";

export async function POST(req: Request) {
  const { question } = await req.json();

  // 1. Convert the user's question into a vector
  // IMPORTANT: This must use the same model as the upload (e.g., Nomic 768)
  const questionVector = await embeddings([question]);

  // 2. Search Qdrant for the most relevant chunks
  const searchResult = await client.search(COLLECTION_NAME, {
    vector: questionVector[0],
    limit: 5,
    with_payload: true,
  });

  // 3. Extract the text from the search results
  const context = searchResult
    .map((hit) => hit.payload?.text)
    .filter(Boolean)
    .join("\n\n---\n\n");

  if (!context) {
    return Response.json({ answer: "I couldn't find any relevant information in the uploaded documents." });
  }

  // 4. Send to the LLM with the context
  const llm = new ChatOpenAI({
    apiKey: process.env.OPENROUTER_API_KEY,
    model: "google/gemma-4-26b-a4b-it:free", // Or your preferred model
    configuration: { baseURL: "https://openrouter.ai/api/v1" },
  });

  const response = await llm.invoke([
    {
      role: "system",
      content: `You are a helpful assistant. Use the following context to answer the user's question. 
      If the answer isn't in the context, say you don't know.
      
      CONTEXT:
      ${context}`
    },
    { role: "user", content: question },
  ]);

  return Response.json({ answer: response.content });
}