export interface ModerationTask {
  id: string;
  moduleCode: string;
  moduleName: string;
  academicTerm: string;
  submittedBy: string;
  totalPapers: number;
  sampleSize: number;
  status: "PENDING_REVIEW" | "UNDER_MODERATION" | "FLAGGED" | "APPROVED";
  marksDistributionAnomalies: boolean;
}

export interface StudentQuestionMarkRow {
  studentRegNo: string;
  questionMarks: Record<string, number>; // e.g., { "Q1": 15, "Q2": 18 }
  calculatedTotal: number;
  examinerRemarks?: string;
}