// types/index.ts
// รวม type ทั้งหมดของแอป — ไฟล์อื่น import จากที่นี่

// ============ Role & Language ============
// admin     = ผู้ดูแลระบบ (เดิมชื่อ "super") เห็นและจัดการได้ทุก Event
// organizer = ผู้จัดงาน    (เดิมชื่อ "event") จัดการได้เฉพาะ Event ที่ได้รับมอบหมาย
export type Role = "admin" | "organizer";
export type Lang = "th" | "en";

export interface BiText {
  th: string;
  en?: string;
}

// ============ User ============
export interface User {
  id: string;
  name: string;
  username: string;          // เติม suffix อัตโนมัติ เช่น "thanapath.admin"
  password: string;          // mock เท่านั้น plain text
  role: Role;
  org: string;
  active: boolean;           // false = บัญชีถูกปิด
  lang: Lang;
  eventIds: string[];        // Event ที่ดูแล (role organizer)
  createdAt: string;
  lastLoginAt?: string;
}

// ============ Event Status ============
export type EventStatus =
  | "draft"       // ฉบับร่าง
  | "scheduled"   // ใกล้ถึง
  | "active"      // กำลังจัดงาน
  | "ended"       // จบแล้ว
  | "deleted";    // ถูกลบ (30 วัน)

export type EventType =
  | "seminar" | "workshop" | "training" | "jobfair" | "openhouse"
  | "conference" | "competition" | "exhibition" | "sports" | "volunteer" | "other";
export type EventMode = "onsite" | "online";
export type ThemeKind = "light" | "dark" | "bold";

export interface Event {
  id: string;
  code: string;
  status: EventStatus;

  name: BiText;
  description: BiText;
  type: EventType;
  mode: EventMode;

  date: string;
  startTime: string;
  endTime: string;
  venue?: string;
  meetingPoint?: string;
  mapUrl?: string;

  organizerName: string;
  phone?: string;
  email?: string;
  showContact: boolean;

  coverImage?: string;
  theme: {
    primary: string;
    secondary: string;
    kind: ThemeKind;
    background: { type: "color" | "image"; value: string };
    logo?: string;
  };

  adImage?: string;

  registration: {
    opensAt: string;
    closesAt: string;
    maxAttendees?: number;
    fields: FormField[];
  };

  survey?: Survey;
  surveyWindow: { opensAt: string; closesAt: string };

  kiosk: { screen: "register" | "survey" | "both" };

  createdBy: string;
  adminIds: string[];
  prevStatus?: EventStatus;
  deletedAt?: string;
  purgeAt?: string;
}

// ============ Form Field ============
export type FieldType =
  | "text" | "email" | "phone" | "age" | "gender"
  | "studentId" | "dropdown" | "multi" | "longtext" | "date";

export interface FormField {
  id: string;
  key: string;
  label: BiText;
  type: FieldType;
  required: boolean;
  options?: BiText[];
  order: number;
}

// ============ Survey ============
export type QuestionType =
  | "short" | "long" | "single" | "multi" | "dropdown" | "rating" | "date"
  // เพิ่มจาก Survey Builder 12 ประเภท (lib/survey-types.ts)
  | "linear" | "opinion" | "mcgrid" | "cbgrid" | "yesno";

export interface Question {
  id: string;
  type: QuestionType;
  title: BiText;
  required: boolean;
  options?: BiText[];
  order: number;
}

export interface Survey {
  id: string;
  title: BiText;
  enabled: boolean;
  questions: Question[];
}

// ============ Registration & Response ============
export interface Registration {
  id: string;
  eventId: string;
  createdAt: string;
  answers: Record<string, string | string[]>;
}

export interface SurveyResponse {
  id: string;
  eventId: string;
  createdAt: string;
  answers: Record<string, string | string[] | number>;
}

// ============ Action Log ============
export interface ActionLog {
  id: string;
  at: string;
  actorId: string;
  action: string;
  targetType: string;
  targetId: string;
  detail?: string;
}

// ============ Notification ============
export interface Notification {
  id: string;
  toUserId: string;
  text: string;
  link?: string;
  read: boolean;
  createdAt: string;
}

// ============ Session ============
export interface Session {
  userId: string;
  loginAt: string;
}
