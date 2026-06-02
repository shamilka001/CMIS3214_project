"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { 
  Users, 
  BookOpen, 
  Lock, 
  Unlock, 
  CheckCircle, 
  Loader2, 
  Layers,
  TrendingUp,
  Shield,
  Edit3,
  X,
  Filter,
  GraduationCap,
  FileCheck,
  ChevronDown,
  UploadCloud,
  FileText,
  AlertCircle,
  Clock,
  CheckSquare
} from "lucide-react";

interface LecturerData {
  id: string | number;
  fullName: string;
  email: string;
  activeModules: string[];
  examModules: string[];
}

interface ModuleData {
  id: string | number;
  code: string;
  name: string;
  credits: number;
  isFrozen: boolean;
  assignedActiveLec?: { id: string | number; fullName: string } | null;
  assignedExamLec?: { id: string | number; fullName: string } | null;
  stats: {
    caCompletionRate: number;
    moderationStatus: "PENDING" | "MODERATING" | "VERIFIED";
  };
}

type FilterMode = "ALL" | "MODULES" | "LECTURERS" | "FROZEN";
type SystemRole = "HOD" | "LECTURER" | "EXAMINER";
type LecturerSubMenu = "OVERVIEW" | "MARK_ENTRY" | "CURVES";
type ExaminerSubMenu = "PENDING_REVIEWS" | "VERIFIED_REGISTRY";

export default function HodConsolePage() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [lecturers, setLecturers] = useState<LecturerData[]>([]);
  const [modules, setModules] = useState<ModuleData[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Active Main Console Role Map
  const [activeRole, setActiveRole] = useState<SystemRole>("HOD");
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);

  // Sub-Menu Navigation states for matching personal page layouts
  const [lecSubMenu, setLecSubMenu] = useState<LecturerSubMenu>("OVERVIEW");
  const [exSubMenu, setExSubMenu] = useState<ExaminerSubMenu>("PENDING_REVIEWS");

  // HOD Filter Matrix State
  const [activeFilter, setActiveFilter] = useState<FilterMode>("ALL");

  // Modal Workspace States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLecturer, setSelectedLecturer] = useState<LecturerData | null>(null);
  const [modalActiveCodes, setModalActiveCodes] = useState<string[]>([]);
  const [modalExamCodes, setModalExamCodes] = useState<string[]>([]);

  const currentUserName = user?.fullName || "Dr. Charith Kapukotuwa";

  async function refreshDashboardData() {
    try {
      const [lecsRes, modsRes] = await Promise.all([
        fetch("/api/hod/lecturers"),
        fetch("/api/hod/modules")
      ]);
      if (lecsRes.ok && modsRes.ok) {
        setLecturers(await lecsRes.json());
        setModules(await modsRes.json());
      }
    } catch (error) {
      console.error("Error linking dashboard resources:", error);
    } finally {
      setIsDataLoading(false);
    }
  }

  useEffect(() => {
    refreshDashboardData();
    const handleClickOutside = () => setIsRoleDropdownOpen(false);
    window.addEventListener("click", handleClickOutside);
    return () => window.removeEventListener("click", handleClickOutside);
  }, []);

  // --- HOD Operations ---
  const openEditModal = (lec: LecturerData) => {
    setSelectedLecturer(lec);
    setModalActiveCodes([...lec.activeModules]);
    setModalExamCodes([...lec.examModules]);
    setIsModalOpen(true);
  };

  const handleSaveAssignments = async () => {
    if (!selectedLecturer) return;
    setUpdatingId("modal-save");
    try {
      const response = await fetch("/api/hod/lecturers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lecturerId: selectedLecturer.id,
          activeModuleCodes: modalActiveCodes,
          examModuleCodes: modalExamCodes
        }),
      });
      if (response.ok) {
        await refreshDashboardData();
        setIsModalOpen(false);
        setSelectedLecturer(null);
      }
    } catch (err) {
      console.error("Error archiving module shifts:", err);
    } finally {
      setUpdatingId(null);
    }
  };

  const toggleModuleFreeze = async (code: string) => {
    setUpdatingId(`freeze-${code}`);
    const targetModule = modules.find(m => m.code === code);
    const nextFreezeState = !targetModule?.isFrozen;
    try {
      const response = await fetch("/api/hod/modules", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, isFrozen: nextFreezeState }),
      });
      if (response.ok) {
        setModules(prev => prev.map(mod => mod.code === code ? { ...mod, isFrozen: nextFreezeState } : mod));
      }
    } catch (err) {
      console.error("Database operation failure:", err);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleCheckboxChange = (code: string, list: string[], setList: React.Dispatch<React.SetStateAction<string[]>>) => {
    if (list.includes(code)) {
      setList(list.filter(item => item !== code));
    } else {
      setList([...list, code]);
    }
  };

  // --- Workspace Allocation Inferences ---
  const dynamicLecturerModules = modules.filter(m => m.assignedActiveLec?.fullName === currentUserName);
  const dynamicExaminerModules = modules.filter(m => m.assignedExamLec?.fullName === currentUserName);

  const filteredHodModules = modules.filter(m => {
    if (activeFilter === "FROZEN") return m.isFrozen;
    return true;
  });

  const getRoleIcon = (role: SystemRole) => {
    switch (role) {
      case "HOD": return <Shield className="h-4 w-4 text-indigo-600" />;
      case "LECTURER": return <GraduationCap className="h-4 w-4 text-emerald-600" />;
      case "EXAMINER": return <FileCheck className="h-4 w-4 text-amber-600" />;
    }
  };

  if (isAuthLoading || isDataLoading) {
    return (
      <div className="min-h-screen bg-cream-canvas flex flex-col justify-center items-center">
        <Loader2 className="h-6 w-6 text-indigo-600 animate-spin" />
        <p className="mt-4 text-[11px] font-bold text-neutral-400 tracking-widest uppercase">Loading Matrix Engine...</p>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-cream-canvas text-[#1a1a1a]">
      
      {/* Top Navigation Frame Container */}
      <div className="w-full bg-white border-b border-neutral-200/80 sticky top-0 z-40 px-4 sm:px-8 py-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-neutral-900 text-white rounded-xl flex items-center justify-center font-bold text-lg tracking-tight">
              Ω
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-tight">OUM Management</h2>
              <p className="text-[11px] text-neutral-400 font-medium">Session Identity &bull; {currentUserName}</p>
            </div>
          </div>

          {/* Core Multi-Role Page Switcher Dropdown */}
          <div className="relative w-full sm:w-64" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
              className="w-full bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 rounded-xl px-4 py-2.5 flex items-center justify-between text-xs font-bold text-neutral-800 shadow-3xs transition-all cursor-pointer focus:outline-none"
            >
              <div className="flex items-center space-x-2">
                {getRoleIcon(activeRole)}
                <span>Portal: {activeRole === "HOD" ? "HOD Control Panel" : activeRole === "LECTURER" ? "Lecturer Desk" : "Examiner Board"}</span>
              </div>
              <ChevronDown className={`h-4 w-4 text-neutral-400 transition-transform duration-200 ${isRoleDropdownOpen ? "rotate-180" : ""}`} />
            </button>

            {isRoleDropdownOpen && (
              <div className="absolute right-0 mt-2 w-full bg-white border border-neutral-200 rounded-xl shadow-lg overflow-hidden z-50 divide-y divide-neutral-100 animate-fadeIn">
                {(["HOD", "LECTURER", "EXAMINER"] as SystemRole[]).map((role) => (
                  <button
                    key={role}
                    onClick={() => {
                      setActiveRole(role);
                      setIsRoleDropdownOpen(false);
                    }}
                    className={`w-full px-4 py-3 text-left text-xs font-bold flex items-center space-x-2.5 transition-colors cursor-pointer ${
                      activeRole === role ? "bg-neutral-50 text-neutral-900" : "text-neutral-600 hover:bg-neutral-50/50"
                    }`}
                  >
                    {getRoleIcon(role)}
                    <span>{role === "HOD" ? "Head of Department Suite" : role === "LECTURER" ? "My Lecturer Workspace" : "My External Examiner Registry"}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Console Workspace Container */}
      <div className="max-w-7xl mx-auto p-4 sm:p-8 space-y-8">

        {/* ==================== WORKFLOW CONTEXT 1: MASTER HOD CONSOLE ==================== */}
        {activeRole === "HOD" && (
          <div className="space-y-8 animate-fadeIn">
            <div className="space-y-1">
              <h1 className="text-2xl font-bold tracking-tight">Department Administration Matrix</h1>
              <p className="text-xs text-neutral-500 font-medium">Overarching allocation architectures and freeze controls.</p>
            </div>

            {/* HOD Metric Matrix Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { id: "MODULES" as FilterMode, title: "Monitored Modules", val: modules.length, icon: <BookOpen className="h-4 w-4" /> },
                { id: "LECTURERS" as FilterMode, title: "Faculty Lecturers", val: lecturers.length, icon: <Users className="h-4 w-4" /> },
                { id: "FROZEN" as FilterMode, title: "Frozen Blueprints", val: modules.filter(m => m.isFrozen).length, icon: <Lock className="h-4 w-4" /> },
                { id: "ALL" as FilterMode, title: "Avg Target Health", val: "94.2%", icon: <TrendingUp className="h-4 w-4" />, static: true }
              ].map((card) => (
                <div 
                  key={card.title}
                  onClick={() => !card.static && setActiveFilter(prev => prev === card.id ? "ALL" : card.id)}
                  className={`bg-white p-5 rounded-xl premium-border flex flex-col justify-between aspect-square cursor-pointer transition-all ${
                    activeFilter === card.id ? "ring-2 ring-indigo-500 bg-indigo-50/10" : ""
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-bold tracking-wider text-neutral-400 uppercase">{card.title}</span>
                    <div className="p-2 bg-neutral-100 rounded-lg text-neutral-700">{card.icon}</div>
                  </div>
                  <h3 className="text-4xl font-bold tracking-tight">{card.val}</h3>
                </div>
              ))}
            </div>

            {/* Twin Tables Group */}
            <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 items-start">
              <div className={`xl:col-span-3 bg-white rounded-xl premium-border overflow-hidden ${activeFilter === "LECTURERS" ? "opacity-30 pointer-events-none" : ""}`}>
                <div className="p-4 bg-neutral-50 border-b border-neutral-200/60 font-bold text-xs uppercase tracking-wider text-neutral-500">Module Blueprint Manifest</div>
                <table className="w-full text-left text-xs font-medium">
                  <tbody>
                    {filteredHodModules.map(mod => (
                      <tr key={mod.id} className="border-b border-neutral-100 hover:bg-neutral-50/50">
                        <td className="p-4"><strong className="text-sm font-bold block">{mod.code}</strong><span className="text-neutral-400">{mod.name}</span></td>
                        <td className="p-4 text-neutral-500">Lec: <span className="text-neutral-800 font-semibold">{mod.assignedActiveLec?.fullName || "None"}</span><br/>Exam: <span className="text-neutral-800 font-semibold">{mod.assignedExamLec?.fullName || "None"}</span></td>
                        <td className="p-4 text-right">
                          <button onClick={() => toggleModuleFreeze(mod.code)} className="px-3 py-1 bg-white border border-neutral-300 rounded-full font-bold">
                            {mod.isFrozen ? "Unfreeze" : "Freeze"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className={`xl:col-span-2 bg-white rounded-xl premium-border overflow-hidden ${activeFilter === "FROZEN" ? "opacity-30 pointer-events-none" : ""}`}>
                <div className="p-4 bg-neutral-50 border-b border-neutral-200/60 font-bold text-xs uppercase tracking-wider text-neutral-500">Academic Faculty Roster</div>
                <table className="w-full text-left text-xs font-medium">
                  <tbody>
                    {lecturers.map(lec => (
                      <tr key={lec.id} className="border-b border-neutral-100 hover:bg-neutral-50/50">
                        <td className="p-4"><strong>{lec.fullName}</strong><p className="text-neutral-400">{lec.email}</p></td>
                        <td className="p-4 text-right">
                          <button onClick={() => openEditModal(lec)} className="px-3 py-1 bg-white border border-neutral-300 rounded-full font-bold">Manage</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}


        {/* ==================== WORKFLOW CONTEXT 2: LECTURER PAGE IMPLEMENTATION ==================== */}
        {activeRole === "LECTURER" && (
          <div className="space-y-6 animate-fadeIn">
            
            {/* MATCHING LECTURER SUB-MENU BAR */}
            <div className="w-full bg-white border border-neutral-200 rounded-xl p-1.5 flex items-center space-x-2">
              {[
                { id: "OVERVIEW" as LecturerSubMenu, label: "Course Workload Matrix", icon: <Layers className="h-3.5 w-3.5" /> },
                { id: "MARK_ENTRY" as LecturerSubMenu, label: "Continuous Assessment Entry", icon: <UploadCloud className="h-3.5 w-3.5" /> },
                { id: "CURVES" as LecturerSubMenu, label: "Grading Analytics & Curves", icon: <TrendingUp className="h-3.5 w-3.5" /> }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setLecSubMenu(tab.id)}
                  className={`flex items-center space-x-2 px-4 py-2 text-xs font-bold rounded-lg cursor-pointer transition-all ${
                    lecSubMenu === tab.id 
                      ? "bg-emerald-600 text-white shadow-sm" 
                      : "text-neutral-600 hover:bg-neutral-50"
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Submenu Desk View Component Switcher */}
            {lecSubMenu === "OVERVIEW" && (
              <div className="bg-white rounded-xl premium-border overflow-hidden">
                <div className="p-4 bg-emerald-50/40 border-b border-neutral-200/60 font-bold text-xs uppercase tracking-wider text-emerald-800">
                  Allocated Academic Teaching Rows ({dynamicLecturerModules.length})
                </div>
                <div className="p-6 divide-y divide-neutral-100">
                  {dynamicLecturerModules.length === 0 ? (
                    <p className="text-xs text-neutral-400 italic py-4">You are not cataloged as an active class lecturer for any modules this semester.</p>
                  ) : dynamicLecturerModules.map(mod => (
                    <div key={mod.id} className="py-4 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                      <div>
                        <span className="text-sm font-bold text-neutral-900 block">{mod.code} &bull; {mod.name}</span>
                        <span className="text-xs text-neutral-400 font-medium">Assigned External Script Reviewer: {mod.assignedExamLec?.fullName || "Unallocated"}</span>
                      </div>
                      <div className="flex items-center space-x-6">
                        <div className="text-left sm:text-right">
                          <p className="text-[10px] uppercase font-bold text-neutral-400 tracking-tight">CA Status</p>
                          <p className="text-xs font-bold text-neutral-800">{mod.stats.caCompletionRate}% Complete</p>
                        </div>
                        {mod.isFrozen ? (
                          <span className="text-xs text-neutral-400 font-semibold bg-neutral-100 px-3 py-1 rounded-full flex items-center">
                            <Lock className="h-3 w-3 mr-1" /> Schema Frozen
                          </span>
                        ) : (
                          <button onClick={() => setLecSubMenu("MARK_ENTRY")} className="px-3 py-1 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 rounded-md text-xs font-bold">
                            Manage Submissions
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {lecSubMenu === "MARK_ENTRY" && (
              <div className="bg-white rounded-xl premium-border p-6 space-y-4">
                <div className="flex items-center space-x-2 text-amber-600">
                  <AlertCircle className="h-4 w-4" />
                  <h3 className="font-bold text-sm">Active Marksheet Workspace</h3>
                </div>
                <p className="text-xs text-neutral-500 max-w-xl">
                  Select an active class module below to append, import, or re-verify grading marks before sending sheets to internal examiners for board signature.
                </p>
                <div className="border border-neutral-200 rounded-xl divide-y divide-neutral-100">
                  {dynamicLecturerModules.map(m => (
                    <div key={m.code} className="p-4 flex justify-between items-center bg-neutral-50/30">
                      <div>
                        <span className="font-bold text-xs">{m.code} Marksheet Blueprint</span>
                        <p className="text-[11px] text-neutral-400">Continuous Assessment Suite &bull; Weight 40%</p>
                      </div>
                      <button disabled={m.isFrozen} className="bg-white hover:bg-neutral-50 text-xs border border-neutral-300 px-3 py-1.5 rounded-lg font-bold disabled:opacity-40">
                        {m.isFrozen ? "Locked by HOD" : "Open CSV Buffer"}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {lecSubMenu === "CURVES" && (
              <div className="bg-white rounded-xl premium-border p-8 text-center space-y-3">
                <div className="w-12 h-12 bg-neutral-100 rounded-full flex items-center justify-center text-neutral-400 mx-auto">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <h4 className="font-bold text-sm">Grading Distribution Gaussian Engine</h4>
                <p className="text-xs text-neutral-400 max-w-sm mx-auto">
                  Data clustering analysis and standard deviation bell curves compile dynamically once continuous assignment logs cross a 100% threshold.
                </p>
              </div>
            )}
          </div>
        )}


        {/* ==================== WORKFLOW CONTEXT 3: EXAMINER PAGE IMPLEMENTATION ==================== */}
        {activeRole === "EXAMINER" && (
          <div className="space-y-6 animate-fadeIn">
            
            {/* MATCHING EXAMINER SUB-MENU BAR */}
            <div className="w-full bg-white border border-neutral-200 rounded-xl p-1.5 flex items-center space-x-2">
              {[
                { id: "PENDING_REVIEWS" as ExaminerSubMenu, label: "Awaiting Assessment Verification", icon: <Clock className="h-3.5 w-3.5" /> },
                { id: "VERIFIED_REGISTRY" as ExaminerSubMenu, label: "Signed Mod Registry History", icon: <CheckSquare className="h-3.5 w-3.5" /> }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setExSubMenu(tab.id)}
                  className={`flex items-center space-x-2 px-4 py-2 text-xs font-bold rounded-lg cursor-pointer transition-all ${
                    exSubMenu === tab.id 
                      ? "bg-amber-600 text-white shadow-sm" 
                      : "text-neutral-600 hover:bg-neutral-50"
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Submenu Board View Component Switcher */}
            {exSubMenu === "PENDING_REVIEWS" && (
              <div className="bg-white rounded-xl premium-border overflow-hidden">
                <div className="p-4 bg-amber-50/40 border-b border-neutral-200/60 font-bold text-xs uppercase tracking-wider text-amber-800">
                  Assigned Script Framework Packages ({dynamicExaminerModules.filter(m => m.stats.moderationStatus !== "VERIFIED").length})
                </div>
                <div className="p-4 divide-y divide-neutral-100">
                  {dynamicExaminerModules.length === 0 ? (
                    <p className="text-xs text-neutral-400 italic py-4 p-2">You are not listed as an active moderation internal examiner for this semester.</p>
                  ) : dynamicExaminerModules.map(mod => (
                    <div key={mod.id} className="py-4 flex justify-between items-center">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-bold text-neutral-900">{mod.code}</span>
                          <span className="text-[10px] px-2 py-0.5 bg-neutral-100 text-neutral-500 rounded font-bold uppercase">{mod.stats.moderationStatus}</span>
                        </div>
                        <span className="text-xs text-neutral-400 block mt-0.5">Assigned Class Instructor: {mod.assignedActiveLec?.fullName || "None"}</span>
                      </div>
                      <button className="h-8 bg-[#1a1a1a] hover:bg-neutral-800 text-white font-bold px-3.5 rounded-lg text-xs transition-colors">
                        Review Marks File
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {exSubMenu === "VERIFIED_REGISTRY" && (
              <div className="bg-white rounded-xl premium-border p-6 space-y-2">
                <div className="flex items-center space-x-2 text-neutral-400">
                  <FileText className="h-4 w-4" />
                  <h4 className="font-bold text-xs uppercase tracking-wider">Archived Signed Logs</h4>
                </div>
                <div className="divide-y divide-neutral-100 pt-2">
                  {dynamicExaminerModules.filter(m => m.stats.moderationStatus === "VERIFIED").length === 0 ? (
                    <p className="text-xs text-neutral-400 italic py-2">No verification matrices have been formally committed to disk for archive during this session cycle.</p>
                  ) : (
                    dynamicExaminerModules.filter(m => m.stats.moderationStatus === "VERIFIED").map(m => (
                      <div key={m.code} className="py-3 flex justify-between text-xs">
                        <span className="font-semibold">{m.code} Examination Portfolio</span>
                        <span className="text-emerald-600 font-bold">✓ Vaulted Ledger Record</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        )}

      </div>

      {/* Assignment Modal Workspace Frame (Only accessible inside HOD role workflow) */}
      {isModalOpen && selectedLecturer && activeRole === "HOD" && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-3xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-xl overflow-hidden border border-neutral-200">
            <div className="p-6 border-b border-neutral-100 bg-neutral-50/50 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-lg text-neutral-900">Manage Lecturer Workload</h3>
                <p className="text-xs text-neutral-400 font-medium mt-0.5">Configuring assignments for {selectedLecturer.fullName}</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="w-8 h-8 rounded-full border border-neutral-200 flex items-center justify-center hover:bg-neutral-100 text-neutral-500 cursor-pointer">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6 max-h-[60vh] overflow-y-auto space-y-6">
              <div>
                <h4 className="text-xs font-bold uppercase text-neutral-400 tracking-wider mb-3">Assign as Active Lecturer for:</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {modules.map((mod) => (
                    <label key={`active-${mod.code}`} className={`flex items-start p-3 border rounded-xl cursor-pointer select-none transition-all ${modalActiveCodes.includes(mod.code) ? "border-indigo-500 bg-indigo-50/30 font-semibold" : "border-neutral-200 hover:bg-neutral-50"}`}>
                      <input 
                        type="checkbox" 
                        disabled={mod.isFrozen}
                        checked={modalActiveCodes.includes(mod.code)} 
                        onChange={() => handleCheckboxChange(mod.code, modalActiveCodes, setModalActiveCodes)}
                        className="mt-0.5 h-4 w-4 accent-indigo-600 rounded text-white" 
                      />
                      <div className="ml-2.5 text-xs">
                        <p className="text-neutral-900 font-bold">{mod.code}</p>
                        <p className="text-neutral-400 font-normal text-[11px] truncate max-w-[180px]">{mod.name}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase text-neutral-400 tracking-wider mb-3">Assign as Examiner / Script Marker for:</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {modules.map((mod) => (
                    <label key={`exam-${mod.code}`} className={`flex items-start p-3 border rounded-xl cursor-pointer select-none transition-all ${modalExamCodes.includes(mod.code) ? "border-emerald-500 bg-emerald-50/20 font-semibold" : "border-neutral-200 hover:bg-neutral-50"}`}>
                      <input 
                        type="checkbox" 
                        disabled={mod.isFrozen}
                        checked={modalExamCodes.includes(mod.code)} 
                        onChange={() => handleCheckboxChange(mod.code, modalExamCodes, setModalExamCodes)}
                        className="mt-0.5 h-4 w-4 accent-emerald-600 rounded text-white" 
                      />
                      <div className="ml-2.5 text-xs">
                        <p className="text-neutral-900 font-bold">{mod.code}</p>
                        <p className="text-neutral-400 font-normal text-[11px] truncate max-w-[180px]">{mod.name}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6 bg-neutral-50/50 border-t border-neutral-100 flex justify-end space-x-3">
              <button onClick={() => setIsModalOpen(false)} className="h-10 text-xs font-bold px-4 rounded-xl border border-neutral-300 text-neutral-700 bg-white hover:bg-neutral-50 transition-colors cursor-pointer">
                Cancel
              </button>
              <button 
                onClick={handleSaveAssignments}
                disabled={updatingId === "modal-save"}
                className="h-10 text-xs font-bold px-5 rounded-xl bg-[#1a1a1a] text-white hover:bg-neutral-800 transition-colors cursor-pointer flex items-center"
              >
                {updatingId === "modal-save" ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : null}
                Save Assignment Matrix
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}