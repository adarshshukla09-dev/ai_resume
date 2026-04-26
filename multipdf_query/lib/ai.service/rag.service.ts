import { extractPdfText } from "../pdf-parser"



export async function pdfToText(formdata: FormData) {
    try {
     const pdf = await formdata.get("file")

   if (!pdf || !(pdf instanceof File)) {
            throw new Error("No valid PDF file uploaded");
        }
  const arrayBuffer = await pdf.arrayBuffer();
        const uint8Array: Uint8Array<ArrayBuffer> = new Uint8Array(arrayBuffer);
           const textFromPdf = await extractPdfText(uint8Array as Buffer);

        return { success: true, text: textFromPdf };
  } catch (error) {
        console.error("Indexing error:", error);
        return { success: false, error:error instanceof Error ? error.message :"Something went wrong"};
    }
}


