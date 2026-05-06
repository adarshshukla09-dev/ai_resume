import openai from "openai"



export const client = new openai({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL:"https://localhost:11434/api/genrate"
})