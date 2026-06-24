export interface AttendanceRecord {
  id: string;
  name: string;
  studentId: string;
  eventId: string;
  eventName: string;
  timestamp: string;
  latitude: number | null;
  longitude: number | null;
  deviceInfo?: string;
}

export interface ClubEvent {
  id: string;
  name: string;
  date: string;
  instructor: string;
}

export interface ActiveEventStatus {
  eventId: string;
  eventName: string;
  qrValue: string;
  expiresIn: number; // seconds remaining for current QR
}
