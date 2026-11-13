// lib/utils/surveyStats.ts
// ตัวคิดตัวเลขของหน้า Survey (สรุป) และ Report เจาะ Event (ส่วน ④)
// รับข้อมูลเป็นพารามิเตอร์ ไม่อ่าน store เอง (แบบเดียวกับ stats.ts) · หน้าเว็บกรอง eventId มาแล้ว
import { BiText, Lang, Question, QuestionType, Registration, SurveyResponse } from "@/types";

// ---------- ชื่อประเภทคำถาม (ชุดเดียวกับ Survey Builder ของพิชชาภา) ----------
export const QTYPE_LABEL: Record<QuestionType, string> = {
  short: "ข้อความสั้น",
  long: "ข้อความยาว",
  single: "ตัวเลือกเดียว",
  multi: "หลายตัวเลือก",
  dropdown: "Dropdown",
  rating: "Rating 1–5",
  date: "วันที่",
};

// ข้อความตามภาษา — ไม่มีภาษาอังกฤษ → ใช้ไทย
export function textOf(t: BiText, lang: Lang): string {
  return (lang === "en" && t.en) || t.th;
}

// % ปัดเป็นจำนวนเต็ม (แบบ Figma: 14 จาก 31 → 45) · ตัวหาร 0 → 0
export function percent(part: number, whole: number): number {
  return whole === 0 ? 0 : Math.round((part / whole) * 100);
}

// ============ สรุปคำตอบ 1 ข้อ ============
// rating: นับคะแนน 5 → 1 + เฉลี่ย · choice (single / dropdown / multi): นับต่อตัวเลือก · text (short / long / date): รายการคำตอบ
// answered = จำนวนคนที่ตอบข้อนี้ (ใช้เป็นตัวหาร %)
export type QuestionSummary =
  | { kind: "rating"; answered: number; average: number; levels: { score: number; count: number }[] }
  | { kind: "choice"; answered: number; options: { label: BiText; count: number }[] }
  | { kind: "text"; answered: number; answers: string[] };

export function summarizeQuestion(question: Question, responses: SurveyResponse[]): QuestionSummary {
  // คำตอบของข้อนี้ (ตัดคนที่ข้าม)
  const values = responses
    .map((r) => r.answers[question.id])
    .filter((v) => v !== undefined && v !== "" && !(Array.isArray(v) && v.length === 0));

  if (question.type === "rating") {
    const scores = values.map(Number);
    const levels = [5, 4, 3, 2, 1].map((score) => ({ score, count: scores.filter((s) => s === score).length }));
    const sum = scores.reduce((a, b) => a + b, 0);
    return {
      kind: "rating",
      answered: scores.length,
      average: scores.length === 0 ? 0 : Math.round((sum / scores.length) * 10) / 10,
      levels,
    };
  }

  if (question.type === "single" || question.type === "dropdown" || question.type === "multi") {
    // คำตอบเก็บเป็นข้อความภาษาไทยของตัวเลือก (multi = array)
    const picked = values.flatMap((v) => (Array.isArray(v) ? v : [String(v)]));
    const options = (question.options ?? []).map((o) => ({
      label: o,
      count: picked.filter((p) => p === o.th || p === o.en).length,
    }));
    return { kind: "choice", answered: values.length, options };
  }

  return { kind: "text", answered: values.length, answers: values.map(String) };
}

// สรุปสั้น 1 บรรทัด (ขวามือในรายการคำถามหน้า Survey)
// เช่น "เฉลี่ย 4.2 / 5" · "Facebook คณะ 42%" · "ตอบ 24 คน" · ยังไม่มีคำตอบ → "ยังไม่มีคำตอบ"
export function shortSummary(summary: QuestionSummary, lang: Lang): string {
  if (summary.answered === 0) return "ยังไม่มีคำตอบ";
  if (summary.kind === "rating") return `เฉลี่ย ${summary.average} / 5`;
  if (summary.kind === "choice") {
    const top = [...summary.options].sort((a, b) => b.count - a.count)[0];
    return top ? `${textOf(top.label, lang)} ${percent(top.count, summary.answered)}%` : "-";
  }
  return `ตอบ ${summary.answered} คน`;
}

// ============ ผู้ลงทะเบียน: เพศ ============
export const GENDER_LABEL: Record<string, string> = { male: "ชาย", female: "หญิง", unspecified: "ไม่ระบุ" };
const GENDER_KEYS = ["male", "female", "unspecified"] as const;

// นับ ชาย / หญิง / ไม่ระบุ — ค่าอื่น (เช่น "other" หรือว่าง) นับเป็นไม่ระบุ
export function genderSummary(registrations: Registration[]) {
  const counts: Record<string, number> = { male: 0, female: 0, unspecified: 0 };
  registrations.forEach((r) => {
    const g = String(r.answers.gender ?? "");
    counts[g === "male" || g === "female" ? g : "unspecified"]++;
  });
  return GENDER_KEYS.map((key) => ({ key, label: GENDER_LABEL[key], count: counts[key] }));
}

// ============ ผู้ลงทะเบียน: กลุ่มอายุ ============
const AGE_GROUPS = [
  { label: "ไม่เกิน 18", min: 0, max: 18 },
  { label: "19 – 22", min: 19, max: 22 },
  { label: "23 – 30", min: 23, max: 30 },
  { label: "31 ขึ้นไป", min: 31, max: Infinity },
];

// นับต่อกลุ่ม + เฉลี่ย / ต่ำสุด / สูงสุด (คนที่ไม่กรอกอายุไม่นับ)
export function ageSummary(registrations: Registration[]) {
  const ages = registrations.map((r) => Number(r.answers.age)).filter((a) => Number.isFinite(a) && a > 0);
  const groups = AGE_GROUPS.map((g) => ({ label: g.label, count: ages.filter((a) => a >= g.min && a <= g.max).length }));
  return {
    groups,
    average: ages.length === 0 ? 0 : Math.round((ages.reduce((a, b) => a + b, 0) / ages.length) * 10) / 10,
    min: ages.length === 0 ? 0 : Math.min(...ages),
    max: ages.length === 0 ? 0 : Math.max(...ages),
  };
}

// ============ เบอร์โทร: ปิดบางส่วน ============
// "0812344521" → "08X-XXX-4521" (กติกาเดียวกับหน้า Report ของธณัฐจักร)
export function maskPhone(phone: unknown): string {
  if (typeof phone !== "string") return "—";
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 0) return "—";
  if (digits.length < 6) return "XXX-XXX-XXXX";
  return `${digits.slice(0, 2)}X-XXX-${digits.slice(-4)}`;
}

// ============ คำตอบ ↔ ผู้ลงทะเบียน ============
// ข้อมูลตัวอย่างมี registrationId ในคำตอบ (types/ ยังไม่มีช่องนี้) · คำตอบที่กรอกจากหน้า /s ยังไม่มี → undefined
export function registrationIdOf(response: SurveyResponse): string | undefined {
  const id = (response as SurveyResponse & { registrationId?: unknown }).registrationId;
  return typeof id === "string" ? id : undefined;
}

// คำตอบ 1 ข้อ → ข้อความ (array ต่อด้วย ", ") · ไม่ตอบ → "—"
export function answerText(value: string | string[] | number | undefined): string {
  if (value === undefined || value === "") return "—";
  return Array.isArray(value) ? (value.length ? value.join(", ") : "—") : String(value);
}
