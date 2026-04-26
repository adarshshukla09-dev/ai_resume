import { readFile, writeFile } from 'node:fs/promises';
import { PDFParse } from 'pdf-parse';


export async function extractPdfText(file: Buffer) {
  const parser = new PDFParse({data:file});
  try { 
const result = await parser.getText();
  await parser.destroy();

    return result.text; 
  } catch (error) {
    console.error("PDF Extraction failed:", error);
 await parser.destroy();
    throw error;
  }
}