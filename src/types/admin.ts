export interface SystemUser {
  id: string;
  email: string;
  fullName: string;
  role: "LECTURER" | "STUDENT" | "ADMIN";
  department: string;
  capabilities: {
    isHOD: boolean;
    isActiveLec: boolean;
    isExamLec: boolean;
  };
}

export interface SystemCourseModule {
  id: string;
  code: string;
  name: string;
  department: string;
  assignedLecturerId: string;
  assignedLecturerName: string;
  totalStudents: number;
}