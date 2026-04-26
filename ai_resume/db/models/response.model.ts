import mongoose, { Schema, models, model } from "mongoose";
import { user } from "../schema";

/**
 * input
 * -job description schema
 * -resume text
 * -self description
 *
 *
 * response
 * -match_score:number
 * -techinical questions :[{question:string, intention :string,answer:string}]
 * -bheavioral questions:[{
 *    question:string,
 *    intention :string,
 *    answer:string,}]
 * -skillgaps:[{skill:string,serverity:{type:string,
 * enum:[low,medium,high]},description:string}]
 * -prepartion plan:[{
 * day:number,
 * focus:string,
 * task:[string]
 * }]
 */

const technicalQuestionsSchema = new Schema(
  {
    question: {
      type: String,
      required: [true, "techincal question is required"],
    },
    intention: { type: String, required: [true, "intention is required"] },
    answer: { type: String, required: [true, "answer is required"] },
  },
  { _id: false },
);

const behavioralQuestionsSchema = new Schema(
  {
    question: {
      type: String,
      required: [true, "behavioral question is required"],
    },
    intention: { type: String, required: [true, "intention is required"] },
    answer: { type: String, required: [true, "answer is required"] },
  },
  { _id: false },
);
const skillGapsSchema = new Schema(
  {
    skill: { type: String, required: [true, "skill is required"] },
    severity: {
      type: String,
      enum: ["Low", "Medium", "High"], // 1. Fixed Casing
    },
    description: { type: String, required: [true, "description is required"] }, // 2. Ensure Zod sends this!
  },
  { _id: false },
);

const preparationPlanSchema = new Schema(
  {
    day: { type: Number, required: [true, "day is required"] },
    focus: { type: String, required: [true, "focus is required"] },
    tasks: [{ type: String }], // 3. Changed 'task' to 'tasks' to match Zod
  },
  { _id: false },
);
const interviewReportSchema = new Schema({
  jobDescription: { type: String, required: true },
  resumeText: { type: String },
  selfDescription: { type: String, required: true },
  matchScore: { type: Number, min: 0, max: 100 },
  technicalQuestions: [technicalQuestionsSchema],
  behavioralQuestions: [behavioralQuestionsSchema],
  skillGaps: [skillGapsSchema],
  preparationPlan: [preparationPlanSchema],
  // userId: { type: String, required: true },
});

const InterviewReport =
  models.InterviewReport || model("InterviewReport", interviewReportSchema);
export default InterviewReport;
