import "dotenv/config";
import { GoogleGenAI } from "@google/genai";
import interviewReportSchema from "../Vaildator";
import zodToJsonSchema from "zod-to-json-schema";

const apiKey = process.env.GEMINI_API_KEY!;
const ai = new GoogleGenAI({ apiKey });

interface Resume {
  resume: string;
  selfDescription: string;
  jobDescription: string;
}

async function generateInterviewReport({
  resume,
  selfDescription,
  jobDescription,
}: Resume) {
  try {
    const prompt = `
You are an expert interview coach.

Generate a structured interview report based on:
- Resume: ${resume}
- Job Description: ${jobDescription}
- Candidate Self Description: ${selfDescription}

Return ONLY valid JSON matching the provided schema.
Do not include explanations or extra text.
`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseJsonSchema: zodToJsonSchema(interviewReportSchema),
      },
    });

    if (!response.text) {
      throw new Error("Empty response from AI");
    }

    // ✅ Safe JSON parse
    let parsed;
    try {
      parsed = JSON.parse(response.text);
    } catch {
      throw new Error("Invalid JSON from AI");
    }

    // ✅ Validate with Zod (VERY IMPORTANT)
    const validated = interviewReportSchema.safeParse(parsed);

    if (!validated.success) {
      console.error("Zod error:", validated.error);
      throw new Error("AI response does not match schema");
    }

    return validated.data;

  } catch (error) {
    console.error("AI Error:", error);
    throw error; // ✅ don't swallow errors
  }
}

export default generateInterviewReport;