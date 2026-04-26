// lib/pdf-parser.ts
import pdf from "pdf-parse";

/**
 * Modern Next.js 14/15 compatible PDF parser.
 * Handles the Buffer directly without manual worker shims.
 */
export async function extractPdfText(buffer: Buffer): Promise<string> {
  try {
    // Standard pdf-parse handles the internal pdf.js loading automatically
    const data = await pdf(buffer);

    if (!data || !data.text) {
      throw new Error("PDF contains no readable text.");
    }

    // Basic cleaning: removes null bytes and collapses excessive whitespace
    return data.text
      .replace(/\u0000/g, "") 
      .replace(/\s+/g, " ")
      .trim();
  } catch (error) {
    console.error("Extraction Error:", error);
    throw new Error("The PDF could not be parsed. It might be encrypted or corrupted.");
  }
}