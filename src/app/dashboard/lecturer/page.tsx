"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { 
  BookOpen, Plus, Trash2, Save, Loader2, AlertCircle, 
  CheckCircle2, Lock, LayoutDashboard, Sliders, ListOrdered, 
  UserPlus, FileText, ChevronDown, Key, Flame 
} from "lucide-react";
import { LecturerModule, CaComponent, ExamQuestionConfig } from "@/types/hod"; 

interface StudentMarkRow {
  studentIndex: string;
  caMarks: Record<string, number>; // Maps: componentId -> mark (out of 100)
  practicalMark: number;           // Out of 100
  isAbsent: boolean;
}

export default function LecturerConsolePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [modules, setModules] = useState<LecturerModule[]>([]);
  const [activeModule, setActiveModule] = useState<LecturerModule | null>(null);
  
  // Tab Management: 'blueprint' vs 'marksheet'
  const [activeTab, setActiveTab] = useState<"blueprint" | "marksheet">("blueprint");

  // State Contexts
  const [caComponents, setCaComponents] = useState<CaComponent[]>([]);
  const [examQuestions, setExamQuestions] = useState<ExamQuestionConfig[]>([]);
  const [students, setStudents] = useState<StudentMarkRow[]>([]);
  const [newIndexInput, setNewIndexInput] = useState("");

  // Dropdown UI toggle state
  const [isRoleMenuOpen, setIsRoleMenuOpen] = useState(false);

  const [isPageLoading, setIsPageLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Dynamic role verification capabilities matrix fallbacks for testing
  const userCapabilities = user?.capabilities || {
    isHOD: true,      
    isActiveLec: true,
    isExamLec: true
  };

  useEffect(() => {
    async function loadLecturerWorkload() {
      try {
        const res = await fetch("/api/lecturer/modules");
        if (res.ok) {
          const data = await res.json();
          setModules(data);
          if (data.length > 0) selectModuleContext(data[0]);
        }
      } catch (err) {
        console.error("Error linking workload context maps:", err);
      } finally {
        setIsPageLoading(false);
      }
    }
    loadLecturerWorkload();
  }, []);

  const selectModuleContext = async (mod: LecturerModule) => {
    setActiveModule(mod);
    setCaComponents(mod.stats?.caComponents || []);
    
    setExamQuestions(mod.stats?.examTemplate || [
      { id: "Q1", maxMarks: 20 },
      { id: "Q2", maxMarks: 20 },
      { id: "Q3", maxMarks: 20 },
      { id: "Q4", maxMarks: 20 },
      { id: "Q5", maxMarks: 20 }
    ]);

    setFeedbackMsg(null);
    setStudents([]);
    
    try {
      const marksRes = await fetch(`/api/lecturer/marks?moduleCode=${mod.code}`);
      if (marksRes.ok) {
        const marksData = await marksRes.json();
        setStudents(marksData);
      }
    } catch (err) {
      console.error("Error streaming marks tables:", err);
    }
  };

  // Switch workspace dispatcher engine routing logic
  const handleWorkspaceSwitch = (targetDesk: "LECTURER" | "HOD" | "EXAMINER") => {
    setIsRoleMenuOpen(false);
    if (targetDesk === "LECTURER") router.push("/dashboard/lecturer");
    if (targetDesk === "HOD") router.push("/dashboard/hod");
    if (targetDesk === "EXAMINER") router.push("/dashboard/examiner");
  };

  // --- Core CA Blueprint Logic Handlers ---
  const addComponentRow = () => {
    setCaComponents([...caComponents, { id: crypto.randomUUID(), name: "", weightage: 0 }]);
  };
  const removeComponentRow = (id: string) => {
    setCaComponents(caComponents.filter(c => c.id !== id));
  };
  const updateComponentField = (id: string, field: "name" | "weightage", value: string | number) => {
    setCaComponents(caComponents.map(c => c.id === id ? { ...c, [field]: field === "weightage" ? parseInt(value as string, 10) || 0 : value } : c));
  };
  const runningTotalWeight = caComponents.reduce((sum, c) => sum + (c.weightage || 0), 0);

  // --- Core Exam Paper Setup Handlers ---
  const addExamQuestionColumn = () => {
    const nextNumber = examQuestions.length + 1;
    setExamQuestions([...examQuestions, { id: `Q${nextNumber}`, maxMarks: 20 }]);
  };

  const removeExamQuestionColumn = (id: string) => {
    setExamQuestions(examQuestions.filter(q => q.id !== id));
  };

  const updateQuestionMaxMark = (id: string, maxVal: number) => {
    setExamQuestions(examQuestions.map(q => q.id === id ? { ...q, maxMarks: Math.max(0, maxVal) } : q));
  };

  const totalExamPaperMarks = examQuestions.reduce((sum, q) => sum + (q.maxMarks || 0), 0);

  const handleSaveConfiguration = async () => {
    if (!activeModule) return;
    setIsSaving(true);
    setFeedbackMsg(null);

    if (runningTotalWeight !== 100 && caComponents.length > 0) {
      setFeedbackMsg({ type: "error", text: `Validation Block: Components must total 100% (Current: ${runningTotalWeight}%).` });
      setIsSaving(false);
      return;
    }

    try {
      const response = await fetch("/api/lecturer/modules", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ moduleCode: activeModule.code, caComponents, examTemplate: examQuestions })
      });
      const result = await response.json();

      if (response.ok) {
        setFeedbackMsg({ type: "success", text: "CA blueprint definitions and dynamic final examination questions saved successfully." });
        setModules(prev => prev.map(m => m.code === activeModule.code ? { ...m, stats: result.stats } : m));
        setActiveModule(prev => prev ? { ...prev, stats: result.stats } : null);
      }
    } catch (err) {
      setFeedbackMsg({ type: "error", text: "Network communication configuration matrix crash parameters." });
    } finally {
      setIsSaving(false);
    }
  };

// --- Dynamic Marksheet Student Ledger Row Handlers ---
  const addNewStudentRow = () => {
    if (!newIndexInput.trim()) return;
    if (students.some(s => s.studentIndex.toLowerCase() === newIndexInput.trim().toLowerCase())) {
      alert("Student profile index number already allocated inside this marksheet grid matrix.");
      return;
    }
    setStudents([...students, { studentIndex: newIndexInput.trim().toUpperCase(), caMarks: {}, practicalMark: 0, isAbsent: false }]);
    setNewIndexInput(""); // ✨ Fixed case-sensitivity typo here
  };

  const removeStudentRow = (index: string) => {
    setStudents(students.filter(s => s.studentIndex !== index));
  };

  const updateStudentMark = (studentIndex: string, targetKey: "practical" | string, score: number) => {
    setStudents(students.map(s => {
      if (s.studentIndex === studentIndex) {
        if (targetKey === "practical") {
          return { ...s, practicalMark: Math.min(100, Math.max(0, score)) };
        } else {
          return { ...s, caMarks: { ...s.caMarks, [targetKey]: Math.min(100, Math.max(0, score)) } };
        }
      }
      return s;
    }));
  };

  const toggleStudentAbsent = (studentIndex: string) => {
    setStudents(students.map(s => s.studentIndex === studentIndex ? { ...s, isAbsent: !s.isAbsent } : s));
  };

  const handleSaveMarksheetLedger = async () => {
    if (!activeModule) return;
    setIsSaving(true);
    setFeedbackMsg(null);

    try {
      const response = await fetch("/api/lecturer/marks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ moduleCode: activeModule.code, students })
      });

      if (response.ok) {
        setFeedbackMsg({ type: "success", text: "Marksheet data matching verified profiles successfully written to Neon DB." });
      } else {
        const errData = await response.json();
        setFeedbackMsg({ type: "error", text: errData.error || "Failed to commit marksheet rows." });
      }
    } catch (err) {
      setFeedbackMsg({ type: "error", text: "Database connection mapping failure writing batch rows." });
    } finally {
      setIsSaving(false);
    }
  };

  const calculateWeightedCaTotal = (student: StudentMarkRow) => {
    if (student.isAbsent) return "AB";
    let weightedSum = 0;
    caComponents.forEach(comp => {
      const mark = student.caMarks[comp.id] || 0;
      weightedSum += (mark * (comp.weightage / 100));
    });
    return ((weightedSum / 100) * 10).toFixed(1);
  };

  if (isPageLoading) {
    return (
      <div className="min-h-screen bg-cream-canvas flex flex-col justify-center items-center">
        <Loader2 className="h-6 w-6 text-indigo-600 animate-spin" />
        <p className="mt-4 text-[11px] font-bold text-neutral-400 tracking-widest uppercase">Initializing Lecturer Node Context...</p>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-cream-canvas p-4 sm:p-8 text-[#1a1a1a]">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* ==================== TITLE BLOCK HEADER + INTERACTIVE SWITCHER ==================== */}
        <div className="w-full bg-white rounded-2xl premium-border p-6 sm:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 text-[11px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50/60 px-3 py-1 rounded-full border border-indigo-100/50">
              <LayoutDashboard className="h-3 w-3" />
              <span>Active Course Faculty Workspace</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Lecturer Workspace</h1>
            <p className="text-sm text-neutral-500 font-medium">
              Faculty Profile Account: <span className="text-[#1a1a1a] font-semibold underline underline-offset-4 decoration-indigo-500">{user?.fullName || "Prof. Asanka Sanjeewa"}</span>
            </p>
          </div>

          {/* ================= INTERACTIVE ROLE PROFILE SWITCHER DROPDOWN ================= */}
          <div className="relative self-end md:self-center">
            <button 
              onClick={() => setIsRoleMenuOpen(!isRoleMenuOpen)}
              className="flex items-center space-x-3 p-2 pr-4 hover:bg-neutral-50 rounded-xl transition-all border border-neutral-200 bg-white text-left cursor-pointer select-none"
            >
              <div className="h-8 w-8 rounded-lg bg-[#1a1a1a] font-black text-xs text-white flex items-center justify-center uppercase">
                LE
              </div>
              <div className="space-y-0.5">
                <span className="block text-[11px] font-black text-[#1a1a1a] tracking-tight leading-none uppercase">
                  Lecturer Desk
                </span>
                <span className="block text-[10px] text-indigo-600 font-bold">Standard Workspace</span>
              </div>
              <ChevronDown className={`h-3.5 w-3.5 text-neutral-400 transition-transform ${isRoleMenuOpen ? "rotate-180" : ""}`} />
            </button>

            {isRoleMenuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setIsRoleMenuOpen(false)} />
                <div className="absolute right-0 mt-2 w-64 bg-white border border-neutral-200 rounded-xl shadow-xl p-2 z-20 space-y-1 text-xs">
                  <div className="px-3 py-2 border-b border-neutral-100">
                    <span className="block font-black text-[#1a1a1a] tracking-tight">{user?.fullName || "Prof. Asanka Sanjeewa"}</span>
                    <span className="block text-[10px] text-neutral-400 mt-0.5 font-medium">{user?.email || "lec2@wayamba.ac.lk"}</span>
                  </div>
                  
                  <div className="pt-1.5 px-3">
                    <span className="block font-black text-neutral-400 uppercase tracking-wider text-[9px]">Switch Authority Desks</span>
                  </div>

                  {/* Option 1: Standard Lecturer base desk view (Always Active) */}
                  <button 
                    onClick={() => handleWorkspaceSwitch("LECTURER")}
                    className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-all bg-indigo-50 text-indigo-700 font-bold cursor-pointer"
                  >
                    <Sliders className="h-4 w-4 shrink-0 text-indigo-600" />
                    <div className="space-y-0.5">
                      <span className="block">Lecturer Workstation</span>
                      <span className="block text-[10px] text-indigo-400 font-normal">Mark entries & evaluation</span>
                    </div>
                  </button>

                  {/* Option 2: Head of Department Oversight Panel (Conditional) */}
                  {userCapabilities.isHOD && (
                    <button 
                      onClick={() => handleWorkspaceSwitch("HOD")}
                      className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-all text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 cursor-pointer"
                    >
                      <Key className="h-4 w-4 shrink-0 text-neutral-400" />
                      <div className="space-y-0.5">
                        <span className="block">HOD Console Desk</span>
                        <span className="block text-[10px] text-neutral-400 font-normal">Department workflow approvals</span>
                      </div>
                    </button>
                  )}

                  {/* Option 3: Internal Examiner Moderation Panel (Conditional) */}
                  {userCapabilities.isExamLec && (
                    <button 
                      onClick={() => handleWorkspaceSwitch("EXAMINER")}
                      className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-all text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 cursor-pointer"
                    >
                      <Flame className="h-4 w-4 shrink-0 text-neutral-400" />
                      <div className="space-y-0.5">
                        <span className="block">Examiner Moderation Hub</span>
                        <span className="block text-[10px] text-neutral-400 font-normal">Second marking cross-auditing</span>
                      </div>
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* ==================== CORE WORKSPACE MAIN GRID MATRIX ==================== */}
        <div className="w-full grid grid-cols-1 grid-cols-1 lg:grid-cols-4 gap-6 items-start">
          
          {/* Side Module Select Navigator Drawer */}
          <div className="bg-white rounded-2xl premium-border overflow-hidden">
            <div className="p-5 border-b border-neutral-200/60 bg-neutral-50/50 flex items-center space-x-2.5">
              <BookOpen className="h-4 w-4 text-neutral-500" />
              <h2 className="font-bold text-sm uppercase tracking-wider">Your Assigned Modules</h2>
            </div>
            <div className="divide-y divide-neutral-100">
              {modules.map((mod) => {
                const isSelected = activeModule?.code === mod.code;
                return (
                  <button
                    key={mod.id}
                    onClick={() => selectModuleContext(mod)}
                    className={`w-full text-left p-5 transition-all flex justify-between items-center cursor-pointer ${
                      isSelected ? "bg-indigo-50/40 border-r-4 border-indigo-600" : "hover:bg-neutral-50/40"
                    }`}
                  >
                    <div>
                      <p className={`font-bold text-sm ${isSelected ? "text-indigo-600" : "text-[#1a1a1a]"}`}>{mod.code}</p>
                      <p className="text-xs text-neutral-400 font-normal mt-0.5">{mod.name}</p>
                    </div>
                    {mod.isFrozen && <Lock className="h-3.5 w-3.5 text-neutral-400" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Context Workspace Segment Sheets (Dual Tab Layout Frame) */}
          <div className="lg:col-span-3 bg-white rounded-2xl premium-border overflow-hidden">
            {activeModule ? (
              <>
                {/* Tab Navigation Bars Header */}
                <div className="border-b border-neutral-200 bg-neutral-50/50 p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => { setActiveTab("blueprint"); setFeedbackMsg(null); }}
                      className={`inline-flex items-center h-9 px-4 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                        activeTab === "blueprint" ? "bg-[#1a1a1a] text-white border-[#1a1a1a]" : "bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50"
                      }`}
                    >
                      <Sliders className="h-3.5 w-3.5 mr-1.5" /> 1. Setup CA Blueprint
                    </button>
                    <button
                      onClick={() => { setActiveTab("marksheet"); setFeedbackMsg(null); }}
                      className={`inline-flex items-center h-9 px-4 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                        activeTab === "marksheet" ? "bg-[#1a1a1a] text-white border-[#1a1a1a]" : "bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50"
                      }`}
                    >
                      <ListOrdered className="h-3.5 w-3.5 mr-1.5" /> 2. Enter Marks Sheet Ledger
                    </button>
                  </div>
                  {activeModule.isFrozen && (
                    <span className="text-[10px] bg-neutral-100 text-neutral-500 font-bold px-2.5 py-1 rounded border border-neutral-200"><Lock className="h-3 w-3 inline mr-1" /> BLUCOPT LOCKED</span>
                  )}
                </div>

                {/* Main Shared Tab Content Core Window */}
                <div className="p-6">
                  
                  {feedbackMsg && (
                    <div className={`p-4 rounded-xl border flex items-start space-x-2.5 text-xs font-semibold mb-6 ${
                      feedbackMsg.type === "success" ? "bg-indigo-50/50 border-indigo-200 text-indigo-800" : "bg-rose-50/50 border-rose-200 text-rose-800"
                    }`}>
                      {feedbackMsg.type === "success" ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
                      <span>{feedbackMsg.text}</span>
                    </div>
                  )}

                  {/* TAB ONE VIEWPORT PANEL: BLUEPRINT WORKSPACE */}
                  {activeTab === "blueprint" && (
                    <div className="space-y-8">
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Weightage Configuration Rows</label>
                          {!activeModule.isFrozen && (
                            <button onClick={addComponentRow} className="h-7 text-[11px] bg-indigo-50 text-indigo-700 font-bold px-2.5 rounded-md border border-indigo-100 hover:bg-indigo-100/60 transition-colors cursor-pointer flex items-center">
                              <Plus className="h-3 w-3 mr-1" /> Add Component Row
                            </button>
                          )}
                        </div>

                        <div className="space-y-3">
                          {caComponents.map((comp, idx) => (
                            <div key={comp.id} className="flex items-center space-x-3">
                              <span className="text-[11px] font-bold text-neutral-300 w-4 text-center">{idx + 1}</span>
                              <input type="text" disabled={activeModule.isFrozen} placeholder="e.g., Continuous Quiz / Midterm Lab Assessment" value={comp.name} onChange={(e) => updateComponentField(comp.id, "name", e.target.value)} className="flex-1 bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 text-xs font-semibold focus:outline-none focus:border-indigo-500 disabled:opacity-60" />
                              <div className="w-24 relative">
                                <input type="number" min="0" max="100" disabled={activeModule.isFrozen} placeholder="0" value={comp.weightage || ""} onChange={(e) => updateComponentField(comp.id, "weightage", e.target.value)} className="w-full bg-neutral-50 border border-neutral-200 rounded-lg pl-3 pr-7 py-2 text-xs font-bold text-right focus:outline-none focus:border-indigo-500 disabled:opacity-60" />
                                <span className="absolute right-3 top-2.5 text-[10px] font-bold text-neutral-400">%</span>
                              </div>
                              {!activeModule.isFrozen && (
                                <button onClick={() => removeComponentRow(comp.id)} className="p-2 border border-neutral-200 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"><Trash2 className="h-3.5 w-3.5" /></button>
                              )}
                            </div>
                          ))}
                          <div className="flex justify-between items-center p-4 bg-neutral-50 rounded-xl border border-neutral-200/60 text-xs mt-4">
                            <span className="font-bold text-neutral-500">Calculated Blueprint Weight Total:</span>
                            <span className={`font-extrabold text-sm ${runningTotalWeight === 100 ? "text-indigo-600" : "text-rose-600"}`}>{runningTotalWeight}% / 100%</span>
                          </div>
                        </div>
                      </div>

                      {/* Final Examination Dynamic Question Column Allocation Panels */}
                      <div className="pt-6 border-t border-neutral-200/80 space-y-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest flex items-center gap-1.5">
                              <FileText className="h-3.5 w-3.5 text-neutral-400" />
                              Final Examination Structural Questions Schema
                            </label>
                            <p className="text-[11px] text-neutral-400 font-medium mt-0.5">Determine the exact layout matrix parameters for the final script.</p>
                          </div>
                          {!activeModule.isFrozen && (
                            <button onClick={addExamQuestionColumn} className="h-7 text-[11px] bg-amber-50 text-amber-700 font-bold px-2.5 rounded-md border border-amber-100 hover:bg-amber-100/60 transition-colors cursor-pointer flex items-center">
                              <Plus className="h-3 w-3 mr-1" /> Add Question Column
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                          {examQuestions.map((q) => (
                            <div key={q.id} className="bg-neutral-50/60 p-3 rounded-xl border border-neutral-200 flex flex-col justify-between space-y-2 relative group">
                              <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">{q.id} Max Target</span>
                              <div className="relative">
                                <input
                                  type="number"
                                  min="1"
                                  disabled={activeModule.isFrozen}
                                  value={q.maxMarks || ""}
                                  placeholder="20"
                                  onChange={(e) => updateQuestionMaxMark(q.id, parseInt(e.target.value, 10) || 0)}
                                  className="w-full bg-white border border-neutral-200 rounded-lg px-2 py-1.5 text-xs font-bold text-center focus:outline-none focus:border-amber-500 disabled:opacity-60"
                                />
                              </div>
                              {!activeModule.isFrozen && (
                                <button 
                                  onClick={() => removeExamQuestionColumn(q.id)} 
                                  className="absolute -top-1.5 -right-1.5 h-4 w-4 bg-rose-600 text-white rounded-full text-[10px] font-extrabold flex items-center justify-center shadow opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                >
                                  ×
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                        
                        <div className="p-4 bg-amber-50/30 rounded-xl border border-amber-200/50 text-xs flex justify-between font-semibold">
                          <span className="text-neutral-500">Cumulative Script Baseline value (Raw Score Maximum Sum):</span>
                          <span className="font-extrabold text-amber-700 text-sm">{totalExamPaperMarks} Max Score Base</span>
                        </div>
                      </div>

                      {!activeModule.isFrozen && (
                        <div className="flex justify-end pt-4 border-t border-neutral-100">
                          <button onClick={handleSaveConfiguration} disabled={isSaving || (caComponents.length === 0 && examQuestions.length === 0)} className="h-10 text-xs font-bold px-5 bg-[#1a1a1a] text-white hover:bg-neutral-800 rounded-xl cursor-pointer disabled:opacity-40 flex items-center shadow-sm transition-all">
                            {isSaving ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : <Save className="h-3.5 w-3.5 mr-2" />} Save Blueprint
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB TWO VIEWPORT PANEL: MARK SHEET ROW ENTRY LEDGER */}
                  {activeTab === "marksheet" && (
                    <div className="space-y-6">
                      
                      {/* Roster Input Addition Row */}
                      {!activeModule.isFrozen && (
                        <div className="flex max-w-sm space-x-2">
                          <input
                            type="text"
                            placeholder="Enter Student Index No. (e.g., 23001)"
                            value={newIndexInput}
                            onChange={(e) => setNewIndexInput(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && addNewStudentRow()}
                            className="flex-1 bg-neutral-50 border border-neutral-200 rounded-xl px-3.5 text-xs font-bold uppercase tracking-wider focus:outline-none focus:border-indigo-500"
                          />
                          <button onClick={addNewStudentRow} className="h-9 text-xs bg-indigo-600 text-white font-bold px-4 rounded-xl hover:bg-indigo-700 cursor-pointer flex items-center shrink-0">
                            <UserPlus className="h-4 w-4 mr-1.5" /> Allocate Student
                          </button>
                        </div>
                      )}

                      {/* Marks Sheet Grid Interface Layout */}
                      <div className="border border-neutral-200/80 rounded-xl overflow-hidden bg-white">
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse text-xs">
                            <thead>
                              <tr className="bg-neutral-50 text-[10px] font-bold text-neutral-400 uppercase tracking-wider border-b border-neutral-200">
                                <th className="p-4 w-16 text-center">S. No</th>
                                <th className="p-4 w-40">Examination No.</th>
                                {caComponents.map(comp => (
                                  <th key={comp.id} className="p-4 text-center bg-orange-50/30 border-x border-neutral-100 min-w-[100px]">
                                    <p className="truncate max-w-[110px] mx-auto text-neutral-700 font-bold" title={comp.name}>{comp.name}</p>
                                    <p className="text-[9px] text-neutral-400 font-medium mt-0.5">({comp.weightage}%)</p>
                                  </th>
                                ))}
                                <th className="p-4 text-center bg-indigo-50/20 font-bold text-indigo-700 border-x border-neutral-100 min-w-[110px]">
                                  Continuous Assessment<br/><span className="text-[9px] font-medium text-neutral-400">(10%) (A)</span>
                                </th>
                                <th className="p-4 text-center bg-emerald-50/20 font-bold text-emerald-800 min-w-[110px]">
                                  Practical Marks<br/><span className="text-[9px] font-medium text-neutral-400">(30%) (B)</span>
                                </th>
                                <th className="p-4 text-right w-16">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-100 font-semibold text-neutral-700">
                              {students.map((student, idx) => (
                                <tr key={student.studentIndex} className={`hover:bg-neutral-50/40 transition-colors ${student.isAbsent ? "bg-neutral-100/70 text-neutral-400 line-through" : ""}`}>
                                  <td className="p-4 text-center font-bold text-neutral-400">{idx + 1}</td>
                                  <td className="p-4 font-bold text-neutral-900 tracking-wider uppercase">{student.studentIndex}</td>
                                  
                                  {caComponents.map(comp => (
                                    <td key={comp.id} className="p-3 bg-orange-50/10 border-x border-neutral-100/60 text-center">
                                      <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        disabled={activeModule.isFrozen || student.isAbsent}
                                        value={student.caMarks[comp.id] ?? ""}
                                        placeholder="0"
                                        onChange={(e) => updateStudentMark(student.studentIndex, comp.id, parseInt(e.target.value, 10) || 0)}
                                        className="w-16 bg-white border border-neutral-200 rounded px-1.5 py-1 text-center font-bold text-xs focus:outline-none focus:border-orange-400 disabled:opacity-40"
                                      />
                                    </td>
                                  ))}

                                  <td className="p-4 text-center bg-indigo-50/10 border-x border-neutral-100/60 font-bold text-indigo-600 text-sm">
                                    {calculateWeightedCaTotal(student)}
                                  </td>

                                  <td className="p-3 bg-emerald-50/10 text-center">
                                    <input
                                      type="number"
                                      min="0"
                                      max="100"
                                      disabled={activeModule.isFrozen || student.isAbsent}
                                      value={student.practicalMark ?? ""}
                                      placeholder="0"
                                      onChange={(e) => updateStudentMark(student.studentIndex, "practical", parseInt(e.target.value, 10) || 0)}
                                      className="w-16 bg-white border border-neutral-200 rounded px-1.5 py-1 text-center font-bold text-xs focus:outline-none focus:border-emerald-500 disabled:opacity-40"
                                    />
                                  </td>

                                  <td className="p-3 text-right">
                                    <div className="flex items-center justify-end space-x-1">
                                      <button
                                        onClick={() => toggleStudentAbsent(student.studentIndex)}
                                        disabled={activeModule.isFrozen}
                                        className={`px-2 py-1 text-[10px] font-bold rounded cursor-pointer ${student.isAbsent ? "bg-rose-600 text-white" : "bg-neutral-100 text-neutral-500 hover:bg-neutral-200"}`}
                                      >
                                        AB
                                      </button>
                                      {!activeModule.isFrozen && (
                                        <button onClick={() => removeStudentRow(student.studentIndex)} className="p-1 text-neutral-400 hover:text-rose-600 rounded"><Trash2 className="h-3.5 w-3.5" /></button>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              ))}
                              {students.length === 0 && (
                                <tr>
                                  <td colSpan={caComponents.length + 4} className="p-8 text-center text-xs text-neutral-400 italic">No allocations established. Allocate student indices above to construct sheet.</td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Sticky Footer Action Bars */}
                      {!activeModule.isFrozen && (
                        <div className="flex justify-end pt-4 border-t border-neutral-100">
                          <button onClick={handleSaveMarksheetLedger} disabled={isSaving || students.length === 0} className="h-10 text-xs font-bold px-5 bg-[#1a1a1a] text-white hover:bg-neutral-800 rounded-xl cursor-pointer disabled:opacity-40 flex items-center">
                            {isSaving ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : <Save className="h-3.5 w-3.5 mr-2" />} Save Marksheet Ledger
                          </button>
                        </div>
                      )}

                    </div>
                  )}

                </div>
              </>
            ) : (
              <div className="p-12 text-center text-sm text-neutral-400 italic">Select a blueprint from the side roster to configure parameters.</div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}