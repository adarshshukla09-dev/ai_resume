import { z } from "zod";

const interviewReportSchema = z.object({
  matchScore: z
    .number()
    .min(0)
    .max(100)
    .describe(
      "Percentage match between the candidate's profile and the job description",
    ),

  technicalQuestions: z
    .array(
      z.object({
        question: z
          .string()
          .describe("The specific technical question to be asked"),
        intention: z
          .string()
          .describe(
            "The core concept or skill the interviewer is trying to evaluate",
          ),
        answer: z
          .string()
          .describe(
            "A comprehensive model answer including key technical points",
          ),
      }),
    )
    .describe(
      "List of technical questions tailored to the candidate's resume and job role",
    ),

  behavioralQuestions: z
    .array(
      z.object({
        question: z.string().describe("The behavioral or situational question"),
        intention: z
          .string()
          .describe(
            "The soft skill (leadership, conflict resolution, etc.) being tested",
          ),
        answer: z
          .string()
          .describe(
            "Suggested response using the STAR method (Situation, Task, Action, Result)",
          ),
      }),
    )
    .describe(
      "List of behavioral questions based on past experiences and culture fit",
    ),

  skillGaps: z
    .array(
      z.object({
        skill:
         z.string()
          .describe(
            "The specific technical or soft skill that is missing or weak",
          ),
          description: z.string().describe("The description of the skill gap"),
        severity: z
          .enum(["Low", "Medium", "High"])
          .describe("The impact of this gap on the job performance"),
      }),
    )
    .describe(
      "Identified areas where the candidate needs improvement to meet job requirements",
    ),

  preparationPlan: z
    .array(
      z.object({
        day: z.number().int().min(1).describe("The day number in the roadmap"),
        focus: z
          .string()
          .describe(
            "The primary topic for the day (e.g., 'System Design' or 'React Hooks')",
          ),
        tasks: z
          .array(z.string())
          .describe("Actionable steps or study materials to complete"),
      }),
    )
    .describe(
      "A structured day-by-day roadmap to bridge skill gaps and prepare for the interview",
    ),
});
 export type Report = z.infer<typeof  interviewReportSchema
>;

export default interviewReportSchema;