import { UserRole } from "./auth";

export interface UserSession {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  // Lecturers can have multi-dimensional, overlapping operational permissions
  capabilities: {
    isHOD: boolean;
    isActiveLec: boolean;
    isExamLec: boolean;
  };
  departmentId?: string;
  departmentName?: string;
}

export interface AuthContextType {
  user: UserSession | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (sessionData: UserSession, token: string) => void;
  logout: () => void;
}