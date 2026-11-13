// lib/public-event.ts
// ข้อมูล Event สำหรับหน้าผู้เข้าร่วม (สแกน QR → /r/<code> ลงทะเบียน, /s/<code> แบบประเมิน)
//
// แหล่งข้อมูล (เหมือนจอ Kiosk):
// - store หลัก (Event)        → หา Event จากรหัส, สถานะ, Theme, โลโก้
// - wizard store (EventDraft) → ฟอร์มลงทะเบียน / Survey / ช่วงเวลา ที่ Event Admin ตั้งใน Wizard
// - mock ของหน้า Report      → Survey ของงานตัวอย่าง (store หลักยังไม่เก็บ event.survey)
// ทุกอย่างถูกแปลงเป็นรูปแบบเดียว (PublicEvent) หน้าจอจึงไม่ต้องรู้ว่ามาจากไหน
import type { BiText, Event, FieldType, QuestionType } from "@/types";
import type { BasicFieldKey, EventDraft, FormField as WizardField } from "@/types/event";
import { getReportData } from "@/app/admin/events/[id]/report/mockData";

// ============ ช่องในฟอร์มลงทะเบียน ============
export type PublicFieldType =
  | "text" | "email" | "phone" | "age" | "number" | "gender" | "idno"
  | "dropdown" | "multi" | "longtext" | "date";

export interface PublicField {
  id: string;
  key: string; // ชื่อที่ใช้เก็บคำตอบ (ช่องพื้นฐานใช้ชื่อมาตรฐาน: name, email, age, gender, phone, idno)
  label: BiText;
  type: PublicFieldType;
  required: boolean;
  options: BiText[]; // dropdown / multi
}

// ============ คำถามแบบประเมิน ============
export interface PublicQuestion {
  id: string;
  type: QuestionType;
  title: BiText;
  required: boolean;
  options: BiText[];
  ratingLabels?: { min: BiText; max: BiText }; // คำกำกับใต้เลข 1 และ 5
}

export interface PublicEvent {
  id: string;
  code: string;
  status: Event["status"];
  name: BiText;
  desc: BiText;
  organizer: string;
  contactEmail: string;
  date: string; // yyyy-MM-dd
  startTime: string;
  endTime: string;
  venue: string;
  theme: { primary: string; mode: "light" | "dark" | "bold" };
  logo?: string;
  // ช่วงเวลา (yyyy-MM-ddTHH:mm หรือ ISO) "" = ไม่กำหนด
  regOpen: string;
  regClose: string;
  maxAttendees: number; // 0 = ไม่จำกัด
  surveyOpen: string;
  surveyClose: string;
  fields: PublicField[];
  survey: { enabled: boolean; questions: PublicQuestion[] };
}

// ============ ช่องพื้นฐาน: ชื่อ 2 ภาษา + ชนิด ============
const BASIC: Record<BasicFieldKey, { label: BiText; type: PublicFieldType }> = {
  name: { label: { th: "ชื่อ – นามสกุล", en: "Full name" }, type: "text" },
  email: { label: { th: "อีเมล", en: "Email" }, type: "email" },
  age: { label: { th: "อายุ", en: "Age" }, type: "age" },
  gender: { label: { th: "เพศ", en: "Gender" }, type: "gender" },
  phone: { label: { th: "เบอร์โทรศัพท์", en: "Phone number" }, type: "phone" },
  idno: { label: { th: "เลขประจำตัว", en: "ID number" }, type: "idno" },
};

// ค่าเพศที่เก็บ (ตรงกับหน้า Report: male / female / unspecified)
export const GENDER_OPTIONS: { value: string; label: BiText }[] = [
  { value: "male", label: { th: "ชาย", en: "Male" } },
  { value: "female", label: { th: "หญิง", en: "Female" } },
  { value: "unspecified", label: { th: "ไม่ระบุ", en: "Not specified" } },
];

// ฟอร์มตั้งต้น เมื่อ Event ยังไม่ได้ตั้งช่องใดเลย
const DEFAULT_FIELDS: PublicField[] = (["name", "email"] as const).map((k) => ({
  id: `f-${k}`,
  key: k,
  label: BASIC[k].label,
  type: BASIC[k].type,
  required: true,
  options: [],
}));

// ช่องจาก Wizard (ชื่อช่องมีแต่ภาษาไทย / dropdown-multi ยังไม่มีตัวเลือก)
function fromWizard(f: WizardField): PublicField {
  if (f.basicKey) {
    const b = BASIC[f.basicKey];
    return { id: f.id, key: f.basicKey, label: b.label, type: b.type, required: f.required, options: [] };
  }
  const type: PublicFieldType =
    f.kind === "multiselect" ? "multi" : f.kind === "dropdown" ? "dropdown" : f.kind;
  return { id: f.id, key: f.id, label: { th: f.label }, type, required: f.required, options: [] };
}

// ช่องจาก store หลัก (Event.registration.fields)
const FIELD_TYPE: Record<FieldType, PublicFieldType> = {
  text: "text", email: "email", phone: "phone", age: "age", gender: "gender",
  studentId: "idno", dropdown: "dropdown", multi: "multi", longtext: "longtext", date: "date",
};

// ============ แปลง Event → PublicEvent ============
export function buildPublicEvent(event: Event, draft?: EventDraft): PublicEvent {
  const g = draft?.general;
  const report = getReportData(event.id);

  // ฟอร์ม: Wizard → Event → ฟอร์มตั้งต้น (ชื่อ + อีเมล)
  const fields =
    draft && draft.form.fields.length > 0
      ? draft.form.fields.map(fromWizard)
      : event.registration.fields.length > 0
        ? [...event.registration.fields]
            .sort((a, b) => a.order - b.order)
            .map((f) => ({
              id: f.id,
              key: f.key,
              label: f.label,
              type: FIELD_TYPE[f.type],
              required: f.required,
              options: f.options ?? [],
            }))
        : DEFAULT_FIELDS;

  // Survey: Wizard (ถ้ามีคำถาม) → Event → mock ของ Report
  let questions: PublicQuestion[] = [];
  if (draft && draft.survey.questions.length > 0) {
    questions = draft.survey.questions.map((q) => ({
      id: q.id,
      type: q.type,
      title: { th: q.titleTh, en: q.titleEn || undefined },
      required: q.required,
      options: q.options.map((o) => ({ th: o })),
    }));
  } else {
    const source = event.survey?.questions.length ? event.survey : report?.survey;
    questions = [...(source?.questions ?? [])]
      .sort((a, b) => a.order - b.order)
      .map((q) => ({
        id: q.id,
        type: q.type,
        title: q.title,
        required: q.required,
        options: q.options ?? [],
        ratingLabels: report?.ratingLabels?.[q.id],
      }));
  }
  const surveyEnabled =
    !!draft?.survey.enabled || !!event.survey?.enabled || !!report?.survey.enabled;

  return {
    id: event.id,
    code: event.code,
    status: event.status,
    name: { th: g?.nameTh || event.name.th, en: g?.nameEn || event.name.en },
    desc: { th: g?.descTh || event.description.th, en: g?.descEn || event.description.en },
    organizer: g?.organizer || event.organizerName || "",
    contactEmail: (g ? g.showContact : event.showContact) ? g?.email || event.email || "" : "",
    date: g?.date || event.date,
    startTime: g?.startTime || event.startTime,
    endTime: g?.endTime || event.endTime,
    venue: [g?.venue || event.venue, g?.spot || event.meetingPoint].filter(Boolean).join(" · "),
    theme: { primary: draft?.theme.primary || event.theme.primary, mode: draft?.theme.mode || event.theme.kind },
    logo: event.theme.logo,
    regOpen: draft?.schedule.regOpen || event.registration.opensAt,
    regClose: draft?.schedule.regClose || event.registration.closesAt,
    maxAttendees: Number(draft?.schedule.maxAttendees || event.registration.maxAttendees || 0) || 0,
    surveyOpen: draft?.schedule.surveyOpen || event.surveyWindow.opensAt,
    surveyClose: draft?.schedule.surveyClose || event.surveyWindow.closesAt,
    fields,
    survey: { enabled: surveyEnabled && questions.length > 0, questions },
  };
}

// หา Event จากรหัสใน URL (ไม่สนตัวพิมพ์เล็ก-ใหญ่) · ฉบับร่าง / ถูกลบ = ไม่พบ
export function findPublicEvent(events: Event[], code: string): Event | undefined {
  const c = decodeURIComponent(code).trim().toLowerCase();
  return events.find((e) => e.code.toLowerCase() === c && e.status !== "draft" && e.status !== "deleted");
}

// ============ สถานะของหน้า ============
const before = (iso: string, now: Date) => !!iso && now < new Date(iso);
const after = (iso: string, now: Date) => !!iso && now > new Date(iso);

// หน้าลงทะเบียน: เปิดฟอร์ม / ยังไม่เปิด (C1) / ปิดแล้ว (C2) / เต็ม (C3)
export type RegisterPhase = "open" | "notOpen" | "closed" | "full";
export function getRegisterPhase(e: PublicEvent, now: Date, registeredCount: number): RegisterPhase {
  if (before(e.regOpen, now)) return "notOpen";
  if (e.status === "ended" || after(e.regClose, now)) return "closed";
  if (e.maxAttendees > 0 && registeredCount >= e.maxAttendees) return "full";
  return "open";
}

// หน้าแบบประเมิน: เปิด / ยังไม่เปิด / ปิดแล้ว / งานนี้ไม่มีแบบประเมิน
export type SurveyPhase = "open" | "notOpen" | "closed" | "none";
export function getSurveyPhase(e: PublicEvent, now: Date): SurveyPhase {
  if (!e.survey.enabled) return "none";
  if (before(e.surveyOpen, now)) return "notOpen";
  // ไม่ได้ตั้งเวลาเปิด และงานยังไม่เริ่ม → ยังไม่เปิด (นับถอยหลังถึงเวลาเริ่มงาน)
  if (!e.surveyOpen && e.status === "scheduled") return "notOpen";
  if (after(e.surveyClose, now)) return "closed";
  return "open";
}

// เวลาเริ่มของ Survey ที่ยังไม่เปิด (ใช้นับถอยหลัง)
export function surveyOpensAt(e: PublicEvent): string {
  if (e.surveyOpen) return e.surveyOpen;
  return e.date && e.startTime ? `${e.date}T${e.startTime}` : "";
}

// ============ ตัวช่วยแสดงผล ============
export const pick = (t: BiText, lang: "th" | "en") => (lang === "en" && t.en) || t.th;

// ตัวย่อในกล่องโลโก้ (เมื่อไม่มีรูป): ชื่องาน EN → ชื่อผู้จัด → อักษรแรกชื่อผู้จัด → รหัสงาน
function latinAbbr(text = "") {
  const [first = "", second = ""] = text.match(/[A-Za-z]+/g) ?? [];
  return second ? first.charAt(0) + second.charAt(0) : first.slice(0, 2);
}
export function initials(e: PublicEvent) {
  const abbr = latinAbbr(e.name.en) || latinAbbr(e.organizer);
  if (abbr) return abbr.toUpperCase();
  if (e.organizer.trim()) return e.organizer.trim().charAt(0);
  return e.code.replace(/[^A-Za-z]/g, "").slice(0, 2).toUpperCase() || "EV";
}
