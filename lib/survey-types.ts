// lib/survey-types.ts
// ประเภทคำถาม Survey 12 แบบ (แบบ Google Form) — ใช้ร่วมกัน: Survey Builder, Preview, หน้า /s, ขั้นที่ 5 (Preview) ของ Wizard
//
// การเก็บข้อมูลของแต่ละแบบ (SurveyQuestion):
// - single / multi / dropdown / opinion / yesno → options = ตัวเลือก (opinion = ระดับความเห็น, yesno = ใช่/ไม่ใช่ ตายตัว)
// - linear (Linear Scale ตัวเลข) / rating (ดาว) → ratingMax = 5 หรือ 10 · linear มี scaleLabels คำกำกับปลายทั้งสองข้าง
// - mcgrid / cbgrid (ตาราง)       → rows = หัวข้อ (แถว) · options = ตัวเลือก (คอลัมน์)
import {
  AlignLeft, Calendar, CheckSquare, ChevronDown, CircleDot, Grid2x2Check, Grid3x3, SlidersHorizontal, Star, ThumbsUp,
  ToggleLeft, Type, type LucideIcon,
} from "lucide-react";
import type { SurveyQType, SurveyQuestion } from "@/types/event";

export interface QTypeMeta {
  value: SurveyQType;
  th: string;
  en: string; // ชื่อแบบ Google Form
  example: string; // ตัวอย่างการใช้งาน
  exampleEn: string; // ตัวอย่าง (อังกฤษ)
  icon: LucideIcon;
  hasOptions: boolean; // ผู้สร้างแก้ตัวเลือกได้
  hasRows: boolean; // ตาราง (แถว × คอลัมน์)
}

export const QTYPES: QTypeMeta[] = [
  { value: "short", th: "ข้อความสั้น", en: "Short Answer", example: "ระบุความคิดเห็นสั้น ๆ", exampleEn: "A short comment", icon: Type, hasOptions: false, hasRows: false },
  { value: "long", th: "ข้อความยาว", en: "Paragraph", example: "ข้อเสนอแนะเพิ่มเติม", exampleEn: "Further suggestions", icon: AlignLeft, hasOptions: false, hasRows: false },
  { value: "single", th: "ตัวเลือกเดียว", en: "Multiple Choice", example: "คุณรู้จัก Event จากช่องทางใด", exampleEn: "How did you hear about the event?", icon: CircleDot, hasOptions: true, hasRows: false },
  { value: "multi", th: "หลายตัวเลือก", en: "Checkboxes", example: "คุณชอบกิจกรรมส่วนไหนบ้าง", exampleEn: "Which parts did you enjoy?", icon: CheckSquare, hasOptions: true, hasRows: false },
  { value: "dropdown", th: "Dropdown", en: "Dropdown", example: "เลือกประเภทผู้เข้าร่วม", exampleEn: "Attendee type", icon: ChevronDown, hasOptions: true, hasRows: false },
  { value: "linear", th: "สเกลตัวเลข", en: "Linear Scale", example: "ให้คะแนน 1–5", exampleEn: "Score 1–5", icon: SlidersHorizontal, hasOptions: false, hasRows: false },
  { value: "rating", th: "ให้ดาว", en: "Rating", example: "ให้คะแนนด้วยดาว ⭐", exampleEn: "Star rating ⭐", icon: Star, hasOptions: false, hasRows: false },
  { value: "opinion", th: "ระดับความเห็น", en: "Opinion Scale", example: "ระดับความเห็นด้วย", exampleEn: "Level of agreement", icon: ThumbsUp, hasOptions: true, hasRows: false },
  { value: "mcgrid", th: "ตารางเลือกข้อเดียว", en: "Multiple Choice Grid", example: "ประเมินหลายหัวข้อ", exampleEn: "Rate several topics", icon: Grid3x3, hasOptions: true, hasRows: true },
  { value: "cbgrid", th: "ตารางเลือกหลายข้อ", en: "Checkbox Grid", example: "เลือกได้หลายข้อในตาราง", exampleEn: "Pick several in a grid", icon: Grid2x2Check, hasOptions: true, hasRows: true },
  { value: "yesno", th: "ใช่ / ไม่ใช่", en: "Yes / No", example: "ต้องการเข้าร่วมอีกหรือไม่", exampleEn: "Would you join again?", icon: ToggleLeft, hasOptions: false, hasRows: false },
  { value: "date", th: "วันที่", en: "Date", example: "วันที่ทำแบบสำรวจ", exampleEn: "Date of the survey", icon: Calendar, hasOptions: false, hasRows: false },
];

export const qtype = (t: SurveyQType) => QTYPES.find((q) => q.value === t) ?? QTYPES[0];

export const OPINION_LEVELS = ["ไม่เห็นด้วยอย่างยิ่ง", "ไม่เห็นด้วย", "เฉย ๆ", "เห็นด้วย", "เห็นด้วยอย่างยิ่ง"];
export const YES_NO = ["ใช่", "ไม่ใช่"];
export const GRID_COLUMNS = ["ดีมาก", "ดี", "พอใช้", "ควรปรับปรุง"];
export const GRID_ROWS = ["หัวข้อ 1", "หัวข้อ 2"];

// ค่าตั้งต้นภาษาอังกฤษ (ใช้ตอนหน้าตั้งค่าเป็น EN · ผู้ตอบเห็นตามที่ผู้จัดพิมพ์ไว้)
const EN = {
  options: ["Option 1", "Option 2"],
  opinion: ["Strongly disagree", "Disagree", "Neutral", "Agree", "Strongly agree"],
  yesno: ["Yes", "No"],
  columns: ["Excellent", "Good", "Fair", "Needs improvement"],
  rows: ["Topic 1", "Topic 2"],
};

/** ค่าตั้งต้นเมื่อเพิ่มคำถาม / เปลี่ยนประเภท (คงค่าที่ใช้ต่อได้ของคำถามเดิมไว้) */
export function defaultsFor(type: SurveyQType, prev?: SurveyQuestion, lang: "th" | "en" = "th"): Partial<SurveyQuestion> {
  const keepOptions = prev && prev.options.length >= 2;
  const en = lang === "en";
  switch (type) {
    case "single":
    case "multi":
    case "dropdown":
      return { options: keepOptions && qtype(prev.type).hasOptions && !qtype(prev.type).hasRows ? prev.options : en ? [...EN.options] : ["ตัวเลือก 1", "ตัวเลือก 2"] };
    case "opinion":
      return { options: en ? [...EN.opinion] : [...OPINION_LEVELS] };
    case "yesno":
      return { options: en ? [...EN.yesno] : [...YES_NO] };
    case "mcgrid":
    case "cbgrid":
      return {
        rows: prev?.rows?.length ? prev.rows : en ? [...EN.rows] : [...GRID_ROWS],
        options: prev && qtype(prev.type).hasRows ? prev.options : en ? [...EN.columns] : [...GRID_COLUMNS],
      };
    case "linear":
      return { options: [], ratingMax: prev?.ratingMax ?? 5, ratingStyle: undefined };
    case "rating":
      // ratingStyle "star" = เครื่องหมายว่าเป็น Rating ดาวแบบใหม่ (ข้อมูลเก่า rating ที่ไม่มีค่านี้ = สเกลตัวเลข)
      return { options: [], ratingMax: prev?.ratingMax ?? 5, ratingStyle: "star" };
    default:
      return { options: [], ratingStyle: undefined };
  }
}

/**
 * ข้อมูลเก่า: "rating" ที่ไม่ได้ตั้งเป็นดาว = สเกลตัวเลข → แปลงเป็น "linear" ตอนอ่าน
 * (เรียกซ้ำได้: rating ดาวเก็บ ratingStyle "star" ไว้เสมอ จึงไม่ถูกแปลงซ้ำ)
 */
export function normalizeQuestion(q: SurveyQuestion): SurveyQuestion {
  if (q.type === "rating" && q.ratingStyle !== "star") return { ...q, type: "linear", ratingStyle: undefined };
  if (q.type !== "rating" && q.ratingStyle) return { ...q, ratingStyle: undefined };
  return q;
}

// ============ คำตอบ ============
// ตาราง: mcgrid → string[] เรียงตามแถว (ช่องว่าง = ยังไม่ตอบแถวนั้น)
//        cbgrid → string[] ของ "แถว::คอลัมน์" (เลือกได้หลายช่องต่อแถว)
export const gridCell = (row: string, col: string) => `${row}::${col}`;

type Answer = string | string[] | number | undefined;

/** ตอบข้อนี้ครบแล้วหรือยัง (ตาราง = ตอบครบทุกแถว) */
export function isAnswered(q: { type: SurveyQType; rows?: { th: string }[] | string[] }, v: Answer): boolean {
  if (v === undefined) return false;
  if (typeof v === "number") return true;
  const rows = (q.rows ?? []).map((r) => (typeof r === "string" ? r : r.th));
  if (q.type === "mcgrid") return Array.isArray(v) && rows.length > 0 && rows.every((_, i) => !!v[i]);
  if (q.type === "cbgrid") return Array.isArray(v) && rows.every((r) => v.some((c) => c.startsWith(`${r}::`)));
  return Array.isArray(v) ? v.length > 0 : v.trim() !== "";
}
