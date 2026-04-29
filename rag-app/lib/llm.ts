import { ChatOpenAI } from "@langchain/openai";

export const llm = new ChatOpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  model: "google/gemma-4-26b-a4b-it:free",
  temperature: 0.5,
  configuration: {
    baseURL: "https://openrouter.ai/api/v1",
  },
});