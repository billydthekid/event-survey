// ชื่อที่แสดงของแต่ละประเภทอยู่ที่ lib/event-types.ts · "other" = ผู้จัดพิมพ์ชื่อประเภทเอง (general.typeOther)
export type EventType =
  | "seminar" | "workshop" | "training" | "jobfair" | "openhouse"
  | "conference" | "competition" | "exhibition" | "sports" | "volunteer" | "other";
/** สถานะที่เก็บจริง (draft → scheduled เมื่อกดเผยแพร่) ส่วน open/active/ended คำนวณจากเวลา ดู lib/utils/event-phase.ts */
export type EventStatus = "draft" | "scheduled";
export type FieldKind = "text" | "email" | "number" | "dropdown" | "multiselect";
export type BasicFieldKey = "name" | "email" | "age" | "gender" | "phone" | "idno";
export type SurveyQType = "short" | "long" | "single" | "multi" | "dropdown" | "rating" | "date";

export interface UploadedAsset {
  name: string;
  sizeKB: number;
  cropped?: boolean;
  /** ตัวรูปจริง (data URL) — ตอนนี้เก็บเฉพาะรูปโฆษณาที่ crop เป็น 16:9 แล้ว · ไม่มี = เก็บแค่ชื่อไฟล์ (mock) */
  dataUrl?: string;
}

/** รูปโฆษณาบนจอ Kiosk: หลายรูปเลื่อนวนอัตโนมัติ ทุก `seconds` วินาที */
export interface AdSettings {
  items: UploadedAsset[];
  seconds: number;
}

export type RatingMax = 5 | 10;
export type RatingStyle = "number" | "star";

export interface FormField {
  id: string;
  label: string;
  kind: FieldKind;
  hint: string;
  required: boolean;
  basicKey?: BasicFieldKey;
}

export interface SurveyQuestion {
  id: string;
  type: SurveyQType;
  titleTh: string;
  titleEn: string;
  required: boolean;
  options: string[]; // ใช้กับ single / multi / dropdown
  // ใช้กับ rating เท่านั้น · ไม่มีค่า = 1–5 แบบตัวเลข (ค่าเดิมก่อนมีตัวเลือกนี้)
  ratingMax?: RatingMax;
  ratingStyle?: RatingStyle;
}

export interface EventDraft {
  id: string;
  code: string;
  status: EventStatus;
  assignedBy: string;
  general: {
    nameTh: string;
    nameEn: string;
    descTh: string;
    descEn: string;
    type: EventType;
    typeOther?: string; // ชื่อประเภทที่พิมพ์เอง เมื่อ type = "other"
    organizer: string;
    phone: string;
    email: string;
    showContact: boolean;
    mode: "onsite" | "online";
    date: string; // yyyy-MM-dd
    startTime: string; // HH:mm
    endTime: string;
    venue: string;
    spot: string;
    mapUrl: string;
    cover: UploadedAsset | null;
  };
  theme: {
    primary: string;
    secondary: string;
    mode: "light" | "dark" | "bold";
    bgType: "color" | "image";
    bg: UploadedAsset | null;
    logo: UploadedAsset | null;
  };
  ads: AdSettings;
  form: { fields: FormField[] };
  schedule: {
    regOpen: string; // yyyy-MM-ddTHH:mm
    regClose: string;
    /** เลิกใช้แล้ว (ไม่จำกัดจำนวน) — เก็บไว้เป็น "" เพราะ lib/public-event.ts ยังอ่านช่องนี้ */
    maxAttendees: string;
    surveyOpen: string;
    surveyClose: string;
    /** เลิกใช้แล้ว (ตัดการส่งข้อความเตือนออก) */
    remindAfterEnd: boolean;
  };
  survey: { enabled: boolean; questions: SurveyQuestion[] };
  /** Event ปิด: รับลงทะเบียนเฉพาะรายชื่อที่ import (ไม่มี = Event เปิด) · ดู lib/allow-list.ts */
  allowList?: AllowList;
}

export type AllowListKind = "email" | "phone";

export interface AllowList {
  closed: boolean; // เปิดโหมด Event ปิด
  kind: AllowListKind; // ตรวจด้วยอีเมล หรือ เบอร์มือถือ
  values: string[]; // ค่าที่ normalize แล้ว ไม่ซ้ำ
  fileName: string;
  importedAt: string;
}

/** ผู้ลงทะเบียน: values เก็บตาม id ของ field ในฟอร์ม */
export interface Registration {
  id: string;
  values: Record<string, string>;
  registeredAt: string;
  checkedIn: boolean;
}

export interface SurveyResponse {
  id: string;
  registrationId: string;
  submittedAt: string;
  answers: Record<string, string | string[] | number>;
}
