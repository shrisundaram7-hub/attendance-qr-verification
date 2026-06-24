import React, { useState } from "react";
import { 
  Users, 
  Smartphone, 
  Projector, 
  Sparkles, 
  Activity, 
  HelpCircle,
  Github,
  QrCode,
  LayoutGrid,
  Info
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import AdminDashboard from "./components/AdminDashboard";
import StudentScanner from "./components/StudentScanner";

type AppViewMode = "playground" | "admin" | "student";

export default function App() {
  const [viewMode, setViewMode] = useState<AppViewMode>("playground");

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-850 flex flex-col font-sans selection:bg-indigo-100 selection:text-indigo-900" id="app-root">
      {/* Dynamic Navigation Bar */}
      <header className="bg-white sticky top-0 z-50 border-b border-slate-200 shadow-sm" id="app-header">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Logo Brand */}
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 p-0.5 flex items-center justify-center shadow-md">
              <QrCode className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-display font-black text-slate-900 text-base tracking-tight">ROLLCALL</span>
                <span className="text-[10px] bg-indigo-100 text-indigo-700 font-bold px-1.5 py-0.5 rounded border border-indigo-200 tracking-wide">v1.2</span>
              </div>
              <p className="text-[10px] text-slate-500 font-medium">Automatic Club QR Attendance</p>
            </div>
          </div>

          {/* View Toggles */}
          <div className="bg-slate-100 p-1 rounded-xl border border-slate-200 flex items-center gap-1" id="view-mode-tabs">
            <button
              onClick={() => setViewMode("playground")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                viewMode === "playground"
                  ? "bg-indigo-600 text-white shadow"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Dual Playground</span>
            </button>
            <button
              onClick={() => setViewMode("admin")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                viewMode === "admin"
                  ? "bg-indigo-600 text-white shadow"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Projector className="w-3.5 h-3.5" />
              <span>Admin Dashboard</span>
            </button>
            <button
              onClick={() => setViewMode("student")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                viewMode === "student"
                  ? "bg-indigo-600 text-white shadow"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Student Scanner</span>
            </button>
          </div>

          {/* Quick Help / Status info */}
          <div className="hidden md:flex items-center gap-3">
            <div className="flex items-center gap-1.5 bg-white border border-slate-200 py-1.5 px-3 rounded-lg text-[11px] font-mono text-slate-600 shadow-sm">
              <Activity className="w-3.5 h-3.5 text-indigo-600 animate-pulse" />
              <span>Status: Synchronized</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Screen Content Viewport */}
      <main className="flex-grow flex flex-col relative w-full font-sans" id="app-main">
        <AnimatePresence mode="wait">
          {viewMode === "playground" && (
            <motion.div
              key="playground-view"
              initial={{ opacity: 0, scale: 0.99 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.99 }}
              className="w-full max-w-7xl mx-auto px-4 py-6 flex flex-col gap-6"
            >
              {/* Sandbox info banner */}
              <div className="bg-indigo-50/70 border border-indigo-100 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
                <div className="flex gap-3 items-start">
                  <div className="w-9 h-9 bg-indigo-100 border border-indigo-200 rounded-xl flex items-center justify-center shrink-0">
                    <Info className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Dual Interactive Simulator</h4>
                    <p className="text-xs text-slate-600 leading-normal mt-0.5">
                      Check in a student using the mobile interface on the right. Notice how the registered student instantly appears on the projector dashboard list on the left!
                    </p>
                  </div>
                </div>
                <div className="text-xs font-semibold text-indigo-700 bg-indigo-100 border border-indigo-200/50 py-1.5 px-3.5 rounded-xl flex items-center gap-1 shrink-0">
                  <Sparkles className="w-3.5 h-3.5" />
                  No extra tabs needed
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Left: Admin dashboard viewport */}
                <div className="lg:col-span-8 bg-white border border-slate-200/80 p-1 md:p-4 rounded-3xl shadow-sm">
                  <div className="flex items-center gap-2 mb-4 px-4 pt-2">
                    <Projector className="w-4 h-4 text-indigo-500" />
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Projector Display (Laptop view)</span>
                  </div>
                  <AdminDashboard />
                </div>

                {/* Right: Simulated Mobile Viewport */}
                <div className="lg:col-span-4 flex flex-col items-center">
                  <div className="flex items-center gap-2 mb-4 w-full px-1">
                    <Smartphone className="w-4 h-4 text-indigo-500" />
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Student Mobile Device Mockup</span>
                  </div>
                  
                  {/* Outer phone container framing */}
                  <div className="relative w-full max-w-[340px] border-[8px] border-slate-300 rounded-[42px] bg-slate-100 p-1 shadow-xl ring-4 ring-slate-200/50">
                    {/* Speaker notch */}
                    <div className="absolute top-2.5 left-1/2 transform -translate-x-1/2 w-24 h-4 bg-slate-300 rounded-full z-30 flex items-center justify-center">
                      <div className="w-10 h-1 bg-slate-400 rounded-full"></div>
                    </div>
                    {/* Content */}
                    <div className="pt-6">
                      <StudentScanner />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {viewMode === "admin" && (
            <motion.div
              key="admin-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-6 flex-grow"
            >
              <div className="max-w-7xl mx-auto px-4 bg-white border border-slate-200 p-6 rounded-3xl shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <Projector className="w-4 h-4 text-indigo-500" />
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Full-Screen Admin Monitor Mode</span>
                </div>
                <AdminDashboard />
              </div>
            </motion.div>
          )}

          {viewMode === "student" && (
            <motion.div
              key="student-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-12 flex-grow flex items-center justify-center px-4"
            >
              <div className="w-full max-w-sm">
                <div className="flex items-center justify-center gap-2 mb-4">
                  <Smartphone className="w-4 h-4 text-indigo-500" />
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Full Mobile Web App View</span>
                </div>
                <StudentScanner />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 py-4 px-6 text-center text-xs text-slate-400 mt-auto" id="app-footer">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <p>© 2026 College Club automatic check-in system. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider text-slate-400">
              <span className="h-1.5 w-1.5 bg-green-500 rounded-full animate-pulse"></span>
              <span>Sync Status: us-east-cluster</span>
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
