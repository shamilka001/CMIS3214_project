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
  X
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

export default function HodConsolePage() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [lecturers, setLecturers] = useState<LecturerData[]>([]);
  const [modules, setModules] = useState<ModuleData[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Modal Workspace States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLecturer, setSelectedLecturer] = useState<LecturerData | null>(null);
  const [modalActiveCodes, setModalActiveCodes] = useState<string[]>([]);
  const [modalExamCodes, setModalExamCodes] = useState<string[]>([]);

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
  }, []);

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

  if (isAuthLoading || isDataLoading) {
    return (
      <div className="min-h-screen bg-cream-canvas flex flex-col justify-center items-center">
        <Loader2 className="h-6 w-6 text-indigo-600 animate-spin" />
        <p className="mt-4 text-[11px] font-bold text-neutral-400 tracking-widest uppercase">Loading Matrix Engine...</p>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-cream-canvas p-4 sm:p-8 text-[#1a1a1a]">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Block */}
        <div className="w-full bg-white rounded-2xl premium-border p-6 sm:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 text-[11px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50/60 px-3 py-1 rounded-full border border-indigo-100/50">
              <Shield className="h-3 w-3 fill-indigo-600 stroke-[2.5]" />
              <span>HOD Control Desk</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Department Console</h1>
            <p className="text-sm text-neutral-500 font-medium">
              Operational Matrix Workspace &bull; <span className="text-[#1a1a1a] font-semibold underline underline-offset-4 decoration-indigo-500">{user?.fullName || "Dr. Charith Kapukotuwa"}</span>
            </p>
          </div>
          <div className="bg-[#fdfdfd] border border-neutral-200/60 rounded-xl px-5 py-3 min-w-[180px]">
            <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Academic Term</p>
            <p className="text-sm font-bold text-neutral-800 mt-0.5">2025/2026 Semester I</p>
          </div>
        </div>

        {/* Dynamic Metric Grid */}
        <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { title: "Monitored Modules", val: modules.length, icon: <BookOpen className="h-[18px] w-[18px]" /> },
            { title: "Faculty Lecturers", val: lecturers.length, icon: <Users className="h-[18px] w-[18px]" /> },
            { title: "Frozen Blueprints", val: modules.filter(m => m.isFrozen).length, icon: <CheckCircle className="h-[18px] w-[18px] text-indigo-600" /> },
            { title: "Avg Verification", val: "94.2%", icon: <TrendingUp className="h-[18px] w-[18px]" /> }
          ].map((card, idx) => (
            <div key={idx} className="w-full bg-white p-6 rounded-2xl premium-border flex flex-col justify-between aspect-square">
              <div className="flex justify-between items-start">
                <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest">{card.title}</p>
                <div className="w-9 h-9 flex items-center justify-center rounded-full bg-neutral-100 border border-neutral-200/40">{card.icon}</div>
              </div>
              <p className="text-5xl font-bold tracking-tight">{card.val}</p>
            </div>
          ))}
        </div>

        {/* Dual Matrix Tables */}
        <div className="w-full grid grid-cols-1 xl:grid-cols-5 gap-6 items-start">
          
          {/* Modules Assignment Matrix (Left: 3/5 Columns) */}
          <div className="xl:col-span-3 bg-white rounded-2xl premium-border overflow-hidden">
            <div className="p-5 border-b border-neutral-200/60 bg-neutral-50/50 flex items-center space-x-2.5">
              <Layers className="h-4 w-4 text-neutral-500" />
              <h2 className="font-bold text-sm uppercase tracking-wider">Module Summary Layout</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-neutral-50/30 text-[11px] font-bold text-neutral-400 uppercase tracking-widest border-b border-neutral-200/60">
                    <th className="p-5">Module Details</th>
                    <th className="p-5">Assigned Staff</th>
                    <th className="p-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 text-xs font-medium text-neutral-700">
                  {modules.map((mod) => (
                    <tr key={mod.id} className="hover:bg-neutral-50/30 transition-colors">
                      <td className="p-5">
                        <p className="font-bold text-sm text-[#1a1a1a]">{mod.code}</p>
                        <p className="text-neutral-400 font-normal mt-0.5">{mod.name} &bull; {mod.credits}C</p>
                      </td>
                      <td className="p-5 space-y-1">
                        <p><span className="text-neutral-400">Active:</span> <span className="font-semibold text-neutral-800">{mod.assignedActiveLec?.fullName || "None"}</span></p>
                        <p><span className="text-neutral-400">Exam:</span> <span className="font-semibold text-neutral-800">{mod.assignedExamLec?.fullName || "None"}</span></p>
                      </td>
                      <td className="p-5 text-right">
                        <button
                          onClick={() => toggleModuleFreeze(mod.code)}
                          disabled={updatingId === `freeze-${mod.code}`}
                          className={`inline-flex items-center h-8 text-xs font-bold px-3.5 rounded-full border cursor-pointer transition-all ${
                            mod.isFrozen ? "bg-[#1a1a1a] text-white border-[#1a1a1a]" : "bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-50"
                          }`}
                        >
                          {updatingId === `freeze-${mod.code}` ? <Loader2 className="h-3 w-3 animate-spin" /> : mod.isFrozen ? <Lock className="h-3 w-3 mr-1" /> : <Unlock className="h-3 w-3 mr-1" />}
                          {mod.isFrozen ? "Frozen" : "Freeze"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Lecturer Roles Matrix (Right: 2/5 Columns) */}
          <div className="xl:col-span-2 bg-white rounded-2xl premium-border overflow-hidden">
            <div className="p-5 border-b border-neutral-200/60 bg-neutral-50/50 flex items-center space-x-2.5">
              <Users className="h-4 w-4 text-neutral-500" />
              <h2 className="font-bold text-sm uppercase tracking-wider">Faculty Roster & Roles</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-neutral-50/30 text-[11px] font-bold text-neutral-400 uppercase tracking-widest border-b border-neutral-200/60">
                    <th className="p-5">Lecturer</th>
                    <th className="p-5">Course Responsibilities</th>
                    <th className="p-5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 text-xs font-medium text-neutral-700">
                  {lecturers.map((lec) => (
                    <tr key={lec.id} className="hover:bg-neutral-50/30 transition-colors">
                      <td className="p-5">
                        <p className="font-bold text-neutral-900">{lec.fullName}</p>
                        <p className="text-[11px] text-indigo-600 font-normal mt-0.5">{lec.email}</p>
                      </td>
                      <td className="p-5 space-y-2">
                        <div>
                          <p className="text-[10px] text-neutral-400 uppercase font-bold tracking-tight">Active Lecturer For:</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {lec.activeModules.length === 0 ? <span className="text-neutral-400 italic text-[11px]">None</span> : lec.activeModules.map(c => <span key={c} className="bg-neutral-100 border border-neutral-200 text-neutral-700 font-bold px-1.5 py-0.5 rounded text-[10px]">{c}</span>)}
                          </div>
                        </div>
                        <div>
                          <p className="text-[10px] text-neutral-400 uppercase font-bold tracking-tight">Internal Examiner For:</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {lec.examModules.length === 0 ? <span className="text-neutral-400 italic text-[11px]">None</span> : lec.examModules.map(c => <span key={c} className="bg-indigo-50 border border-indigo-100 text-indigo-700 font-bold px-1.5 py-0.5 rounded text-[10px]">{c}</span>)}
                          </div>
                        </div>
                      </td>
                      <td className="p-5 text-right">
                        <button
                          onClick={() => openEditModal(lec)}
                          className="inline-flex items-center h-8 bg-white border border-neutral-300 text-neutral-700 font-bold px-3 rounded-full hover:bg-neutral-50 transition-colors cursor-pointer text-xs shadow-xs"
                        >
                          <Edit3 className="h-3 w-3 mr-1.5 text-neutral-500" />
                          Edit Workload
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>

      {/* Assignment Workspace Flyout Modal */}
      {isModalOpen && selectedLecturer && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-xl overflow-hidden border border-neutral-200">
            <div className="p-6 border-b border-neutral-100 bg-neutral-50/50 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-lg text-neutral-900">Manage Lecturer Workload</h3>
                <p className="text-xs text-neutral-400 font-medium mt-0.5">Configuring assignments for {selectedLecturer.fullName}</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="w-8 h-8 rounded-full border border-neutral-200 flex items-center justify-center hover:bg-neutral-100 transition-colors cursor-pointer text-neutral-500">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6 max-h-[60vh] overflow-y-auto space-y-6">
              {/* Active Lecturer Modules Checklist */}
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
                        {mod.isFrozen && <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-tighter">Locked (Module Frozen)</span>}
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Exam Examiner Modules Checklist */}
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
                        {mod.isFrozen && <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-tighter">Locked (Module Frozen)</span>}
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