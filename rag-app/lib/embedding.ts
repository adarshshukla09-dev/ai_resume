



export async function embeddings(texts: string[]) {
 const apikey="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"
  const response = await fetch("https://openrouter.ai/api/v1/embeddings", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apikey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "nvidia/llama-nemotron-embed-vl-1b-v2:free",
      input: texts,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(`OpenRouter Error: ${data.error?.message || response.statusText}`);
  }

  // OpenRouter/OpenAI format returns an array of objects: [{ embedding: [...] }, ...]
  return data.data.map((item: any) => item.embedding);
}
// import { ChatOpenAI } from "@langchain/openai";

// export const embeddings = new ChatOpenAI({
//   apiKey: process.env.OPENROUTER_API_KEY,
//   model: "nvidia/llama-nemotron-embed-vl-1b-v2:free",
//   temperature: 0.5,
//   configuration: {
//     baseURL: "https://openrouter.ai/api/v1",
//   },
// });