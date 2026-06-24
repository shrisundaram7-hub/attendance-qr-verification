import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = 3000;

app.use(express.json());

// In-memory data store
let activeEventId = "web-dev-workshop";

const events = [
  { id: "web-dev-workshop", name: "Web Dev Workshop", date: "2026-06-24", instructor: "Sarah Jenkins" },
  { id: "ai-bootcamp", name: "AI & Prompt Engineering Bootcamp", date: "2026-06-25", instructor: "David Chen" },
  { id: "design-sprint", name: "UI/UX Design Sprint", date: "2026-06-26", instructor: "Elena Rostova" },
  { id: "competitive-prog", name: "Competitive Programming Contest", date: "2026-06-27", instructor: "Alex Mercer" }
];

let attendanceRecords = [
  {
    id: "seed-1",
    name: "Aisha Sharma",
    studentId: "CS2023041",
    eventId: "web-dev-workshop",
    eventName: "Web Dev Workshop",
    timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    latitude: 37.7749,
    longitude: -122.4194,
    deviceInfo: "Chrome / macOS"
  },
  {
    id: "seed-2",
    name: "Liam O'Connor",
    studentId: "EE2022115",
    eventId: "web-dev-workshop",
    eventName: "Web Dev Workshop",
    timestamp: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
    latitude: 37.7752,
    longitude: -122.4189,
    deviceInfo: "Safari / iPhone"
  },
  {
    id: "seed-3",
    name: "Yuki Tanaka",
    studentId: "CS2023089",
    eventId: "web-dev-workshop",
    eventName: "Web Dev Workshop",
    timestamp: new Date(Date.now() - 1 * 60 * 1000).toISOString(),
    latitude: 37.7745,
    longitude: -122.4201,
    deviceInfo: "Firefox / Android"
  }
];

// Helper to get dynamic QR and active event status
const getQRStatus = () => {
  const now = Date.now();
  const epoch = 15000; // 15 seconds
  const currentBlock = Math.floor(now / epoch);
  const timeUsed = now % epoch;
  const expiresIn = Math.ceil((epoch - timeUsed) / 1000);
  
  const currentEvent = events.find(e => e.id === activeEventId) || events[0];
  const qrValue = `EVENT_${currentEvent.id}_SEC_${currentBlock}_SECURE`;
  
  return {
    eventId: currentEvent.id,
    eventName: currentEvent.name,
    qrValue,
    expiresIn
  };
};

// --- API ROUTES ---

// Get all available club events
app.get("/api/events", (req, res) => {
  res.json(events);
});

// Get current dynamic active event status & QR token
app.get("/api/active-event", (req, res) => {
  res.json(getQRStatus());
});

// Set active event (Admin)
app.post("/api/active-event", (req, res) => {
  const { eventId } = req.body;
  if (!eventId) {
    return res.status(400).json({ error: "eventId is required" });
  }
  
  const found = events.find(e => e.id === eventId);
  if (!found) {
    return res.status(404).json({ error: "Event not found" });
  }
  
  activeEventId = eventId;
  res.json({ success: true, activeEvent: found });
});

// Get attendance records for the active event
app.get("/api/attendance", (req, res) => {
  const { eventId } = req.query;
  const targetId = eventId ? String(eventId) : activeEventId;
  
  const filtered = attendanceRecords.filter(r => r.eventId === targetId);
  res.json(filtered);
});

// Submit a student check-in
app.post("/api/checkin", (req, res) => {
  const { name, studentId, eventId, qrValue, latitude, longitude, deviceInfo } = req.body;
  
  if (!name || !studentId || !eventId || !qrValue) {
    return res.status(400).json({ error: "Missing required fields: name, studentId, eventId, qrValue" });
  }
  
  // Validate dynamic QR Code
  const now = Date.now();
  const epoch = 15000;
  const currentBlock = Math.floor(now / epoch);
  const prevBlock = currentBlock - 1;
  
  const expectedTokenCurrent = `EVENT_${eventId}_SEC_${currentBlock}_SECURE`;
  const expectedTokenPrev = `EVENT_${eventId}_SEC_${prevBlock}_SECURE`;
  
  const isMatchCurrent = qrValue === expectedTokenCurrent;
  const isMatchPrev = qrValue === expectedTokenPrev;
  
  if (!isMatchCurrent && !isMatchPrev) {
    return res.status(400).json({ 
      error: "QR Code has expired or is invalid. Please scan the newly refreshed QR Code on the screen." 
    });
  }
  
  // Check if student has already checked into this event
  const alreadyCheckedIn = attendanceRecords.some(
    r => r.studentId === studentId && r.eventId === eventId
  );
  
  if (alreadyCheckedIn) {
    return res.status(400).json({ 
      error: "You have already marked attendance for this event!" 
    });
  }
  
  const event = events.find(e => e.id === eventId);
  const eventName = event ? event.name : "Club Event";
  
  const newRecord = {
    id: `rec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name,
    studentId,
    eventId,
    eventName,
    timestamp: new Date().toISOString(),
    latitude: latitude ? Number(latitude) : null,
    longitude: longitude ? Number(longitude) : null,
    deviceInfo: deviceInfo || "Unknown Web Device"
  };
  
  attendanceRecords.unshift(newRecord); // add to top
  
  res.status(201).json({ 
    success: true, 
    message: "Attendance marked successfully!", 
    record: newRecord 
  });
});

// Reset attendance list (for easy testing/playground use)
app.post("/api/reset", (req, res) => {
  attendanceRecords = [];
  res.json({ success: true, message: "Attendance records reset." });
});

// Serve frontend assets
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
