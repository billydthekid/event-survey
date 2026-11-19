// lib/public-event.ts
// ข้อมูล Event สำหรับหน้าผู้เข้าร่วม (สแกน QR → /r/<code> ลงทะเบียน, /s/<code> แบบประเมิน)
//
// แหล่งข้อมูล (เหมือนจอ Kiosk):
// - store หลัก (Event)        → หา Event จากรหัส, สถานะ, Theme, โลโก้
// - wizard store (EventDraft) → ฟอร์มลงทะเบียน / Survey / ช่วงเวลา ที่ Event Admin ตั้งใน Wizard
// - mock ของหน้า Report      → Survey ของงานตัวอย่าง (store หลักยังไม่เก็บ event.survey)
// ทุกอย่างถูกแปลงเป็นรูปแบบเดียว (PublicEvent) หน้าจอจึงไม่ต้องรู้ว่ามาจากไหน
import type { BiText, Event, FieldType, QuestionType, Registration } from "@/types";
import type { AllowListKind, BasicFieldKey, EventDraft, FieldKind, FormField as WizardField } from "@/types/event";
import { answerKeys } from "@/lib/form-types";
import { eventTypeLabel } from "@/lib/event-types";
import { pageLook, type PageKey, type PageLook } from "@/lib/theme-presets";
import { isActive, normalizeContact } from "@/lib/allow-list";
import { normalizeQuestion } from "@/lib/survey-types";
import { getReportData } from "@/app/admin/events/[id]/report/mockData";

// ============ ช่องในฟอร์มลงทะเบียน ============
export type PublicFieldType =
  | "text" | "email" | "phone" | "age" | "number" | "gender" | "idno"
  | "dropdown" | "multi" | "longtext" | "date"
  // เพิ่มจากฟอร์ม 12 ประเภทของ Wizard (lib/form-types.ts)
  | "radio" | "time" | "file" | "address";

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
  ratingMax?: 5 | 10; // linear / rating: คะแนนเต็ม (ไม่มี = 5)
  ratingStyle?: "number" | "star"; // rating ของข้อมูลตัวอย่าง (Report) · คำถามจาก Wizard: linear = ตัวเลข, rating = ดาว
  rows?: BiText[]; // mcgrid / cbgrid: แถวของตาราง (options = คอลัมน์)
}

export interface PublicEvent {
  id: string;
  code: string;
  status: Event["status"];
  name: BiText;
  desc: BiText;
  organizer: string;
  contactEmail: string; // "" = ไม่แสดง (ไม่ได้กรอก หรือ Event Admin ปิดสวิตช์แสดงช่องทางติดต่อ)
  contactPhone: string; // "" = ไม่แสดง
  mapUrl: string; // ลิงก์แผนที่ "" = ไม่มี
  typeLabel: BiText; // ประเภทงาน เช่น สัมมนา / Workshop
  date: string; // yyyy-MM-dd
  endDate: string; // วันจบ (งานหลายวัน) "" = วันเดียวกับวันเริ่ม
  startTime: string;
  endTime: string;
  venue: string;
  // textColor: สีตัวอักษร (ชื่องาน รายละเอียด) ที่ Event Admin ตั้งเอง "" = อัตโนมัติตามโหมด
  theme: { primary: string; mode: "light" | "dark" | "bold"; background: ThemeBackground; textColor: string };
  // หน้าตาหน้าฟอร์ม (/r) / Survey (/s) จาก Wizard ขั้น Branding (pageLook ของ P1tch4pa) · ไม่มี draft = ไม่มี
  pages?: Record<PageKey, PageStyle>;
  logo?: string;
  cover?: string; // รูปปก 16:9 (Wizard ขั้น Branding) ไม่มี = ไม่แสดง
  closed: boolean; // Event ปิด (รับเฉพาะรายชื่อที่ import) → แบบประเมินตอบได้เฉพาะผู้ที่ลงทะเบียน
  // ช่วงเวลา (yyyy-MM-ddTHH:mm หรือ ISO) "" = ไม่กำหนด
  regOpen: string;
  regClose: string;
  maxAttendees: number; // 0 = ไม่จำกัด
  surveyOpen: string;
  surveyClose: string;
  fields: PublicField[];
  registration: { enabled: boolean }; // false = Event นี้ไม่รับลงทะเบียน (ฟอร์มใน Wizard ไม่มีช่อง)
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

// ฟอร์มตั้งต้น เมื่อ Event ยังไม่ได้ตั้งช่องใดเลย (ฟอร์มที่ Event Admin ตั้งใน Wizard มาก่อนเสมอ)
// - Event เปิด: ชื่ออย่างเดียว (ผู้เข้าร่วมไม่ต้องให้อีเมล ไม่ดูเหมือนล็อกอิน)
// - Event ปิด: ชื่อ + ช่องที่ใช้เช็ครายชื่อ (อีเมล หรือ เบอร์ ตามที่ Event Admin เลือกตอน import)
const basicField = (k: BasicFieldKey): PublicField => ({
  id: `f-${k}`,
  key: k,
  label: BASIC[k].label,
  type: BASIC[k].type,
  required: true,
  options: [],
});
function defaultFields(allow: EventDraft["allowList"]): PublicField[] {
  return isActive(allow) ? [basicField("name"), basicField(allow.kind)] : [basicField("name")];
}

// ช่องจาก Wizard: 12 ประเภท → ชนิดของหน้า /r (ชื่อช่องมีแต่ภาษาไทย)
const KIND_TO_PUBLIC: Record<FieldKind, PublicFieldType> = {
  short: "text", paragraph: "longtext", email: "email", phone: "phone", number: "number",
  radio: "radio", checkbox: "multi", dropdown: "dropdown", date: "date", time: "time", file: "file", address: "address",
};
function fromWizard(fields: WizardField[]): PublicField[] {
  const keys = answerKeys(fields); // ช่องอีเมล/เบอร์/ชื่อ ช่องแรกใช้ key มาตรฐาน (Report และ Event ปิด อ่านจาก key นี้)
  return fields.map((f) => ({
    id: f.id,
    key: keys[f.id],
    label: { th: f.label || "(ไม่มีชื่อช่อง)" },
    type: KIND_TO_PUBLIC[f.kind] ?? "text",
    required: f.required,
    options: (f.options ?? []).filter((o) => o.trim()).map((o) => ({ th: o })),
  }));
}

// ช่องจาก store หลัก (Event.registration.fields)
const FIELD_TYPE: Record<FieldType, PublicFieldType> = {
  text: "text", email: "email", phone: "phone", age: "age", gender: "gender",
  studentId: "idno", dropdown: "dropdown", multi: "multi", longtext: "longtext", date: "date",
};

// ============ โลโก้ + พื้นหลัง (Wizard ขั้น Branding) ============
// Wizard เก็บรูปไว้ใน wizard store เท่านั้น (ไม่ได้ส่งไป store หลัก) → อ่านจาก draft ก่อน แล้วค่อยใช้ค่าใน Event
// custom = สีพื้นหลังที่ Event Admin เลือกเอง ("" = ไม่ได้เลือก → ใช้สีตั้งต้นของรูปแบบธีม)
// base   = สีพื้นหลังเดิมใน store หลัก (ใช้กับธีม Light เท่านั้น เหมือนเดิม)
// image  = รูปพื้นหลัง ("" = ไม่มี)
export interface ThemeBackground {
  custom: string;
  base: string;
  image: string;
}
export function themeBackground(event: Event, draft?: EventDraft): ThemeBackground {
  const t = draft?.theme;
  const b = event.theme.background;
  return {
    custom: (t?.bgType !== "image" && t?.bgColor) || "",
    base: b.type === "color" ? b.value : "",
    image: t ? (t.bgType === "image" ? t.bg?.dataUrl || "" : "") : b.type === "image" ? b.value : "",
  };
}
export const themeLogo = (event: Event, draft?: EventDraft) => draft?.theme.logo?.dataUrl || event.theme.logo;

// หน้าตาของหน้าฟอร์ม / Survey: ใช้ pageLook() ตัวเดียวกับ Preview ใน Wizard → หน้าจริงตรงกับที่ Event Admin เห็น
// own = Event Admin เปิด "ตั้งสีแยก" ของหน้านั้น (ไม่เปิด = ใช้สีเดียวกับ Kiosk → หน้าเราใช้ธีมเดิมของเรา)
export interface PageStyle extends PageLook {
  own: boolean;
}
function pageStyles(draft?: EventDraft): Record<PageKey, PageStyle> | undefined {
  if (!draft) return undefined;
  const style = (k: PageKey): PageStyle => ({ ...pageLook(draft.theme, k), own: !!draft.theme.pages?.[k] });
  return { form: style("form"), survey: style("survey") };
}
// รูปปก: Wizard (crop 16:9 แล้ว) → รูปเดิมใน store หลัก · ไม่มีทั้งคู่ = undefined
export const eventCover = (event: Event, draft?: EventDraft) => draft?.general.cover?.dataUrl || event.coverImage || undefined;

// ============ แปลง Event → PublicEvent ============
export function buildPublicEvent(event: Event, draft?: EventDraft): PublicEvent {
  const g = draft?.general;
  const report = getReportData(event.id);

  // ฟอร์ม:
  // - มี draft ของ Wizard → ใช้ฟอร์มใน Wizard ตรง ๆ (ไม่มีช่องเลย = Event นี้ไม่รับลงทะเบียน · กติกาของ Wizard)
  // - ไม่มี draft (งานตัวอย่างที่ยังไม่เคยเปิด Wizard) → ฟอร์มใน Event → ฟอร์มตั้งต้น
  const fields = draft
    ? fromWizard(draft.form.fields)
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
        : defaultFields(undefined); // ไม่มี draft = ไม่มีรายชื่อ Event ปิด → ฟอร์มตั้งต้นแบบ Event เปิด

  // Survey:
  // - มี draft ของ Wizard → ใช้คำถามใน Wizard ตรง ๆ (ไม่มีคำถาม = Event นี้ไม่มีแบบประเมิน · กติกาของ Wizard)
  // - ไม่มี draft (งานตัวอย่าง) → คำถามใน Event → mock ของ Report
  let questions: PublicQuestion[] = [];
  if (draft) {
    // 12 ประเภทจาก Survey Builder (lib/survey-types.ts) · ข้อมูลเก่า rating ตัวเลข → linear
    questions = draft.survey.questions.map(normalizeQuestion).map((q) => ({
      id: q.id,
      type: q.type,
      title: { th: q.titleTh, en: q.titleEn || undefined },
      required: q.required,
      options: q.options.filter((o) => o.trim()).map((o) => ({ th: o })),
      ratingMax: q.ratingMax,
      ratingStyle: q.type === "rating" ? "star" : q.type === "linear" ? "number" : undefined,
      ratingLabels:
        q.type === "linear" && (q.scaleLabels?.min || q.scaleLabels?.max)
          ? { min: { th: q.scaleLabels.min }, max: { th: q.scaleLabels.max } }
          : undefined,
      rows: q.rows?.filter((r) => r.trim()).map((r) => ({ th: r })),
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
  // มี draft → มีคำถาม = มีแบบประเมิน (Wizard ไม่มีสวิตช์เปิด/ปิดแล้ว) · ไม่มี draft → ดูสวิตช์ใน Event / mock
  const surveyEnabled = draft ? true : !!event.survey?.enabled || !!report?.survey.enabled;
  // ช่องทางติดต่อ: แสดงเฉพาะเมื่อ Event Admin เปิดสวิตช์ "แสดงช่องทางติดต่อบนหน้า Event"
  const showContact = g ? g.showContact : event.showContact;
  const type = (g?.type || event.type) as EventDraft["general"]["type"];

  return {
    id: event.id,
    code: event.code,
    status: event.status,
    name: { th: g?.nameTh || event.name.th, en: g?.nameEn || event.name.en },
    desc: { th: g?.descTh || event.description.th, en: g?.descEn || event.description.en },
    organizer: g?.organizer || event.organizerName || "",
    contactEmail: showContact ? g?.email || event.email || "" : "",
    contactPhone: showContact ? g?.phone || event.phone || "" : "",
    mapUrl: g?.mapUrl || event.mapUrl || "",
    typeLabel: {
      th: eventTypeLabel(type, g?.typeOther, "th"),
      en: eventTypeLabel(type, g?.typeOther, "en"),
    },
    date: g?.date || event.date,
    endDate: g?.endDate || "", // มีเฉพาะใน Wizard (store หลักยังไม่มีช่องนี้)
    startTime: g?.startTime || event.startTime,
    endTime: g?.endTime || event.endTime,
    venue: [g?.venue || event.venue, g?.spot || event.meetingPoint].filter(Boolean).join(" · "),
    theme: {
      primary: draft?.theme.primary || event.theme.primary,
      mode: draft?.theme.mode || event.theme.kind,
      background: themeBackground(event, draft),
      textColor: draft?.theme.textColor || "",
    },
    pages: pageStyles(draft),
    logo: themeLogo(event, draft),
    cover: eventCover(event, draft),
    closed: isActive(draft?.allowList),
    regOpen: draft?.schedule.regOpen || event.registration.opensAt,
    regClose: draft?.schedule.regClose || event.registration.closesAt,
    maxAttendees: Number(draft?.schedule.maxAttendees || event.registration.maxAttendees || 0) || 0,
    surveyOpen: draft?.schedule.surveyOpen || event.surveyWindow.opensAt,
    surveyClose: draft?.schedule.surveyClose || event.surveyWindow.closesAt,
    fields,
    registration: { enabled: fields.length > 0 },
    survey: { enabled: surveyEnabled && questions.length > 0, questions },
  };
}

// หา Event จากรหัสใน URL (ไม่สนตัวพิมพ์เล็ก-ใหญ่) · ฉบับร่าง / ถูกลบ = ไม่พบ
export function findPublicEvent(events: Event[], code: string): Event | undefined {
  const c = decodeURIComponent(code).trim().toLowerCase();
  return events.find((e) => e.code.toLowerCase() === c && e.status !== "draft" && e.status !== "deleted");
}

// ============ ช่วงเวลาเปิด-ปิด (ใช้ร่วมกัน: หน้า /r, หน้า /s และจอ Kiosk) ============
// กฎ:
// - เวลาที่ Event Admin ตั้งใน Wizard มาก่อนเสมอ
// - ไม่ได้ตั้ง → ลงทะเบียนและแบบประเมิน เปิดตอนงานเริ่ม และปิดตอนงานจบ
// "งานเริ่ม/จบ" ดูจากวัน-เวลาจัดงานจริง แบบเดียวกับฝั่ง Event Admin (lib/utils/event-phase.ts)
// เพราะสถานะที่เก็บไว้ไม่ได้บอกช่วงงาน: กดเผยแพร่แล้วเป็น "active" ทันที และไม่มีอะไรเปลี่ยนเป็น "ended"
export interface ScheduleInfo {
  status: Event["status"];
  date: string;
  endDate: string; // วันจบ (งานหลายวัน) "" = วันเดียวกับวันเริ่ม
  startTime: string;
  endTime: string;
  regOpen: string;
  regClose: string;
  maxAttendees: number;
  surveyOpen: string;
  surveyClose: string;
  registration: { enabled: boolean };
  survey: { enabled: boolean };
}

const before = (iso: string, now: Date) => !!iso && now < new Date(iso);
const after = (iso: string, now: Date) => !!iso && now > new Date(iso);
export const eventStart = (e: ScheduleInfo) => (e.date && e.startTime ? `${e.date}T${e.startTime}` : "");
export const eventEnd = (e: ScheduleInfo) => (e.date && e.endTime ? `${e.endDate || e.date}T${e.endTime}` : "");

// ช่วงของงาน: ยังไม่เริ่ม / กำลังจัด / จบแล้ว
// มีวัน-เวลาครบ → ดูจากนาฬิกา · ไม่ครบ (ข้อมูลตัวอย่างเก่าบางงาน) → ใช้สถานะที่เก็บไว้แทน
export type EventPhase = "upcoming" | "live" | "ended";
export function getEventPhase(e: ScheduleInfo, now: Date): EventPhase {
  const start = eventStart(e);
  const end = eventEnd(e);
  if (start && end) {
    if (now > new Date(end)) return "ended";
    if (now >= new Date(start)) return "live";
    return "upcoming";
  }
  return e.status === "ended" ? "ended" : e.status === "active" ? "live" : "upcoming";
}

// เวลาที่ใช้แสดงบนจอ ("" = ไม่รู้เวลา → ไม่แสดงบรรทัดเวลา)
export const regOpensAt = (e: ScheduleInfo) => e.regOpen || eventStart(e);
export const regClosesAt = (e: ScheduleInfo) => e.regClose || eventEnd(e);
export const surveyOpensAt = (e: ScheduleInfo) => e.surveyOpen || eventStart(e);
export const surveyClosesAt = (e: ScheduleInfo) => e.surveyClose || eventEnd(e);

// ช่วงลงทะเบียน: เปิดฟอร์ม / ยังไม่เปิด (C1) / ปิดแล้ว (C2) / เต็ม (C3)
// (ใช้ร่วมกับการ์ดสถานะของเพื่อน components/dashboard/EventStatusCard.tsx → คงไว้ 4 ค่าเหมือนเดิม)
export type RegisterPhase = "open" | "notOpen" | "closed" | "full";
export function getRegisterPhase(e: ScheduleInfo, now: Date, registeredCount: number): RegisterPhase {
  const phase = getEventPhase(e, now);
  // ยังไม่เปิด: ถึงเวลาเปิดที่ตั้งไว้หรือยัง / ไม่ได้ตั้ง → รองานเริ่ม
  if (e.regOpen ? before(e.regOpen, now) : phase === "upcoming") return "notOpen";
  // ปิดแล้ว: เลยเวลาปิดที่ตั้งไว้ / ไม่ได้ตั้ง → ปิดพร้อมงานจบ
  if (e.regClose ? after(e.regClose, now) : phase === "ended") return "closed";
  if (e.maxAttendees > 0 && registeredCount >= e.maxAttendees) return "full";
  return "open";
}

// สถานะของหน้า /r และจอ Kiosk = ช่วงลงทะเบียน + "none" (งานนี้ไม่รับลงทะเบียน: ฟอร์มใน Wizard ไม่มีช่อง)
export type RegisterState = RegisterPhase | "none";
export function getRegisterState(e: ScheduleInfo, now: Date, registeredCount: number): RegisterState {
  if (!e.registration.enabled) return "none";
  return getRegisterPhase(e, now, registeredCount);
}

// หน้าแบบประเมิน: เปิด / ยังไม่เปิด / ปิดแล้ว / งานนี้ไม่มีแบบประเมิน
export type SurveyPhase = "open" | "notOpen" | "closed" | "none";
export function getSurveyPhase(e: ScheduleInfo, now: Date): SurveyPhase {
  if (!e.survey.enabled) return "none";
  const phase = getEventPhase(e, now);
  if (e.surveyOpen ? before(e.surveyOpen, now) : phase === "upcoming") return "notOpen";
  // ปิด: เลยเวลาที่ตั้งไว้ (เช่น หลังจบงาน 1 ชม.) / ไม่ได้ตั้ง → ปิดพร้อมงานจบ
  if (e.surveyClose ? after(e.surveyClose, now) : phase === "ended") return "closed";
  return "open";
}

// ============ Event ปิด: แบบประเมินตอบได้เฉพาะผู้ที่ลงทะเบียนแล้ว ============
// หาการลงทะเบียนของงานนี้จากอีเมล/เบอร์ (ช่องเดียวกับที่ Event ปิดใช้ตรวจรายชื่อ)
// หน้า /r เก็บช่องอีเมล/เบอร์ช่องแรกไว้ที่ key "email" / "phone" (answerKeys ใน lib/form-types.ts)
// ข้อมูลอยู่ใน localStorage → ตรวจได้เมื่อลงทะเบียนและตอบแบบประเมินบนเครื่องเดียวกัน
export function findRegistration(
  registrations: Registration[],
  eventId: string,
  kind: AllowListKind,
  raw: string
): Registration | undefined {
  const want = normalizeContact(kind, raw);
  if (!want) return undefined;
  return registrations.find((r) => {
    if (r.eventId !== eventId) return false;
    const v = r.answers[kind];
    return typeof v === "string" && normalizeContact(kind, v) === want;
  });
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
