export const embeddings = {
  embedDocuments: async (texts: string[]) => {
    const response = await fetch("https://openrouter.ai/api/v1/embeddings", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "My GenAI App",
      },
      body: JSON.stringify({
        model: "nvidia/llama-nemotron-embed-vl-1b-v2:free",
        // This specific model requires the content array format
        input: texts.map(text => ({
          content: [{ type: "text", text: `passage: ${text}` }]
        }))
      })
    });

    const result = await response.json();
    console.log(result);
    if (!result.data) {
      console.error("OpenRouter Error:", result);
      throw new Error(result.error?.message || "Failed to get embeddings");
    }

    return result.data.map((item: any) => item.embedding);
  }
};