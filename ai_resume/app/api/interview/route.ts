import { NextResponse } from "next/server";
import generateInterviewReport from "@/lib/ai.service/google.service"
import { saveToMongo } from "@/server-action/interview";
import { extractPdfText } from "@/lib/pdf-parser";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    const resumeFile = formData.get("resume");
    const selfDescription = formData.get("selfDescription");
    const jobDescription = formData.get("jobDescription");

    if (!(resumeFile instanceof File)) {
      return NextResponse.json(
        { error: "No resume uploaded" },
        { status: 400 }
      );
    }

    if (typeof selfDescription !== "string" || !selfDescription.trim()) {
      return NextResponse.json(
        { error: "Self description is required" },
        { status: 400 }
      );
    }

    if (typeof jobDescription !== "string" || !jobDescription.trim()) {
      return NextResponse.json(
        { error: "Job description is required" },
        { status: 400 }
      );
    }

    if (resumeFile.type !== "application/pdf") {
      return NextResponse.json(
        { error: "Resume must be a PDF file" },
        { status: 400 }
      );
    }

    // Convert File → Buffer
    const arrayBuffer = await resumeFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const resumeText = await extractPdfText(buffer);

    // Generate report
    const interviewReport = await generateInterviewReport({
      resume: resumeText,
      selfDescription,
      jobDescription,
    });

    if (!interviewReport) {
      return NextResponse.json(
        { error: "Failed to generate interview report" },
        { status: 500 }
      );
    }

    const payload = {
      ...interviewReport,
      jobDescription,
      resumeText,
      selfDescription,
    };

    const savedReport = await saveToMongo(payload);

    return NextResponse.json({ data: savedReport }, { status: 201 });

  } catch (error: unknown) {
    console.error("Error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to process PDF";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}