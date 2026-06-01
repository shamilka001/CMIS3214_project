"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AuthContextType, UserSession } from "@/types/user";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserSession | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const router = useRouter();

  // Development Session Initializer Matrix
  useEffect(() => {
    setUser({
      id: "admin-root",
      email: "admin.security@wyb.ac.lk",
      fullName: "System Root Administrator",
      role: "ADMIN", // Switched to ADMIN role to test the Admin Management interface
      capabilities: {
        isHOD: false,
        isActiveLec: false,
        isExamLec: false
      }
    });
    setIsLoading(false);
  }, []);

  const login = (sessionData: UserSession, token: string) => {
    setIsLoading(true);
    localStorage.setItem("weg_auth_token", token);
    localStorage.setItem("weg_user_session", JSON.stringify(sessionData));
    setUser(sessionData);
    setIsLoading(false);

    // Context-level automated routing matrix based on base identity role
    if (sessionData.role === "ADMIN") router.push("/dashboard/admin");
    else if (sessionData.role === "STUDENT") router.push("/dashboard/student");
    else if (sessionData.role === "LECTURER") {
      if (sessionData.capabilities.isHOD) router.push("/dashboard/hod");
      else router.push("/dashboard/lecturer");
    }
  };

  const logout = () => {
    localStorage.removeItem("weg_auth_token");
    localStorage.removeItem("weg_user_session");
    setUser(null);
    router.push("/login");
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider setup");
  }
  return context;
}