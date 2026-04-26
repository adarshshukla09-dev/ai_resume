import { embeddings } from "@/lib/embeddings";
import { NextRequest, NextResponse } from "next/server";
import { qdrant, COLLECTION_NAME } from "@/lib/qdrant";
import { ChatOpenAI } from "@langchain/openai";



export async function POST(req:NextRequest) {
    try {
       const  {query} =await req.json();
       const queryvector = await embeddings.embedQuery(query)
       
       const result = await qdrant.search(COLLECTION_NAME,{
        vector:queryvector,
        limit:3
       })

       const context =result.map(r => r.payload?.text)
      .join("\n");

const model = new ChatOpenAI({
  model: "anthropic/claude-3.5-sonnet",
  temperature: 0,
  configuration: {
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: process.env.OPENROUTER_API_KEY
  }
});


    const prompt = `
Answer the question using ONLY the context below.

Context:
${context}

Question:
${query}
`;

const systemPrompt=`you are a helpful ai assissant amd you must only answer on basis of context `
const apiKey = process.env.OPENROUTER_KEY!;
 const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:3000", // Optional for OpenRouter rankings
        "X-Title": "AI Interview Prep",
      },
      body: JSON.stringify({
        model: "nvidia/nemotron-3-nano-30b-a3b:free",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt },
        ],
        // Note: Check model support for json_object if using fetch
        response_format: { type: "json_object" },
      }),
    });
   if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`OpenRouter API error: ${response.status} - ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      throw new Error("Empty response from OpenRouter");
    }

    const parsedResponse = JSON.parse(content);
 return NextResponse.json({
      answer: parsedResponse,
      context
    });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Query failed" }, { status: 500 });
  }
}