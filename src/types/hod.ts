export interface CaComponent {
  id: string;
  name: string;        // e.g., "Assignment 01", "Midterm Exam"
  weightage: number;   // e.g., 20, 40 (Percentage)
}

// Configuration format for dynamic final exam paper distributions
export interface ExamQuestionConfig {
  id: string;          // e.g., "Q1", "Q2"
  maxMarks: number;    // e.g., 20, 25 (Raw score limit)
}

export interface DepartmentLecturer {
  id: string | number; // Support DB SERIAL integers
  fullName: string;
  email: string;
  capabilities?: {
    isActiveLec: boolean;
    isExamLec: boolean;
  };
  activeModules?: string[]; // Tracks assignments for faculty view
  examModules?: string[];   // Tracks assignments for faculty view
}

export interface DepartmentModule {
  id: string | number; // Support DB SERIAL integers
  code: string;
  name: string;
  credits: number;
  isFrozen: boolean;
  assignedActiveLec?: { 
    id: string | number; 
    fullName: string; 
  } | null;
  assignedExamLec?: { 
    id: string | number; 
    fullName: string; 
  } | null;
  stats: {
    caCompletionRate: number; // Percentage
    moderationStatus: "PENDING" | "MODERATING" | "VERIFIED";
    caComponents?: CaComponent[]; // Shareable CA weightages list
    // Shared configuration mapping question templates set by the Active Lecturer
    examTemplate?: ExamQuestionConfig[]; 
  };
}

// Export type alias so lecturer-specific code remains highly readable
export type LecturerModule = DepartmentModule;