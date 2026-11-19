// ฟ้าใส: ชื่อที่แสดงของแต่ละประเภทอยู่ที่ lib/event-types.ts · "other" = ผู้จัดพิมพ์ชื่อประเภทเอง (general.typeOther)
export type EventType =
  | "seminar" | "workshop" | "training" | "jobfair" | "openhouse"
  | "conference" | "competition" | "exhibition" | "sports" | "volunteer" | "other";
/** ฟ้าใส: สถานะที่เก็บจริง (draft → scheduled เมื่อกดเผยแพร่) ส่วน open/active/ended คำนวณจากเวลา ดู lib/utils/event-phase.ts */
export type EventStatus = "draft" | "scheduled";
// ฟ้าใส: ประเภทช่องในฟอร์มลงทะเบียน 12 แบบ (ชื่อ/ไอคอน/ตัวอย่าง อยู่ที่ lib/form-types.ts)
export type FieldKind =
  | "short" | "paragraph" | "email" | "phone" | "number"
  | "radio" | "checkbox" | "dropdown" | "date" | "time" | "file" | "address";
/** ฟ้าใส: เลิกใช้แล้ว (เดิมเป็น "ช่องพื้นฐาน") — ข้อมูลเก่าถูกแปลงเป็นประเภทปกติตอนโหลด (migrateField) */
export type BasicFieldKey = "name" | "email" | "age" | "gender" | "phone" | "idno";
// ฟ้าใส: ประเภทคำถาม Survey 12 แบบ (ชื่อ/ไอคอน/การเก็บข้อมูล อยู่ที่ lib/survey-types.ts)
export type SurveyQType =
  | "short" | "long" | "single" | "multi" | "dropdown"
  | "linear" | "rating" | "opinion" | "mcgrid" | "cbgrid" | "yesno" | "date";

/** ฟ้าใส: สัดส่วนรูปปก / โฆษณา · เลือกได้ 16:9 หรือ 3:4 (ทั้งจอแนวตั้งและแนวนอน) */
export type MediaRatio = "16:9" | "3:4";
/** ฟ้าใส: สัดส่วนที่หน้าต่าง Crop รองรับ = รูปปก / โฆษณา + แบนเนอร์หัวฟอร์ม / Survey (4:1 แบบ Google Forms) */
export type CropRatio = MediaRatio | "4:1";
// ฟ้าใส: แนวจอ Kiosk
export type KioskOrientation = "portrait" | "landscape";

/** ฟ้าใส: สีของหน้าฟอร์ม / Survey ที่ตั้งแยกเอง (ขั้น Branding → ปรับแต่งเอง แท็บ ฟอร์ม / Survey) */
export interface PageTheme {
  primary: string; // ฟ้าใส: ปุ่ม ป้าย ตัวเลือกที่เลือก
  bgType: "color" | "image";
  bgColor?: string;
  bg: UploadedAsset | null; // ฟ้าใส: รูปพื้นหลังแนวตั้ง (มือถือ) ย่อเหลือ 1080×1920
  textColor?: string; // ฟ้าใส: ว่าง = อัตโนมัติตามความเข้มของพื้นหลัง
  bgBlur?: number; // ฟ้าใส: เบลอรูปพื้นหลัง (px · 0 / ไม่มี = ไม่เบลอ)
}

// ฟ้าใส: ไฟล์รูปที่อัปโหลด (ชื่อ ขนาด ตัวรูป)
export interface UploadedAsset {
  name: string;
  sizeKB: number;
  cropped?: boolean;
  /** ฟ้าใส: สัดส่วนที่ crop ไว้ (ไม่มี = 16:9 ของเดิม) · ไม่ตรงกับที่ตั้งตอนนี้ → เตือนให้ crop ใหม่ */
  ratio?: CropRatio;
  /** ฟ้าใส: รูปพื้นหลัง Kiosk: ทำไว้สำหรับจอแนวไหน (ไม่มี = แนวตั้ง) · ไม่ตรงกับจอตอนนี้ → เตือนให้อัปโหลดใหม่ */
  orientation?: KioskOrientation;
  /** ฟ้าใส: ตัวรูปจริง (data URL) — ตอนนี้เก็บเฉพาะรูปโฆษณาที่ crop เป็น 16:9 แล้ว · ไม่มี = เก็บแค่ชื่อไฟล์ (mock) */
  dataUrl?: string;
}

/** ฟ้าใส: รูปโฆษณาบนจอ Kiosk: หลายรูปเลื่อนวนอัตโนมัติ ทุก `seconds` วินาที */
export interface AdSettings {
  items: UploadedAsset[];
  seconds: number;
}

// ฟ้าใส: คะแนนเต็ม 5 หรือ 10
export type RatingMax = 5 | 10;
// ฟ้าใส: สเกลตัวเลข หรือดาว
export type RatingStyle = "number" | "star";

// ฟ้าใส: ช่อง 1 ช่องในฟอร์มลงทะเบียน
export interface FormField {
  id: string;
  label: string;
  kind: FieldKind;
  hint: string;
  required: boolean;
  options?: string[]; // ฟ้าใส: ใช้กับ radio / checkbox / dropdown
}

// ฟ้าใส: คำถาม 1 ข้อใน Survey
export interface SurveyQuestion {
  id: string;
  type: SurveyQType;
  titleTh: string;
  titleEn: string;
  required: boolean;
  options: string[]; // ฟ้าใส: ตัวเลือก (single / multi / dropdown / opinion / yesno) หรือ คอลัมน์ของตาราง (mcgrid / cbgrid)
  rows?: string[]; // ฟ้าใส: แถวของตาราง (mcgrid / cbgrid)
  ratingMax?: RatingMax; // ฟ้าใส: linear / rating: คะแนนเต็ม (ไม่มี = 5)
  scaleLabels?: { min: string; max: string }; // ฟ้าใส: linear: คำกำกับปลายซ้าย / ขวา
  /** ฟ้าใส: rating ดาวเก็บ "star" ไว้เป็นเครื่องหมายเสมอ · rating เก่าที่ไม่มีค่านี้ = สเกลตัวเลข → แปลงเป็น linear (normalizeQuestion) */
  ratingStyle?: RatingStyle;
}

// ฟ้าใส: ข้อมูลทั้งหมดของ Event ในหน้าตั้งค่า
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
    typeOther?: string; // ฟ้าใส: ชื่อประเภทที่พิมพ์เอง เมื่อ type = "other"
    organizer: string;
    phone: string;
    email: string;
    showContact: boolean;
    mode: "onsite" | "online";
    date: string; // ฟ้าใส: yyyy-MM-dd (วันเริ่ม)
    startTime: string; // ฟ้าใส: HH:mm
    /** ฟ้าใส: วันจบ (yyyy-MM-dd) · ไม่มี / ว่าง = วันเดียวกับวันเริ่ม · อยู่แค่ใน wizard store (store หลักยังไม่มีช่องนี้) */
    endDate?: string;
    endTime: string;
    venue: string;
    spot: string;
    mapUrl: string;
    cover: UploadedAsset | null;
  };
  // ฟ้าใส: Branding (Wizard ขั้นที่ 2) · ธีมสำเร็จรูป/ค่าตั้งต้น อยู่ที่ lib/theme-presets.ts
  theme: {
    primary: string; // ฟ้าใส: สีหลัก: ปุ่ม ป้าย กรอบ QR
    secondary: string; // ฟ้าใส: โทนอ่อน: ป้ายประเภทงาน, พื้นช่องรูปปกตอนยังไม่มีรูป (ตั้งจากธีมสำเร็จรูป)
    mode: "light" | "dark" | "bold"; // ฟ้าใส: สีตัวหนังสือ/หัวหน้า
    bgType: "color" | "image";
    bgColor?: string; // ฟ้าใส: พื้นหลังแบบสี (ไม่มี = ขาว)
    bgBlur?: number; // ฟ้าใส: เบลอรูปพื้นหลัง Kiosk / หน้า Event (px · 0 / ไม่มี = ไม่เบลอ)
    bg: UploadedAsset | null; // ฟ้าใส: พื้นหลังแบบรูป (dataUrl ย่อเหลือ 1080×1920)
    logo: UploadedAsset | null; // ฟ้าใส: dataUrl ย่อเหลือไม่เกิน 256px
    preset?: string; // ฟ้าใส: ธีมสำเร็จรูปที่เลือก (แก้สีเองแล้ว = ว่าง)
    /** ฟ้าใส: จอ Kiosk แนวตั้ง / แนวนอน (ไม่มี = แนวตั้ง) · ตอนนี้มีผลแค่ Preview ใน Wizard (จอ Kiosk จริงเป็นของเพื่อน) */
    kiosk?: KioskOrientation;
    /** ฟ้าใส: สัดส่วนรูปปก / โฆษณา (ไม่มี = 16:9) · ใช้ได้ทั้งจอแนวตั้งและแนวนอน */
    mediaRatio?: MediaRatio;
    /** ฟ้าใส: สีตัวอักษร (ชื่องาน รายละเอียด) ของ Kiosk / หน้า Event · ว่าง = อัตโนมัติตามโหมด */
    textColor?: string;
    /** ฟ้าใส: สีของหน้าฟอร์มลงทะเบียน / Survey แยกจาก Kiosk · ไม่มี = ใช้แบบเดียวกับ Kiosk */
    pages?: { form?: PageTheme; survey?: PageTheme };
    /** ฟ้าใส: แบนเนอร์หัวหน้าฟอร์ม / Survey (4:1 · 1600×400) แบบ Google Forms · ไม่มี = ไม่แสดงแบนเนอร์ */
    banners?: { form?: UploadedAsset | null; survey?: UploadedAsset | null };
  };
  ads: AdSettings;
  form: { fields: FormField[] };
  schedule: {
    regOpen: string; // ฟ้าใส: yyyy-MM-ddTHH:mm
    regClose: string;
    /** ฟ้าใส: เลิกใช้แล้ว (ไม่จำกัดจำนวน) — เก็บไว้เป็น "" เพราะ lib/public-event.ts ยังอ่านช่องนี้ */
    maxAttendees: string;
    surveyOpen: string;
    surveyClose: string;
    /** ฟ้าใส: เลิกใช้แล้ว (ตัดการส่งข้อความเตือนออก) */
    remindAfterEnd: boolean;
  };
  survey: { enabled: boolean; questions: SurveyQuestion[] };
  /** ฟ้าใส: Event ปิด: รับลงทะเบียนเฉพาะรายชื่อที่ import (ไม่มี = Event เปิด) · ดู lib/allow-list.ts */
  allowList?: AllowList;
}

// ฟ้าใส: ตรวจรายชื่อด้วยอีเมล หรือเบอร์มือถือ
export type AllowListKind = "email" | "phone";

// ฟ้าใส: การตั้งค่ารายชื่อของ Event ปิด
export interface AllowList {
  closed: boolean; // ฟ้าใส: เปิดโหมด Event ปิด
  kind: AllowListKind; // ฟ้าใส: ตรวจด้วยอีเมล หรือ เบอร์มือถือ
  values: string[]; // ฟ้าใส: ค่าที่ normalize แล้ว ไม่ซ้ำ
  fileName: string;
  importedAt: string;
}

/** ฟ้าใส: ผู้ลงทะเบียน: values เก็บตาม id ของ field ในฟอร์ม */
export interface Registration {
  id: string;
  values: Record<string, string>;
  registeredAt: string;
  checkedIn: boolean;
}

// ฟ้าใส: คำตอบ Survey 1 ชุด
export interface SurveyResponse {
  id: string;
  registrationId: string;
  submittedAt: string;
  answers: Record<string, string | string[] | number>;
}
