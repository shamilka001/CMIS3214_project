"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { UserRole } from "@/types/auth";
import { Loader2 } from "lucide-react";

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  requiredCapability?: "isHOD" | "isActiveLec" | "isExamLec";
}

export default function RoleGuard({ children, allowedRoles, requiredCapability }: RoleGuardProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  // Standardize allowedRoles to a string sequence to prevent re-reference loops
  const rolesSignature = allowedRoles?.join(",") || "";

  useEffect(() => {
    if (isLoading) return; // Wait until loading states resolve completely

    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    if (user) {
      // Step A: Parse and check against verified role strings
      if (allowedRoles && !allowedRoles.includes(user.role)) {
        router.push("/unauthorized");
        return;
      }

      // Step B: Structural fallback safety map for capabilities verification
      if (requiredCapability) {
        const hasCapability = user.capabilities && user.capabilities[requiredCapability];
        if (!hasCapability) {
          router.push("/unauthorized");
          return;
        }
      }
    }
  }, [isLoading, isAuthenticated, user, rolesSignature, requiredCapability, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-cream-canvas flex flex-col justify-center items-center">
        <Loader2 className="h-6 w-6 text-indigo-600 animate-spin" />
        <p className="mt-4 text-[11px] font-bold text-neutral-400 tracking-widest uppercase">
          Verifying Authority Credentials...
        </p>
      </div>
    );
  }

  // Double render blocker loop checks to avoid layout flickering
  if (!isAuthenticated) return null;
  if (user && allowedRoles && !allowedRoles.includes(user.role)) return null;
  if (user && requiredCapability && (!user.capabilities || !user.capabilities[requiredCapability])) return null;

  return <>{children}</>;
}