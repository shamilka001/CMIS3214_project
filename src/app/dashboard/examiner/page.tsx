"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  ShieldCheck, BookOpen, Save, Loader2, AlertCircle, CheckCircle2, Lock, Sparkles,
  Users, Sliders, AlertTriangle, ChevronDown, Key, Flame
} from "lucide-react";

interface ExaminerStudentRow {
  studentIndex: string;
  examMarksSecond: Record<string, number>; // Q1 -> Q8 tracking
  finalTheoryFirst: number;                // First marker baseline score for reference
  isAbsent: boolean;
}

export default function ExaminerConsolePage() {
  const router = useRouter();
  const [modules, setModules] = useState<any[]>([]);
  const [activeModule, setActiveModule] = useState<any | null>(null);
  const [students, setStudents] = useState<ExaminerStudentRow[]>([]);
  
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Workspace Navigation Menu Dropdown State
  const [isRoleMenuOpen, setIsRoleMenuOpen] = useState(false);

  // Dynamic security capability matrix. Set isHOD to false to see the lock guard activate.
  const userCapabilities = {
    isHOD: false,      
    isActiveLec: true,
    isExamLec: true
  };

  const handleWorkspaceSwitch = (workspace: "LECTURER" | "HOD" | "EXAMINER") => {
    setIsRoleMenuOpen(false);
    if (workspace === "LECTURER") router.push("/dashboard/lecturer");
    if (workspace === "HOD" && userCapabilities.isHOD) router.push("/dashboard/hod");
    if (workspace === "EXAMINER") router.push("/dashboard/examiner");
  };

  // Dynamic sensitivity configuration thresholds
  const [varianceThreshold, setVarianceThreshold] = useState<number>(5);

  const questionsList = ["Q1", "Q2", "Q3", "Q4", "Q5", "Q6", "Q7", "Q8"];

  useEffect(() => {
    async function loadExaminerWorkload() {
      try {
        const res = await fetch("/api/examiner/marks");
        if (res.ok) {
          const data = await res.json();
          setModules(data);
          if (data.length > 0) selectModule(data[0]);
        }
      } catch (err) {
        console.error("Failed handling pipeline handshakes:", err);
      } finally {
        setIsPageLoading(false);
      }
    }
    loadExaminerWorkload();
  }, []);

  const selectModule = async (mod: any) => {
    setActiveModule(mod);
    setFeedback(null);
    try {
      const res = await fetch(`/api/examiner/marks?moduleCode=${mod.code}`);
      if (res.ok) {
        const data = await res.json();
        setStudents(data);
      }
    } catch (err) {
      console.error("Error setting grading matrix window instances:", err);
    }
  };

  const updateQuestionMark = (studentIndex: string, questionKey: string, score: number) => {
    setStudents(students.map(s => {
      if (s.studentIndex === studentIndex) {
        return {
          ...s,
          examMarksSecond: { ...s.examMarksSecond, [questionKey]: Math.min(100, Math.max(0, score)) }
        };
      }
      return s;
    }));
  };

  const calculateRowTotal = (student: ExaminerStudentRow) => {
    if (student.isAbsent) return "AB";
    return questionsList.reduce((sum, q) => sum + (student.examMarksSecond[q] || 0), 0);
  };

  // Variance statistics generators mapping down across the ledger matrices
  const totalStudentsCount = students.length;
  const absentCount = students.filter(s => s.isAbsent).length;
  const activeVarianceCount = students.filter(s => {
    if (s.isAbsent) return false;
    const total = calculateRowTotal(s);
    return Math.abs(s.finalTheoryFirst - (Number(total) || 0)) > varianceThreshold;
  }).length;

  const handleSaveSecondMarking = async () => {
    if (!activeModule) return;
    setIsSaving(true);
    setFeedback(null);

    try {
      const res = await fetch("/api/examiner/marks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ moduleCode: activeModule.code, students })
      });
      if (res.ok) {
        setFeedback({ type: "success", text: "Second marking matrix committed successfully to secure records storage." });
      } else {
        setFeedback({ type: "error", text: "Database rejected second marking packet submission criteria arrays." });
      }
    } catch (err) {
      setFeedback({ type: "error", text: "Network verification handshake fault timed out." });
    } finally {
      setIsSaving(false);
    }
  };

  if (isPageLoading) {
    return (
      <div className="min-h-screen bg-cream-canvas flex flex-col justify-center items-center">
        <Loader2 className="h-6 w-6 text-indigo-600 animate-spin" />
        <p className="mt-4 text-[11px] font-bold text-neutral-400 tracking-widest uppercase">Syncing Examiner Security Profile Access Node...</p>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-cream-canvas p-4 sm:p-8 text-[#1a1a1a]">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Module Header Identity Badge + Enforced Security Dropdown Switcher */}
        <div className="w-full bg-white rounded-2xl premium-border p-6 sm:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 text-[11px] font-bold uppercase tracking-wider text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-100">
              <ShieldCheck className="h-3 w-3" />
              <span>Internal Examiner Moderation Interface Terminal</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Examiner Verification Desk</h1>
            <p className="text-sm text-neutral-500 font-medium">
              Authorized Evaluator Identity Context Account: <span className="text-[#1a1a1a] font-semibold underline underline-offset-4 decoration-amber-500">Dr. Deepani Wijesekara</span>
            </p>
          </div>

          {/* INTERACTIVE DESK ROLE SWITCHER CONFIGURATION */}
          <div className="relative self-end md:self-center">
            <button 
              onClick={() => setIsRoleMenuOpen(!isRoleMenuOpen)}
              className="flex items-center space-x-3 bg-neutral-900 text-white hover:bg-neutral-800 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 cursor-pointer select-none"
            >
              <div className="flex items-center space-x-2">
                <Flame className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                <span>Examiner Hub</span>
              </div>
              <ChevronDown className={`h-3.5 w-3.5 text-neutral-400 transition-transform duration-200 ${isRoleMenuOpen ? "rotate-180" : ""}`} />
            </button>

            {isRoleMenuOpen && (
              <>
                {/* Backdrop Click Shield overlay to cleanly close on clicking outside area */}
                <div className="fixed inset-0 z-40" onClick={() => setIsRoleMenuOpen(false)} />
                
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-neutral-200/70 p-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-3 py-1.5 text-[10px] font-bold text-neutral-400 uppercase tracking-wider select-none border-b border-neutral-100 pb-2 mb-1">
                    Switch Workspaces
                  </div>

                  {/* Option 1: Lecturer Desk Context Selection */}
                  {userCapabilities.isActiveLec && (
                    <button 
                      onClick={() => handleWorkspaceSwitch("LECTURER")}
                      className="w-full flex items-center space-x-3 px-3 py-2 hover:bg-neutral-50 text-left rounded-lg text-neutral-700 transition-colors duration-150 focus:outline-none cursor-pointer"
                    >
                      <Sliders className="h-4 w-4 text-neutral-400" />
                      <div className="space-y-0.5">
                        <span className="block text-xs font-bold text-neutral-800">Lecturer Desk</span>
                        <span className="block text-[10px] text-neutral-400 font-normal">Continuous Assessments & Marks entry</span>
                      </div>
                    </button>
                  )}

                  {/* Option 2: HOD Suite with Enforced Authority Level Guards */}
                  {userCapabilities.isHOD ? (
                    <button 
                      onClick={() => handleWorkspaceSwitch("HOD")}
                      className="w-full flex items-center space-x-3 px-3 py-2 hover:bg-neutral-50 text-left rounded-lg text-neutral-700 transition-colors duration-150 focus:outline-none cursor-pointer"
                    >
                      <Key className="h-4 w-4 text-neutral-400" />
                      <div className="space-y-0.5">
                        <span className="block text-xs font-bold text-neutral-800">HOD Management Suite</span>
                        <span className="block text-[10px] text-neutral-400 font-normal">Curriculum approvals & batch freezing</span>
                      </div>
                    </button>
                  ) : (
                    <div className="w-full flex items-center space-x-3 px-3 py-2 text-left rounded-lg text-neutral-300 bg-neutral-50/40 select-none cursor-not-allowed">
                      <Lock className="h-4 w-4 text-neutral-300 shrink-0" />
                      <div className="space-y-0.5">
                        <span className="block text-xs font-bold text-neutral-400">HOD Management Suite</span>
                        <span className="block text-[10px] text-neutral-300 font-normal leading-tight">Access restricted to Head of Department</span>
                      </div>
                    </div>
                  )}

                  {/* Option 3: Examiner Moderation Desk (Current Selection Status) */}
                  <button 
                    disabled
                    className="w-full flex items-center space-x-3 px-3 py-2 bg-amber-50/50 text-left rounded-lg text-amber-900 opacity-90 cursor-default focus:outline-none mt-1"
                  >
                    <Flame className="h-4 w-4 text-amber-500 fill-amber-500" />
                    <div className="space-y-0.5">
                      <span className="block text-xs font-extrabold text-amber-950">Examiner Hub (Active)</span>
                      <span className="block text-[10px] text-amber-700/70 font-medium">Internal examiner paper verification</span>
                    </div>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Dynamic Analytics & Variance Tuning Controls Desk */}
        {activeModule && (
          <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-5 bg-white rounded-2xl premium-border p-5 shadow-sm">
            <div className="flex items-center space-x-4 p-3 bg-neutral-50/60 rounded-xl border border-neutral-100">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Total Track Roster</p>
                <p className="text-xl font-black text-neutral-800">{totalStudentsCount} <span className="text-xs font-medium text-neutral-400">({absentCount} AB)</span></p>
              </div>
            </div>

            <div className="flex items-center space-x-4 p-3 bg-neutral-50/60 rounded-xl border border-neutral-100">
              <div className={`p-3 rounded-lg ${activeVarianceCount > 0 ? "bg-rose-50 text-rose-600 animate-pulse" : "bg-emerald-50 text-emerald-600"}`}>
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Total Variance Flags</p>
                <p className="text-xl font-black text-neutral-800">
                  {activeVarianceCount} <span className="text-xs font-medium text-neutral-400">raised</span>
                </p>
              </div>
            </div>

            <div className="flex flex-col justify-center px-4 py-2 bg-amber-50/20 rounded-xl border border-amber-100/60">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 flex items-center gap-1">
                  <Sliders className="h-3 w-3" /> Variance Tolerance
                </span>
                <span className="text-xs font-black bg-amber-500 text-white px-1.5 py-0.5 rounded text-center min-w-[24px]">
                  ±{varianceThreshold}
                </span>
              </div>
              <input 
                type="range" 
                min="1" 
                max="20" 
                value={varianceThreshold}
                onChange={(e) => setVarianceThreshold(Number(e.target.value))}
                className="w-full accent-amber-600 h-1.5 bg-neutral-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>
        )}

        <div className="w-full grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
          
          {/* Side Panel: Course Module Allocations */}
          <div className="bg-white rounded-2xl premium-border overflow-hidden">
            <div className="p-5 border-b border-neutral-200/60 bg-neutral-50/50 flex items-center space-x-2.5">
              <BookOpen className="h-4 w-4 text-neutral-500" />
              <h2 className="font-bold text-sm uppercase tracking-wider">Your Moderation Workload</h2>
            </div>
            <div className="divide-y divide-neutral-100">
              {modules.map((mod) => {
                const isSelected = activeModule?.code === mod.code;
                return (
                  <button
                    key={mod.id}
                    onClick={() => selectModule(mod)}
                    className={`w-full text-left p-5 transition-all flex justify-between items-center cursor-pointer ${
                      isSelected ? "bg-amber-50/40 border-r-4 border-amber-500" : "hover:bg-neutral-50/40"
                    }`}
                  >
                    <div>
                      <p className={`font-bold text-sm ${isSelected ? "text-amber-600" : "text-[#1a1a1a]"}`}>{mod.code}</p>
                      <p className="text-xs text-neutral-400 font-normal mt-0.5">{mod.name}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Core Interactive Marks Sheet Grid System Workspace */}
          <div className="lg:col-span-3 bg-white rounded-2xl premium-border overflow-hidden">
            {activeModule ? (
              <>
                <div className="p-5 border-b border-neutral-200 bg-neutral-50/50 flex justify-between items-center">
                  <h3 className="font-bold text-sm uppercase tracking-wider text-neutral-800">
                    Evaluation Moderation Ledger Spreadsheet Matrix: {activeModule.code}
                  </h3>
                </div>

                <div className="p-6 space-y-6">
                  {feedback && (
                    <div className={`p-4 rounded-xl border flex items-start space-x-2.5 text-xs font-semibold ${
                      feedback.type === "success" ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-rose-50 border-rose-200 text-rose-800"
                    }`}>
                      {feedback.type === "success" ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
                      <span>{feedback.text}</span>
                    </div>
                  )}

                  <div className="border border-neutral-200 rounded-xl overflow-hidden bg-white">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-neutral-50 text-[10px] font-bold text-neutral-400 uppercase tracking-wider border-b border-neutral-200 text-center">
                            <th className="p-4 w-12 border-r border-neutral-200">S. No</th>
                            <th className="p-4 w-28 text-left border-r border-neutral-200">Examination No.</th>
                            {questionsList.map(q => (
                              <th key={q} className="p-2 border-r border-neutral-100 bg-amber-50/20 font-semibold text-amber-900 w-12">{q}</th>
                            ))}
                            <th className="p-4 bg-amber-100/40 text-amber-800 font-extrabold w-16 border-r border-neutral-200">Total</th>
                            <th className="p-4 bg-indigo-50 text-indigo-800 font-bold w-24 border-r border-neutral-200">First Marking<br/>(60%) (C)</th>
                            <th className="p-4 bg-emerald-50 text-emerald-800 font-bold w-24">Second Marking<br/>(60%) (D)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100 font-semibold text-center text-neutral-700">
                          {students.map((student, idx) => {
                            const secondTotal = calculateRowTotal(student);
                            const hasVariance = !student.isAbsent && Math.abs(student.finalTheoryFirst - (Number(secondTotal) || 0)) > varianceThreshold;

                            return (
                              <tr key={student.studentIndex} className={`hover:bg-neutral-50/40 transition-colors ${student.isAbsent ? "bg-neutral-100/70 text-neutral-400 line-through" : ""} ${hasVariance ? "bg-rose-50/40 border-l-2 border-rose-500" : ""}`}>
                                <td className="p-4 font-bold text-neutral-400 border-r border-neutral-200">{idx + 1}</td>
                                <td className="p-4 text-left font-bold text-neutral-900 uppercase tracking-wider border-r border-neutral-200">{student.studentIndex}</td>
                                
                                {questionsList.map(q => (
                                  <td key={q} className="p-2 border-r border-neutral-100">
                                    <input
                                      type="number"
                                      min="0"
                                      max="100"
                                      disabled={activeModule.isFrozen || student.isAbsent}
                                      value={student.examMarksSecond[q] ?? ""}
                                      placeholder="0"
                                      onChange={(e) => updateQuestionMark(student.studentIndex, q, parseInt(e.target.value, 10) || 0)}
                                      className="w-10 bg-white border border-neutral-200 rounded py-1 text-center font-bold text-xs focus:outline-none focus:border-amber-400 disabled:opacity-40"
                                    />
                                  </td>
                                ))}

                                <td className="p-4 bg-amber-50/60 font-extrabold text-amber-700 text-xs border-r border-neutral-200">
                                  {secondTotal}
                                </td>

                                <td className="p-4 bg-indigo-50/30 font-bold text-indigo-600 text-xs border-r border-neutral-200">
                                  {student.isAbsent ? "AB" : `${student.finalTheoryFirst || 0}`}
                                </td>

                                <td className="p-4 bg-emerald-50/30 font-bold text-emerald-700 text-xs">
                                  <div className="flex items-center justify-center space-x-1.5">
                                    <span>{student.isAbsent ? "AB" : secondTotal}</span>
                                    {hasVariance && (
                                      <span className="inline-block h-2 w-2 rounded-full bg-rose-500 animate-pulse" title="High score variance detected!" />
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="flex justify-end pt-4 border-t border-neutral-100">
                    <button
                      onClick={handleSaveSecondMarking}
                      disabled={isSaving || students.length === 0}
                      className="h-10 text-xs font-bold px-6 bg-amber-600 text-white hover:bg-amber-700 rounded-xl cursor-pointer disabled:opacity-40 flex items-center transition-colors shadow-sm"
                    >
                      {isSaving ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : <Save className="h-3.5 w-3.5 mr-2" />}
                      Commit Verified Exam Marks Ledger
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="p-12 text-center text-sm text-neutral-400 italic">
                Select an engineering or computation moderation track from the roster view to access second marking question schemas.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}