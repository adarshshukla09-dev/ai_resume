"use server";

import InterviewReport from "@/db/models/response.model";
import { connectDB } from "@/lib/mongoose";
import interviewReportSchema, { Report } from "@/lib/Vaildator";

 export interface ReportProps extends Report {
  jobDescription: string;
  resumeText: string;
  selfDescription: string;
  
}

export async function saveToMongo(data:ReportProps) {
  await connectDB();

  const vaildatedData = await interviewReportSchema.safeParseAsync(data);

  if (!vaildatedData.success) {
    throw new Error("Invalid report payload");
  }

  const newReport = await InterviewReport.create({
    ...vaildatedData.data,
    jobDescription: data.jobDescription,
    resumeText: data.resumeText,
    selfDescription: data.selfDescription,
  });

  return newReport;
}