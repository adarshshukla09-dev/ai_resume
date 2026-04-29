import { pdfQueue } from "@/lib/queue";
import { writeFile } from "fs/promises";
import path from "path";


export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const files = formData.getAll("files") as File[];

    for (const file of files) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const filePath = path.join(process.cwd(), "public", file.name);

      await writeFile(filePath, buffer);

await pdfQueue.add("process-pdf", {
  filePath,
  fileName: file.name,
});    }

    return Response.json(
      { message: "Files uploaded successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error(error);

    return Response.json(
      { error: "Upload failed" },
      { status: 500 }
    );
  }
}