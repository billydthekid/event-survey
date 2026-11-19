// ฟ้าใส: lib/survey-types.ts
// ฟ้าใส: ประเภทคำถาม Survey 12 แบบ (แบบ Google Form) — ใช้ร่วมกัน: Survey Builder, Preview, หน้า /s, ขั้นที่ 5 (Preview) ของ Wizard
//
// ฟ้าใส: การเก็บข้อมูลของแต่ละแบบ (SurveyQuestion):
// ฟ้าใส: - single / multi / dropdown / opinion / yesno → options = ตัวเลือก (opinion = ระดับความเห็น, yesno = ใช่/ไม่ใช่ ตายตัว)
// ฟ้าใส: - linear (Linear Scale ตัวเลข) / rating (ดาว) → ratingMax = 5 หรือ 10 · linear มี scaleLabels คำกำกับปลายทั้งสองข้าง
// ฟ้าใส: - mcgrid / cbgrid (ตาราง)       → rows = หัวข้อ (แถว) · options = ตัวเลือก (คอลัมน์)
import {
  AlignLeft, Calendar, CheckSquare, ChevronDown, CircleDot, Grid2x2Check, Grid3x3, SlidersHorizontal, Star, ThumbsUp,
  ToggleLeft, Type, type LucideIcon,
} from "lucide-react";
import type { SurveyQType, SurveyQuestion } from "@/types/event";

// ฟ้าใส: ข้อมูลของประเภทคำถาม 1 แบบ
export interface QTypeMeta {
  value: SurveyQType;
  th: string;
  en: string; // ฟ้าใส: ชื่อแบบ Google Form
  example: string; // ฟ้าใส: ตัวอย่างการใช้งาน
  exampleEn: string; // ฟ้าใส: ตัวอย่าง (อังกฤษ)
  icon: LucideIcon;
  hasOptions: boolean; // ฟ้าใส: ผู้สร้างแก้ตัวเลือกได้
  hasRows: boolean; // ฟ้าใส: ตาราง (แถว × คอลัมน์)
}

// ฟ้าใส: ประเภทคำถาม Survey ทั้ง 12 แบบ
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

// ฟ้าใส: หาข้อมูลของประเภทคำถาม (ไม่พบ = ข้อความสั้น)
export const qtype = (t: SurveyQType) => QTYPES.find((q) => q.value === t) ?? QTYPES[0];

// ฟ้าใส: ระดับความเห็นตั้งต้น
export const OPINION_LEVELS = ["ไม่เห็นด้วยอย่างยิ่ง", "ไม่เห็นด้วย", "เฉย ๆ", "เห็นด้วย", "เห็นด้วยอย่างยิ่ง"];
// ฟ้าใส: ตัวเลือก ใช่ / ไม่ใช่
export const YES_NO = ["ใช่", "ไม่ใช่"];
// ฟ้าใส: คอลัมน์ตั้งต้นของตาราง
export const GRID_COLUMNS = ["ดีมาก", "ดี", "พอใช้", "ควรปรับปรุง"];
// ฟ้าใส: แถวตั้งต้นของตาราง
export const GRID_ROWS = ["หัวข้อ 1", "หัวข้อ 2"];

// ฟ้าใส: ค่าตั้งต้นภาษาอังกฤษ (ใช้ตอนหน้าตั้งค่าเป็น EN · ผู้ตอบเห็นตามที่ผู้จัดพิมพ์ไว้)
const EN = {
  options: ["Option 1", "Option 2"],
  opinion: ["Strongly disagree", "Disagree", "Neutral", "Agree", "Strongly agree"],
  yesno: ["Yes", "No"],
  columns: ["Excellent", "Good", "Fair", "Needs improvement"],
  rows: ["Topic 1", "Topic 2"],
};

/** ฟ้าใส: ค่าตั้งต้นเมื่อเพิ่มคำถาม / เปลี่ยนประเภท (คงค่าที่ใช้ต่อได้ของคำถามเดิมไว้) */
export function defaultsFor(type: SurveyQType, prev?: SurveyQuestion, lang: "th" | "en" = "th"): Partial<SurveyQuestion> {
  // ฟ้าใส: คำถามเดิมมีตัวเลือกอย่างน้อย 2 ข้อไหม (เปลี่ยนประเภทแล้วใช้ต่อได้)
  const keepOptions = prev && prev.options.length >= 2;
  // ฟ้าใส: ภาษาอังกฤษไหม (ใช้ค่าตั้งต้นภาษาอังกฤษ)
  const en = lang === "en";
  switch (type) {
    // ฟ้าใส: ตัวเลือกเดียว
    case "single":
    // ฟ้าใส: หลายตัวเลือก
    case "multi":
    // ฟ้าใส: Dropdown
    case "dropdown":
      return { options: keepOptions && qtype(prev.type).hasOptions && !qtype(prev.type).hasRows ? prev.options : en ? [...EN.options] : ["ตัวเลือก 1", "ตัวเลือก 2"] };
    // ฟ้าใส: ระดับความเห็น
    case "opinion":
      return { options: en ? [...EN.opinion] : [...OPINION_LEVELS] };
    // ฟ้าใส: ใช่ / ไม่ใช่
    case "yesno":
      return { options: en ? [...EN.yesno] : [...YES_NO] };
    // ฟ้าใส: ตารางเลือกข้อเดียว
    case "mcgrid":
    // ฟ้าใส: ตารางเลือกหลายข้อ
    case "cbgrid":
      return {
        rows: prev?.rows?.length ? prev.rows : en ? [...EN.rows] : [...GRID_ROWS],
        options: prev && qtype(prev.type).hasRows ? prev.options : en ? [...EN.columns] : [...GRID_COLUMNS],
      };
    // ฟ้าใส: สเกลตัวเลข
    case "linear":
      return { options: [], ratingMax: prev?.ratingMax ?? 5, ratingStyle: undefined };
    // ฟ้าใส: ให้ดาว
    case "rating":
      // ฟ้าใส: ratingStyle "star" = เครื่องหมายว่าเป็น Rating ดาวแบบใหม่ (ข้อมูลเก่า rating ที่ไม่มีค่านี้ = สเกลตัวเลข)
      return { options: [], ratingMax: prev?.ratingMax ?? 5, ratingStyle: "star" };
    // ฟ้าใส: ประเภทอื่น ไม่มีตัวเลือก
    default:
      return { options: [], ratingStyle: undefined };
  }
}

/**
 * ข้อมูลเก่า: "rating" ที่ไม่ได้ตั้งเป็นดาว = สเกลตัวเลข → แปลงเป็น "linear" ตอนอ่าน
 * (เรียกซ้ำได้: rating ดาวเก็บ ratingStyle "star" ไว้เสมอ จึงไม่ถูกแปลงซ้ำ)
 */
export function normalizeQuestion(q: SurveyQuestion): SurveyQuestion {
  // ฟ้าใส: rating เก่าที่ไม่ใช่ดาว → สเกลตัวเลข
  if (q.type === "rating" && q.ratingStyle !== "star") return { ...q, type: "linear", ratingStyle: undefined };
  // ฟ้าใส: ประเภทอื่นที่ติด ratingStyle มา → ลบออก
  if (q.type !== "rating" && q.ratingStyle) return { ...q, ratingStyle: undefined };
  return q;
}

// ฟ้าใส: ============ คำตอบ ============
// ฟ้าใส: ตาราง: mcgrid → string[] เรียงตามแถว (ช่องว่าง = ยังไม่ตอบแถวนั้น)
// ฟ้าใส:        cbgrid → string[] ของ "แถว::คอลัมน์" (เลือกได้หลายช่องต่อแถว)
export const gridCell = (row: string, col: string) => `${row}::${col}`;

// ฟ้าใส: ชนิดของคำตอบ 1 ข้อ
type Answer = string | string[] | number | undefined;

/** ฟ้าใส: ตอบข้อนี้ครบแล้วหรือยัง (ตาราง = ตอบครบทุกแถว) */
export function isAnswered(q: { type: SurveyQType; rows?: { th: string }[] | string[] }, v: Answer): boolean {
  // ฟ้าใส: ยังไม่ตอบ
  if (v === undefined) return false;
  // ฟ้าใส: คะแนน = ตอบแล้ว
  if (typeof v === "number") return true;
  // ฟ้าใส: ชื่อแถวของตาราง
  const rows = (q.rows ?? []).map((r) => (typeof r === "string" ? r : r.th));
  // ฟ้าใส: ตารางเลือกข้อเดียว: ต้องตอบครบทุกแถว
  if (q.type === "mcgrid") return Array.isArray(v) && rows.length > 0 && rows.every((_, i) => !!v[i]);
  // ฟ้าใส: ตารางเลือกหลายข้อ: ทุกแถวต้องเลือกอย่างน้อย 1
  if (q.type === "cbgrid") return Array.isArray(v) && rows.every((r) => v.some((c) => c.startsWith(`${r}::`)));
  return Array.isArray(v) ? v.length > 0 : v.trim() !== "";
}
