import { z } from "zod";

export interface ManagedModule {
  id: string;
  code: string;
  name: string;
  academicYear: string;
  enrolledStudentsCount: number;
  hasStructureDefined: boolean;
}

export const evaluationMethodSchema = z.object({
  id: z.string().optional(),
  type: z.enum(["CONTINUOUS_ASSESSMENT", "FINAL_EXAM"]),
  name: z.string().min(1, "Evaluation name is required (e.g., Midterm Exam, Assignment 01)"),
  weightage: z.coerce
    .number()
    .min(1, "Weightage must be greater than 0%")
    .max(100, "Weightage cannot exceed 100%"),
  maxMarks: z.coerce.number().min(1, "Maximum obtainable marks must be greater than 0"),
});

export type EvaluationMethodInput = z.infer<typeof evaluationMethodSchema>;