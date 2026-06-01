"use client";

import React, { useState } from "react";
import RoleGuard from "@/components/layout/RoleGuard";
import { 
  ShieldAlert, 
  Users, 
  BookOpen, 
  Key, 
  ToggleLeft, 
  ToggleRight, 
  UserPlus, 
  Search, 
  Shield,
  Sliders,
  Flame,
  LayoutDashboard,
  HelpCircle,
  Bell,
  Grid,
  SlidersHorizontal,
  ChevronDown,
  Globe2,
  Plus
} from "lucide-react";
import { SystemUser, SystemCourseModule } from "@/types/admin";

const mockUsers: SystemUser[] = [
  { id: "u-1", email: "hod.cis@wyb.ac.lk", fullName: "Dr. Faculty Head", role: "LECTURER", department: "Computing & Information Systems", capabilities: { isHOD: true, isActiveLec: true, isExamLec: false } },
  { id: "u-2", email: "asanka.s@wyb.ac.lk", fullName: "Prof. Asanka Sanjeewa", role: "LECTURER", department: "Computing & Information Systems", capabilities: { isHOD: false, isActiveLec: true, isExamLec: true } },
  { id: "u-3", email: "deepani.w@wyb.ac.lk", fullName: "Dr. Deepani Wijesekara", role: "LECTURER", department: "Computing & Information Systems", capabilities: { isHOD: false, isActiveLec: true, isExamLec: true } },
];

const mockModules: SystemCourseModule[] = [
  { id: "m-1", code: "CMIS 3112", name: "Rapid Application Development", department: "Computing & Information Systems", assignedLecturerId: "u-2", assignedLecturerName: "Prof. Asanka Sanjeewa", totalStudents: 124 },
  { id: "m-2", code: "CMIS 3142", name: "Object-Oriented Analysis & Design", department: "Computing & Information Systems", assignedLecturerId: "u-3", assignedLecturerName: "Dr. Deepani Wijesekara", totalStudents: 118 },
];

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState<"USERS" | "MODULES">("USERS");
  const [users, setUsers] = useState<SystemUser[]>(mockUsers);
  const [modules] = useState<SystemCourseModule[]>(mockModules);
  const [searchQuery, setSearchQuery] = useState("");
  const [globalEmergencyFreeze, setGlobalEmergencyFreeze] = useState(false);

  const toggleCapability = (userId: string, capability: "isHOD" | "isActiveLec" | "isExamLec") => {
    setUsers(prev => prev.map(u => {
      if (u.id === userId) {
        return {
          ...u,
          capabilities: {
            ...u.capabilities,
            [capability]: !u.capabilities[capability]
          }
        };
      }
      return u;
    }));
  };

  const filteredUsers = users.filter(u => 
    u.fullName.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <RoleGuard allowedRoles={["ADMIN"]}>
      <div className="flex min-h-screen bg-[#f8fafc]">
        
        {/* Left Sidebar Layout */}
        <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between p-6 shrink-0 hidden md:flex">
          <div className="space-y-8">
            {/* Core Brand Header */}
            <div className="flex items-center space-x-3 px-2">
              <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-md shadow-blue-600/20">
                <Shield className="h-4 w-4 stroke-[2.5]" />
              </div>
              <span className="font-bold text-lg tracking-tight text-slate-800">Wayamba</span>
            </div>

            {/* Sidebar Links */}
            <nav className="space-y-6">
              <div className="space-y-1">
                <span className="block px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">Core Dashboard</span>
                <button className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:bg-slate-50 hover:text-slate-700 transition-all">
                  <LayoutDashboard className="h-4 w-4" />
                  <span>Overview</span>
                </button>
              </div>

              <div className="space-y-1">
                <span className="block px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">Infrastructures</span>
                
                <button 
                  onClick={() => { setActiveTab("USERS"); setSearchQuery(""); }}
                  className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    activeTab === "USERS" 
                      ? "bg-blue-600 text-white shadow-md shadow-blue-600/10" 
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                  }`}
                >
                  <Users className="h-4 w-4" />
                  <span>User Management</span>
                </button>

                <button 
                  onClick={() => { setActiveTab("MODULES"); setSearchQuery(""); }}
                  className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    activeTab === "MODULES" 
                      ? "bg-blue-600 text-white shadow-md shadow-blue-600/10" 
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                  }`}
                >
                  <BookOpen className="h-4 w-4" />
                  <span>Course Mappings</span>
                </button>
              </div>
            </nav>
          </div>

          <div className="px-3 text-xs text-slate-400 font-medium border-t border-slate-100 pt-4">
            <p>Platform System v2.6</p>
          </div>
        </aside>

        {/* Right Main Panel Workspace Container */}
        <main className="flex-1 flex flex-col p-6 md:p-8 space-y-6 min-w-0">
          
          {/* Header Row */}
          <header className="flex items-center justify-between pb-2">
            <div>
              <h1 className="text-xl font-bold text-slate-800 tracking-tight">
                {activeTab === "USERS" ? "Users" : "Courses"}
              </h1>
            </div>
            
            {/* Action Bar Indicators */}
            <div className="flex items-center space-x-3 text-slate-400">
              <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors"><Globe2 className="h-4 w-4" /></button>
              <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors"><Grid className="h-4 w-4" /></button>
              <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors"><HelpCircle className="h-4 w-4" /></button>
              <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors relative">
                <Bell className="h-4 w-4" />
                <span className="absolute top-2 right-2 h-1.5 w-1.5 bg-blue-600 rounded-full" />
              </button>
              <div className="h-6 w-px bg-slate-200 mx-1" />
              <div className="h-8 w-8 rounded-full bg-blue-100 font-bold text-xs text-blue-600 flex items-center justify-center border border-blue-200">
                SU
              </div>
            </div>
          </header>

          {/* Horizontally Stacked Rounded-Square Metrics Widget Strip */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Total Users Widget */}
            <div className="bg-white p-5 rounded-[18px] border border-slate-200/70 shadow-[0_2px_8px_rgba(0,0,0,0.01)] flex items-center space-x-4">
              <div className="h-12 w-12 bg-blue-600 text-white rounded-[14px] flex items-center justify-center shrink-0 shadow-sm shadow-blue-600/10">
                <Users className="h-5 w-5 stroke-[2.2]" />
              </div>
              <div className="space-y-0.5">
                <span className="block text-xs font-medium text-slate-400 tracking-wide">Total Users</span>
                <span className="text-xl font-bold text-slate-800 tracking-tight">{users.length} Profiles</span>
              </div>
            </div>

            {/* Curriculums Widget */}
            <div className="bg-white p-5 rounded-[18px] border border-slate-200/70 shadow-[0_2px_8px_rgba(0,0,0,0.01)] flex items-center space-x-4">
              <div className="h-12 w-12 bg-blue-600 text-white rounded-[14px] flex items-center justify-center shrink-0 shadow-sm shadow-blue-600/10">
                <BookOpen className="h-5 w-5 stroke-[2.2]" />
              </div>
              <div className="space-y-0.5">
                <span className="block text-xs font-medium text-slate-400 tracking-wide">Curriculums</span>
                <span className="text-xl font-bold text-slate-800 tracking-tight">{modules.length} Modules</span>
              </div>
            </div>

            {/* Node Guard Widget */}
            <div className="bg-white p-5 rounded-[18px] border border-slate-200/70 shadow-[0_2px_8px_rgba(0,0,0,0.01)] flex items-center space-x-4">
              <div className="h-12 w-12 bg-blue-600 text-white rounded-[14px] flex items-center justify-center shrink-0 shadow-sm shadow-blue-600/10">
                <Shield className="h-5 w-5 stroke-[2.2]" />
              </div>
              <div className="space-y-0.5">
                <span className="block text-xs font-medium text-slate-400 tracking-wide">Node Guard</span>
                <span className="text-xl font-bold text-slate-800 tracking-tight">RBAC Active</span>
              </div>
            </div>

            {/* Interactive Global Freeze Widget */}
            <div className={`p-5 rounded-[18px] border transition-all flex items-center justify-between ${
              globalEmergencyFreeze ? "border-red-200 bg-red-50/40" : "bg-white border-slate-200/70 shadow-[0_2px_8px_rgba(0,0,0,0.01)]"
            }`}>
              <div className="flex items-center space-x-4 min-w-0">
                <div className={`h-12 w-12 rounded-[14px] flex items-center justify-center shrink-0 shadow-sm ${
                  globalEmergencyFreeze ? "bg-red-500 text-white shadow-red-500/10" : "bg-blue-600 text-white shadow-blue-600/10"
                }`}>
                  <ShieldAlert className="h-5 w-5 stroke-[2.2]" />
                </div>
                <div className="space-y-0.5 min-w-0 truncate">
                  <span className="block text-xs font-medium text-slate-400 tracking-wide">Global Freeze</span>
                  <span className={`text-sm font-bold block truncate ${globalEmergencyFreeze ? "text-red-600 font-extrabold" : "text-slate-700"}`}>
                    {globalEmergencyFreeze ? "SYSTEM LOCKED" : "Operations Safe"}
                  </span>
                </div>
              </div>
              <button onClick={() => setGlobalEmergencyFreeze(!globalEmergencyFreeze)} className="focus:outline-none pl-2 shrink-0">
                {globalEmergencyFreeze ? (
                  <ToggleRight className="h-8 w-8 text-red-500" />
                ) : (
                  <ToggleLeft className="h-8 w-8 text-slate-300 hover:text-slate-400 transition-colors" />
                )}
              </button>
            </div>
          </section>

          {/* Dynamic Table Board Frame */}
          <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col flex-1">
            
            {/* Filter controls and action hooks */}
            <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white">
              <span className="text-base font-bold text-slate-800">
                {activeTab === "USERS" ? "Course List" : "Curriculum Registry Records"}
              </span>

              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full text-xs pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                  />
                </div>
                
                <button className="px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 bg-white hover:bg-slate-50 inline-flex items-center space-x-2 transition-colors">
                  <SlidersHorizontal className="h-3.5 w-3.5 text-slate-400" />
                  <span>Filter</span>
                </button>

                <button className="px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 bg-white hover:bg-slate-50 inline-flex items-center space-x-2 transition-colors">
                  <span>Sort by</span>
                  <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                </button>

                {activeTab === "USERS" && (
                  <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg shadow-sm transition-colors inline-flex items-center space-x-1.5">
                    <Plus className="h-4 w-4 stroke-[2.5]" />
                    <span>Add New Course</span>
                  </button>
                )}
              </div>
            </div>

            {/* Structured Table Sheet Layout */}
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left border-collapse min-w-[900px]">
                <thead>
                  <tr className="border-b border-slate-200 text-xs font-bold text-slate-400 tracking-wider bg-slate-50/70">
                    <th className="p-4 pl-6 w-16">#</th>
                    {activeTab === "USERS" ? (
                      <>
                        <th className="p-4">User Identity Profile</th>
                        <th className="p-4">Department Framework</th>
                        <th className="p-4">Role Assigned</th>
                        <th className="p-4 text-center pr-6">Capability Boundaries Switches</th>
                      </>
                    ) : (
                      <>
                        <th className="p-4">Module Code</th>
                        <th className="p-4">Module Title Description</th>
                        <th className="p-4">Course Allocation Instructor</th>
                        <th className="p-4 pr-6">Enrolled Space Parameters</th>
                      </>
                    )}
                  </tr>
                </thead>
                
                <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-600">
                  {activeTab === "USERS" ? (
                    filteredUsers.map((u, idx) => (
                      <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-4 pl-6 font-bold text-slate-400">{idx + 1}</td>
                        <td className="p-4">
                          <span className="block font-bold text-slate-800 text-sm">{u.fullName}</span>
                          <span className="text-slate-400 font-normal block mt-0.5">{u.email}</span>
                        </td>
                        <td className="p-4">
                          <span className="inline-block px-2.5 py-1 rounded bg-blue-50 text-blue-600 font-semibold text-[11px]">
                            {u.department}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className={`inline-block font-bold px-2.5 py-0.5 rounded text-[10px] uppercase ${
                            u.role === "ADMIN" ? "bg-red-50 text-red-600" : "bg-blue-50 text-blue-600"
                          }`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="p-4 pr-6">
                          <div className="flex justify-center items-center gap-2">
                            <button 
                              onClick={() => toggleCapability(u.id, "isHOD")}
                              className={`px-3 py-1.5 rounded-lg border text-[11px] font-bold inline-flex items-center space-x-1.5 transition-all ${
                                u.capabilities.isHOD 
                                  ? "bg-blue-600 border-blue-600 text-white shadow-sm" 
                                  : "bg-white border-slate-200 text-slate-400 hover:border-slate-300 hover:text-slate-700"
                              }`}
                            >
                              <Key className="h-3 w-3" />
                              <span>HOD Console</span>
                            </button>
                            
                            <button 
                              onClick={() => toggleCapability(u.id, "isActiveLec")}
                              className={`px-3 py-1.5 rounded-lg border text-[11px] font-bold inline-flex items-center space-x-1.5 transition-all ${
                                u.capabilities.isActiveLec 
                                  ? "bg-blue-600 border-blue-600 text-white shadow-sm" 
                                  : "bg-white border-slate-200 text-slate-400 hover:border-slate-300 hover:text-slate-700"
                              }`}
                            >
                              <Sliders className="h-3 w-3" />
                              <span>Active Lec</span>
                            </button>
                            
                            <button 
                              onClick={() => toggleCapability(u.id, "isExamLec")}
                              className={`px-3 py-1.5 rounded-lg border text-[11px] font-bold inline-flex items-center space-x-1.5 transition-all ${
                                u.capabilities.isExamLec 
                                  ? "bg-blue-600 border-blue-600 text-white shadow-sm" 
                                  : "bg-white border-slate-200 text-slate-400 hover:border-slate-300 hover:text-slate-700"
                              }`}
                            >
                              <Flame className="h-3 w-3" />
                              <span>Examiner Desk</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    modules.map((m, idx) => (
                      <tr key={m.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-4 pl-6 font-bold text-slate-400">{idx + 1}</td>
                        <td className="p-4">
                          <span className="bg-blue-50 text-blue-700 font-bold px-2 py-0.5 rounded text-[11px] border border-blue-100">
                            {m.code}
                          </span>
                        </td>
                        <td className="p-4 font-bold text-slate-800 text-sm">{m.name}</td>
                        <td className="p-4 font-semibold text-slate-600">{m.assignedLecturerName}</td>
                        <td className="p-4 pr-6 font-bold text-blue-600">
                          {m.totalStudents} Enrolled
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Unified Table Index Meta Rows Footer */}
            <div className="p-4 bg-slate-50/50 border-t border-slate-200 flex items-center justify-between text-xs font-semibold text-slate-400">
              <span>Showing result 1-{activeTab === "USERS" ? filteredUsers.length : modules.length} of entries</span>
              <div className="flex space-x-2">
                <button className="px-3 py-1.5 border border-slate-200 rounded-lg bg-white text-slate-600 hover:bg-slate-50 font-medium transition-colors">Previous</button>
                <button className="px-3 py-1.5 border border-slate-200 rounded-lg bg-white text-slate-600 hover:bg-slate-50 font-medium transition-colors">Next</button>
              </div>
            </div>

          </section>
        </main>

      </div>
    </RoleGuard>
  );
}