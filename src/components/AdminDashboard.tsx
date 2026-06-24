import React, { useState, useEffect, useRef } from "react";
import QRCode from "qrcode";
import { 
  Users, 
  Clock, 
  QrCode, 
  CheckCircle2, 
  MapPin, 
  RotateCcw, 
  Calendar, 
  Sparkles, 
  Award,
  Smartphone,
  ChevronRight,
  Database,
  ArrowUpDown
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { AttendanceRecord, ClubEvent, ActiveEventStatus } from "../types";

export default function AdminDashboard() {
  const [events, setEvents] = useState<ClubEvent[]>([]);
  const [activeEvent, setActiveEvent] = useState<ActiveEventStatus | null>(null);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEventId, setSelectedEventId] = useState("");
  const [isResetting, setIsResetting] = useState(false);
  const [lastCheckInId, setLastCheckInId] = useState<string | null>(null);
  
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Fetch initial event list and current active event
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const eventsRes = await fetch("/api/events");
        const eventsData = await eventsRes.json();
        setEvents(eventsData);

        const activeRes = await fetch("/api/active-event");
        const activeData = await activeRes.json();
        setActiveEvent(activeData);
        setSelectedEventId(activeData.eventId);
        
        // Fetch attendance
        const attRes = await fetch(`/api/attendance?eventId=${activeData.eventId}`);
        const attData = await attRes.json();
        setAttendance(attData);
      } catch (err) {
        console.error("Error fetching initial admin data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  // Poll for active event updates (specifically countdown/QR rotation) and attendance list
  useEffect(() => {
    let interval: NodeJS.Timeout;

    const pollData = async () => {
      try {
        // Get active event (includes remaining time and current rotating QR token)
        const activeRes = await fetch("/api/active-event");
        if (activeRes.ok) {
          const activeData = await activeRes.json();
          setActiveEvent(activeData);
        }

        // Get attendance list
        if (activeEvent) {
          const attRes = await fetch(`/api/attendance?eventId=${activeEvent.eventId}`);
          if (attRes.ok) {
            const attData = await attRes.json();
            
            // Check for new check-ins to trigger highlight effect
            if (attData.length > 0 && attendance.length > 0) {
              const currentIds = attendance.map(r => r.id);
              const newRecord = attData.find((r: AttendanceRecord) => !currentIds.includes(r.id));
              if (newRecord) {
                setLastCheckInId(newRecord.id);
                // Clear highlight after 3 seconds
                setTimeout(() => setLastCheckInId(null), 3000);
              }
            }
            setAttendance(attData);
          }
        }
      } catch (err) {
        console.error("Error polling admin data:", err);
      }
    };

    // Poll every 1 second for countdown and real-time updates
    interval = setInterval(pollData, 1000);

    return () => clearInterval(interval);
  }, [activeEvent?.eventId, attendance.length]);

  // Generate / Render QR Code on canvas when token changes
  useEffect(() => {
    if (activeEvent?.qrValue && canvasRef.current) {
      QRCode.toCanvas(
        canvasRef.current,
        activeEvent.qrValue,
        {
          width: 256,
          margin: 1,
          color: {
            dark: "#0f172a",  // slate-900
            light: "#ffffff" // white
          }
        },
        (error) => {
          if (error) console.error("Error generating QR canvas:", error);
        }
      );
    }
  }, [activeEvent?.qrValue]);

  // Handle Event selection change
  const handleEventChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const eventId = e.target.value;
    setSelectedEventId(eventId);
    try {
      const res = await fetch("/api/active-event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId })
      });
      if (res.ok) {
        const data = await res.json();
        // Trigger immediate pull
        const activeRes = await fetch("/api/active-event");
        const activeData = await activeRes.json();
        setActiveEvent(activeData);

        const attRes = await fetch(`/api/attendance?eventId=${eventId}`);
        const attData = await attRes.json();
        setAttendance(attData);
      }
    } catch (err) {
      console.error("Error updating active event:", err);
    }
  };

  // Reset attendance records (Playground Helper)
  const handleResetAttendance = async () => {
    if (!confirm("Are you sure you want to clear all attendance records? This cannot be undone.")) return;
    setIsResetting(true);
    try {
      const res = await fetch("/api/reset", { method: "POST" });
      if (res.ok) {
        setAttendance([]);
      }
    } catch (err) {
      console.error("Error resetting attendance:", err);
    } finally {
      setIsResetting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] gap-3">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-500 font-semibold text-sm">Loading Club Admin Dashboard...</p>
      </div>
    );
  }

  // Calculate circular stroke values
  const circularProgressRadius = 40;
  const circumference = 2 * Math.PI * circularProgressRadius;
  const timeLimit = 15;
  const currentSeconds = activeEvent?.expiresIn ?? 15;
  const strokeDashoffset = circumference - (currentSeconds / timeLimit) * circumference;

  return (
    <div className="w-full mx-auto" id="admin-dashboard-container">
      {/* Top Banner / Event Selector */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6 items-center" id="admin-top-bar">
        <div className="md:col-span-2">
          <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs tracking-wider uppercase mb-1">
            <Sparkles className="w-4 h-4 animate-pulse" />
            <span>Club Controller Panel</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-display font-black text-slate-800 tracking-tight">
            Club Attendance QR Monitor
          </h1>
          <p className="text-slate-500 mt-0.5 text-xs md:text-sm">
            Project this screen on the wall or projector. Students scan the dynamic QR code to log their attendance instantly.
          </p>
        </div>

        <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-4 flex flex-col gap-2">
          <label htmlFor="event-selector" className="text-[10px] font-bold uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-indigo-500" />
            Current Active Club Event
          </label>
          <div className="relative">
            <select
              id="event-selector"
              value={selectedEventId}
              onChange={handleEventChange}
              className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-xl py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-semibold cursor-pointer transition-colors"
            >
              {events.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="admin-grid">
        {/* Left: Interactive Dynamic QR Box */}
        <div className="lg:col-span-5 flex flex-col gap-6" id="qr-section">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 flex flex-col items-center justify-center relative overflow-hidden shadow-sm">
            {/* Ambient Background Glow */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/5 rounded-full filter blur-3xl -z-10"></div>
            <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-blue-500/5 rounded-full filter blur-3xl -z-10"></div>

            <div className="flex items-center justify-between w-full mb-6">
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-600"></span>
                </span>
                <span className="text-[11px] font-bold uppercase text-indigo-600 tracking-wider">Dynamic QR Active</span>
              </div>
              <div className="text-[10px] text-slate-500 flex items-center gap-1 bg-slate-50 py-1 px-2.5 rounded-full border border-slate-100">
                <Smartphone className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-semibold">Anti-Cheat Rotator</span>
              </div>
            </div>

            {/* QR Frame Container */}
            <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-inner relative group mb-6 flex justify-center items-center">
              <canvas 
                ref={canvasRef} 
                className="w-48 h-48 select-none"
                style={{ imageRendering: "pixelated" }}
              />
              {/* Corner Targets */}
              <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-indigo-600 rounded-tl-lg"></div>
              <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-indigo-600 rounded-tr-lg"></div>
              <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-indigo-600 rounded-bl-lg"></div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-indigo-600 rounded-br-lg"></div>
            </div>

            {/* Countdown Controller */}
            <div className="flex items-center gap-4 bg-slate-50 px-5 py-3 rounded-2xl border border-slate-150 w-full justify-between shadow-inner">
              <div className="flex items-center gap-3">
                {/* SVG Countdown Circle */}
                <div className="relative flex items-center justify-center w-10 h-10">
                  <svg className="w-10 h-10 transform -rotate-90">
                    <circle
                      cx="20"
                      cy="20"
                      r={circularProgressRadius / 2}
                      className="text-slate-200"
                      strokeWidth="3.5"
                      stroke="currentColor"
                      fill="transparent"
                    />
                    <motion.circle
                      cx="20"
                      cy="20"
                      r={circularProgressRadius / 2}
                      className="text-indigo-600"
                      strokeWidth="3.5"
                      strokeDasharray={circumference / 2}
                      strokeDashoffset={strokeDashoffset / 2}
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="transparent"
                      animate={{ strokeDashoffset: strokeDashoffset / 2 }}
                      transition={{ duration: 0.8, ease: "linear" }}
                    />
                  </svg>
                  <span className="absolute text-sm font-mono font-black text-slate-800">
                    {currentSeconds}
                  </span>
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-800">Rotating QR Code</h3>
                  <p className="text-[10px] text-slate-400 font-semibold">Refreshes every 15s to block sharing</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[9px] text-slate-400 block font-bold uppercase tracking-wider">Sync Token</span>
                <span className="text-xs font-mono bg-indigo-50 px-2 py-0.5 rounded text-indigo-700 border border-indigo-100 font-bold">
                  {activeEvent?.qrValue.split("_")[3] || "SECURE"}
                </span>
              </div>
            </div>

            {/* Quick Stats Panel for Left Column */}
            <div className="grid grid-cols-2 gap-4 w-full mt-6">
              <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl flex flex-col gap-0.5">
                <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Checked In</span>
                <span className="text-lg font-black font-display text-slate-800 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-indigo-600" />
                  {attendance.length}
                </span>
              </div>
              <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl flex flex-col gap-0.5">
                <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Latest Check-In</span>
                <span className="text-xs font-bold truncate text-slate-700" title={attendance[0]?.name || "None yet"}>
                  {attendance[0] ? attendance[0].name.split(" ")[0] : "No activity"}
                </span>
              </div>
            </div>
          </div>
          
          {/* Sandbox Tools */}
          <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-4 flex flex-col gap-2 shadow-inner">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-indigo-500" />
              Developer Sandbox Tools
            </h4>
            <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
              This system features a full-stack in-memory database. If you use multiple browser windows or mobile devices to scan, attendance updates will sync instantly across all clients.
            </p>
            <div className="flex gap-2 mt-1">
              <button
                onClick={handleResetAttendance}
                disabled={isResetting || attendance.length === 0}
                className="text-[10px] flex items-center gap-1.5 bg-red-50 hover:bg-red-100 active:scale-[0.98] border border-red-200 disabled:border-transparent disabled:bg-slate-200/50 disabled:text-slate-400 text-red-600 font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                Clear Attendance Lists
              </button>
            </div>
          </div>
        </div>

        {/* Right: Live Attendance Feed Table */}
        <div className="lg:col-span-7 flex flex-col" id="feed-section">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 flex flex-col flex-grow shadow-sm">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2 pb-2">
              <div>
                <h2 className="text-base font-display font-black text-slate-800 flex items-center gap-2">
                  <Users className="w-5 h-5 text-indigo-600" />
                  Live Attendance Feed
                </h2>
                <p className="text-xs text-slate-400 font-semibold mt-0.5">Showing check-ins for the active workshop</p>
              </div>
              <div className="bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-indigo-600" />
                <span className="text-xs text-indigo-800 font-bold">
                  Active: <span className="text-indigo-600 font-black">{activeEvent?.eventName}</span>
                </span>
              </div>
            </div>

            {/* Attendance Table */}
            <div className="flex-grow overflow-x-auto" style={{ maxHeight: "380px" }}>
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 text-[10px] uppercase tracking-wider font-bold bg-slate-50/50">
                    <th className="py-2.5 px-4 rounded-l-lg">Student Name</th>
                    <th className="py-2.5 px-4">Student ID / Roll No</th>
                    <th className="py-2.5 px-4 text-right">Time Checked In</th>
                    <th className="py-2.5 px-4 text-center rounded-r-lg">Location Details</th>
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence initial={false}>
                    {attendance.length === 0 ? (
                      <motion.tr
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      >
                        <td colSpan={4} className="py-12 text-center text-slate-400 text-xs font-semibold">
                          <div className="flex flex-col items-center justify-center gap-2">
                            <QrCode className="w-8 h-8 text-slate-300 animate-pulse" />
                            <p>No check-ins recorded yet.</p>
                            <p className="text-[10px] text-slate-400 font-medium">Scan on the mobile interface to see names appear here!</p>
                          </div>
                        </td>
                      </motion.tr>
                    ) : (
                      attendance.map((record) => {
                        const isNew = record.id === lastCheckInId;
                        const dateObj = new Date(record.timestamp);
                        const formattedTime = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

                        return (
                          <motion.tr
                            key={record.id}
                            initial={{ opacity: 0, y: -10, backgroundColor: isNew ? "rgba(79, 70, 229, 0.08)" : "transparent" }}
                            animate={{ 
                              opacity: 1, 
                              y: 0, 
                              backgroundColor: isNew ? "rgba(79, 70, 229, 0.06)" : "transparent"
                            }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.4 }}
                            className={`border-b border-slate-100 text-xs hover:bg-slate-50/70 transition-colors ${
                              isNew ? "border-indigo-500/20" : ""
                            }`}
                          >
                            <td className="py-3 px-4 font-bold text-slate-800 flex items-center gap-2">
                              {isNew ? (
                                <motion.span 
                                  animate={{ scale: [1, 1.2, 1] }}
                                  transition={{ repeat: Infinity, duration: 1.5 }}
                                  className="h-2 w-2 rounded-full bg-indigo-600 inline-block"
                                />
                              ) : (
                                <span className="h-1.5 w-1.5 rounded-full bg-slate-300 inline-block" />
                              )}
                              <span>{record.name}</span>
                            </td>
                            <td className="py-3 px-4 font-mono text-slate-500 text-xs font-medium">
                              {record.studentId}
                            </td>
                            <td className="py-3 px-4 text-right text-slate-500 font-mono text-xs font-semibold">
                              <span className="flex items-center justify-end gap-1.5">
                                <Clock className="w-3.5 h-3.5 text-slate-300" />
                                {formattedTime}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center">
                              {record.latitude && record.longitude ? (
                                <span 
                                  className="inline-flex items-center gap-1 text-[10px] text-slate-600 bg-slate-100 border border-slate-200/50 py-1 px-2.5 rounded-full"
                                  title={`Lat: ${record.latitude}, Lng: ${record.longitude}`}
                                >
                                  <MapPin className="w-3 h-3 text-indigo-500" />
                                  <span className="font-mono">
                                    {record.latitude.toFixed(4)}, {record.longitude.toFixed(4)}
                                  </span>
                                </span>
                              ) : (
                                <span className="text-xs text-slate-400 font-mono italic">No Geo</span>
                              )}
                            </td>
                          </motion.tr>
                        );
                      })
                    )}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>

            {/* Attendance Feed Summary Footer */}
            {attendance.length > 0 && (
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-bold">
                <span>Total Registered Check-Ins: <strong className="text-indigo-600 font-black">{attendance.length}</strong></span>
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
                  Synced with Express Backend
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
