import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6 text-center">
      <h1 className="text-3xl font-extrabold text-slate-950">Access Refused</h1>
      <p className="text-sm text-slate-500 mt-2 max-w-sm">
        Your current gateway credentials do not possess matching RBAC capabilities for this administrative block.
      </p>
      <Link href="/login" className="mt-6 bg-indigo-900 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-sm">
        Return to Login
      </Link>
    </div>
  );
}