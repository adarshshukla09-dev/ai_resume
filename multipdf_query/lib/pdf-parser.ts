// lib/pdf-loader.ts
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";

export async function loadPdf(buffer: Buffer) {
  // Write buffer to temp file (required by loader)
  const fs = await import("fs/promises");
  const path = `/tmp/${Date.now()}.pdf`;

  await fs.writeFile(path, buffer);

  const loader = new PDFLoader(path);
  const docs = await loader.load();

  // Cleanup temp file
  await fs.unlink(path);

  return docs;
}