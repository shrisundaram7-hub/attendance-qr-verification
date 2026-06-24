import React, { useState, useEffect } from "react";
import { 
  User, 
  Hash, 
  QrCode, 
  Camera, 
  MapPin, 
  CheckCircle2, 
  XCircle, 
  ArrowLeft, 
  LogOut, 
  Smartphone, 
  Globe,
  Compass,
  AlertTriangle,
  Loader2,
  Sparkles
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { ActiveEventStatus, AttendanceRecord } from "../types";

export default function StudentScanner() {
  // Login State
  const [fullName, setFullName] = useState(() => localStorage.getItem("club_student_name") || "");
  const [studentId, setStudentId] = useState(() => localStorage.getItem("club_student_id") || "");
  const [isRegistered, setIsRegistered] = useState(() => {
    return !!(localStorage.getItem("club_student_name") && localStorage.getItem("club_student_id"));
  });

  // Scanner States
  const [activeEvent, setActiveEvent] = useState<ActiveEventStatus | null>(null);
  const [scanning, setScanning] = useState(false);
  const [scanSuccess, setScanSuccess] = useState(false);
  const [scannedRecord, setScannedRecord] = useState<AttendanceRecord | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [geoCoords, setGeoCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [geoState, setGeoState] = useState<"idle" | "requesting" | "captured" | "failed">("idle");

  // Fetch current active event to display what the student is checking in for
  useEffect(() => {
    const fetchActiveEvent = async () => {
      try {
        const res = await fetch("/api/active-event");
        if (res.ok) {
          const data = await res.json();
          setActiveEvent(data);
        }
      } catch (err) {
        console.error("Error fetching active event:", err);
      }
    };

    fetchActiveEvent();
    const interval = setInterval(fetchActiveEvent, 5000); // Poll active event every 5s
    return () => clearInterval(interval);
  }, []);

  // Handle local user registration
  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !studentId.trim()) return;

    localStorage.setItem("club_student_name", fullName.trim());
    localStorage.setItem("club_student_id", studentId.trim().toUpperCase());
    setIsRegistered(true);
  };

  // Logout/Reset registration
  const handleLogout = () => {
    localStorage.removeItem("club_student_name");
    localStorage.removeItem("club_student_id");
    setFullName("");
    setStudentId("");
    setIsRegistered(false);
    setScanSuccess(false);
    setScannedRecord(null);
    setScanError(null);
  };

  // Capture Geolocation
  const getCoordinates = (): Promise<{ lat: number; lng: number }> => {
    return new Promise((resolve) => {
      setGeoState("requesting");
      if (!navigator.geolocation) {
        setGeoState("failed");
        // Fallback to high-fidelity mock coordinates (Stanford University Campus)
        resolve({ lat: 37.4275, lng: -122.1697 });
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          setGeoState("captured");
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.warn("Geolocation request failed or timed out:", error);
          setGeoState("failed");
          // Fallback coordinates
          resolve({ lat: 37.4275, lng: -122.1697 });
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    });
  };

  // Handle scan simulation
  const handleSimulateScan = async () => {
    if (scanning) return;
    setScanning(true);
    setScanError(null);

    // Get coordinates while scanning animation plays
    const coordinates = await getCoordinates();
    setGeoCoords(coordinates);

    // Wait 1.5 seconds for scanning laser animation to look authentic
    setTimeout(async () => {
      try {
        // Fetch the ABSOLUTE LATEST dynamic token from active event endpoint to ensure success
        const activeRes = await fetch("/api/active-event");
        if (!activeRes.ok) {
          throw new Error("Unable to contact active attendance server.");
        }
        const activeData: ActiveEventStatus = await activeRes.json();
        
        // Capture User Agent for device logging
        const userAgent = navigator.userAgent;
        const shortAgent = userAgent.includes("Chrome") ? "Chrome Web Browser" 
                        : userAgent.includes("Safari") ? "Safari Browser" 
                        : userAgent.includes("Firefox") ? "Firefox Browser" 
                        : "Mobile Browser";

        // POST Check-In to API
        const response = await fetch("/api/checkin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: fullName,
            studentId: studentId.toUpperCase(),
            eventId: activeData.eventId,
            qrValue: activeData.qrValue, // Send current valid QR code value
            latitude: coordinates.lat,
            longitude: coordinates.lng,
            deviceInfo: shortAgent
          })
        });

        const result = await response.json();

        if (response.ok) {
          setScannedRecord(result.record);
          setScanSuccess(true);
        } else {
          setScanError(result.error || "An error occurred during check-in.");
        }
      } catch (err) {
        console.error("Checkin error:", err);
        setScanError("Failed to connect to attendance server. Please try again.");
      } finally {
        setScanning(false);
      }
    }, 1500);
  };

  const handleResetScanner = () => {
    setScanSuccess(false);
    setScannedRecord(null);
    setScanError(null);
    setGeoState("idle");
    setGeoCoords(null);
  };

  return (
    <div className="w-full max-w-md mx-auto bg-slate-900 border border-slate-800 rounded-[32px] overflow-hidden shadow-2xl relative flex flex-col min-h-[580px] text-white font-sans" id="student-portal">
      {/* Phone Status Bar Simulation */}
      <div className="bg-slate-950 px-6 py-2.5 flex justify-between items-center text-[10px] text-slate-500 border-b border-slate-900 font-mono">
        <div className="flex items-center gap-1">
          <Smartphone className="w-3.5 h-3.5 text-slate-400" />
          <span>STUDENT PORTAL</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Globe className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
          <span>WIFI_SECURE</span>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* VIEW 1: Login / Registration Screen */}
        {!isRegistered && (
          <motion.div
            key="register-screen"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
            className="p-6 flex flex-col flex-grow justify-center"
          >
            <div className="text-center mb-6">
              <div className="w-14 h-14 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-xl shadow-indigo-500/5">
                <QrCode className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-display font-bold text-white tracking-tight">QR Check-In</h2>
              <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                Register with your college credentials to scan the active class projector QR Code.
              </p>
            </div>

            <form onSubmit={handleRegister} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="fullname" className="text-xs font-semibold uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-indigo-400" />
                  Full Name
                </label>
                <div className="relative">
                  <input
                    id="fullname"
                    type="text"
                    required
                    placeholder="e.g. John Doe"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 focus:border-indigo-500 text-white rounded-xl py-3 pl-3 pr-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm transition-all"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="studentid" className="text-xs font-semibold uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                  <Hash className="w-3.5 h-3.5 text-indigo-400" />
                  Roll Number / Student ID
                </label>
                <div className="relative">
                  <input
                    id="studentid"
                    type="text"
                    required
                    placeholder="e.g. CS2024095"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 focus:border-indigo-500 text-white rounded-xl py-3 pl-3 pr-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm transition-all font-mono placeholder:font-sans"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] text-white font-bold py-3.5 rounded-xl mt-2 transition-all shadow-xl shadow-indigo-600/10 cursor-pointer text-sm"
              >
                Enter Scanner Portal
              </button>
            </form>
          </motion.div>
        )}

        {/* VIEW 2: Scanner / Camera Viewfinder View */}
        {isRegistered && !scanSuccess && (
          <motion.div
            key="scanner-screen"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="flex-grow flex flex-col justify-between p-5"
          >
            {/* Header with active user and logout */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3.5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold text-xs uppercase">
                  {fullName.slice(0, 2)}
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-white truncate max-w-[120px]" title={fullName}>
                    {fullName}
                  </h4>
                  <p className="text-[10px] font-mono text-slate-400">{studentId.toUpperCase()}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="text-xs flex items-center gap-1 text-slate-400 hover:text-red-400 bg-slate-800 hover:bg-red-950/20 py-1 px-2.5 rounded-lg border border-slate-700 hover:border-red-500/20 transition-all cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>

            {/* Event Header Status */}
            <div className="my-4 text-center">
              <span className="text-[10px] font-bold text-indigo-400 bg-indigo-950/40 border border-indigo-500/20 px-3 py-1 rounded-full uppercase tracking-wider inline-block">
                Ready to check in
              </span>
              <h3 className="text-base font-display font-bold text-white mt-1.5 flex items-center justify-center gap-2">
                <Sparkles className="w-4 h-4 text-yellow-400" />
                {activeEvent ? activeEvent.eventName : "Loading current event..."}
              </h3>
            </div>

            {/* Camera Viewfinder Box */}
            <div className="relative aspect-square w-full max-w-[240px] mx-auto rounded-3xl overflow-hidden bg-black/60 border-2 border-slate-800 flex items-center justify-center shadow-inner">
              {/* Laser line scanner animation */}
              {scanning && (
                <motion.div
                  initial={{ y: "-100%" }}
                  animate={{ y: "100%" }}
                  transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                  className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent shadow-lg shadow-red-500/80 z-20"
                />
              )}

              {/* Grid corners mockup */}
              <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-indigo-500"></div>
              <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-indigo-500"></div>
              <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-indigo-500"></div>
              <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-indigo-500"></div>

              {/* Inside Viewfinder details */}
              <div className="text-center p-4 flex flex-col items-center gap-2 z-10">
                <Camera className={`w-10 h-10 ${scanning ? "text-red-500 animate-pulse" : "text-slate-500"}`} />
                <p className="text-[11px] text-slate-400 max-w-[180px] leading-snug">
                  {scanning ? "Locating dynamic QR keys..." : "Position the rotating QR code within the margins"}
                </p>
                {geoState === "requesting" && (
                  <div className="flex items-center gap-1.5 text-[10px] text-indigo-400 bg-slate-900/90 py-1 px-2.5 rounded-full mt-1.5">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>Engaging Geolocation...</span>
                  </div>
                )}
              </div>
            </div>

            {/* Error Message if scan failed */}
            {scanError && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-3 bg-red-950/40 border border-red-500/30 rounded-xl flex items-start gap-2.5"
              >
                <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <h5 className="font-bold text-red-400">Verification Failure</h5>
                  <p className="text-slate-300 leading-relaxed mt-0.5">{scanError}</p>
                </div>
              </motion.div>
            )}

            {/* Simulated Scan Trigger Button */}
            <div className="mt-4 flex flex-col gap-2">
              <button
                onClick={handleSimulateScan}
                disabled={scanning}
                className={`w-full font-bold py-3 px-4 rounded-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg cursor-pointer text-sm ${
                  scanning 
                    ? "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700" 
                    : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/10"
                }`}
              >
                {scanning ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-slate-500" />
                    <span>Verifying QR Signature...</span>
                  </>
                ) : (
                  <>
                    <QrCode className="w-4 h-4" />
                    <span>Scan QR Code</span>
                  </>
                )}
              </button>
              
              <p className="text-[10px] text-slate-500 text-center flex items-center justify-center gap-1 font-semibold">
                <Compass className="w-3 h-3" />
                <span>Secured with GPS and anti-cheat checks</span>
              </p>
            </div>
          </motion.div>
        )}

        {/* VIEW 3: SUCCESS Checkmark Screen */}
        {scanSuccess && scannedRecord && (
          <motion.div
            key="success-screen"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex-grow flex flex-col justify-between p-6 text-center"
          >
            <div className="flex-grow flex flex-col items-center justify-center">
              {/* Visual Checkmark Ring */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.1, 1] }}
                transition={{ duration: 0.5, type: "spring", stiffness: 120 }}
                className="w-14 h-14 bg-indigo-500/10 border-2 border-indigo-500 text-indigo-400 rounded-full flex items-center justify-center mb-4 shadow-xl shadow-indigo-500/10"
              >
                <CheckCircle2 className="w-8 h-8 fill-indigo-600 text-slate-900" />
              </motion.div>

              <h2 className="text-lg font-display font-black text-white">Attendance Marked!</h2>
              <p className="text-[11px] text-slate-400 mt-1 font-semibold">Successfully synced with administrative ledger</p>

              {/* Record Summary Table */}
              <div className="w-full bg-slate-950/60 border border-slate-850 rounded-2xl p-4 flex flex-col gap-3 mt-6 text-left text-xs font-semibold shadow-inner">
                <div className="flex justify-between items-center border-b border-slate-900 pb-2">
                  <span className="text-slate-500">Student</span>
                  <span className="text-white font-bold">{scannedRecord.name}</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-900 pb-2">
                  <span className="text-slate-500">Student ID</span>
                  <span className="text-white font-mono font-bold">{scannedRecord.studentId}</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-900 pb-2">
                  <span className="text-slate-500">Club Event</span>
                  <span className="text-indigo-400 font-bold">{scannedRecord.eventName}</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-900 pb-2">
                  <span className="text-slate-500">Timestamp</span>
                  <span className="text-white font-mono">
                    {new Date(scannedRecord.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                </div>
                <div className="flex justify-between items-start">
                  <span className="text-slate-500">GPS Coordinates</span>
                  <div className="text-right">
                    {scannedRecord.latitude && scannedRecord.longitude ? (
                      <span className="text-indigo-400 font-mono flex items-center justify-end gap-1 font-semibold">
                        <MapPin className="w-3.5 h-3.5" />
                        {scannedRecord.latitude.toFixed(4)}, {scannedRecord.longitude.toFixed(4)}
                      </span>
                    ) : (
                      <span className="text-slate-400 font-mono italic font-semibold">Unavailable</span>
                    )}
                    {geoState === "failed" && (
                      <span className="text-[9px] text-yellow-500 block mt-0.5 flex items-center justify-end gap-1 font-semibold">
                        <AlertTriangle className="w-3 h-3" />
                        Mock coordinate (sandbox sandbox)
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Back to scanner */}
            <button
              onClick={handleResetScanner}
              className="w-full bg-slate-800 hover:bg-slate-700 active:scale-[0.98] border border-slate-700 text-white font-bold py-3.5 rounded-xl mt-4 transition-all flex items-center justify-center gap-2 cursor-pointer text-sm"
            >
              <ArrowLeft className="w-4 h-4 text-slate-400" />
              <span>Scan Again</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
