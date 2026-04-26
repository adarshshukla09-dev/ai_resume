import InterviewReport from "@/db/models/response.model";
import { connectDB } from "@/lib/mongoose";
import interviewReportSchema from "@/lib/Vaildator";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    await connectDB();

    const body = await req.json();

    const vaildatedData = await interviewReportSchema.safeParseAsync(body);

    if (!vaildatedData.success) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }

    const newReport = await InterviewReport.create({
      ...vaildatedData.data,
      jobDescription: body.jobDescription,
      resumeText: body.resumeText,
      selfDescription: body.selfDescription,
      userId: body.userId,
    });
   return NextResponse.json(newReport, { status: 201 });

  } catch (error: any) {
    // If Zod validation fails, it throws an error that we catch here
    return NextResponse.json(
      { error: error.errors || error.message }, 
      { status: 400 }
    );
  }
}