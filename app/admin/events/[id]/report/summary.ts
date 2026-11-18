// app/admin/events/[id]/report/summary.ts
// ตัวคำนวณสรุปผลคำถาม Survey (ไม่มี React / ไม่มี UI)
// ใช้ร่วมกันระหว่าง: แท็บ Survey (SurveyView), Overview, Dashboard, Export CSV และหน้า print
// → ทุกที่นับเลขด้วยโค้ดชุดเดียวกัน ตัวเลขบนจอกับในไฟล์จึงตรงกันเสมอ
import { BiText, Lang, SurveyResponse } from "@/types";
import { RatingLabel } from "./mockData";
import type { ReportQuestion } from "./reportData";

// % แบบปัดเศษ เช่น pct(22, 31) → 71
export const pct = (n: number, total: number) => (total > 0 ? Math.round((n / total) * 100) : 0);

// ข้อความตามภาษา (ไม่มี EN → ใช้ TH)
export const tr = (text: BiText, lang: Lang) => (lang === "en" && text.en ? text.en : text.th);

// จำนวนตัวอย่างคำตอบที่แสดงในการ์ดข้อความ (ตาม design = 3)
export const SAMPLE_COUNT = 3;

// ตัวคั่น "แถว::คอลัมน์" ของคำตอบตาราง cbgrid (ตรงกับ gridCell ใน lib/survey-types.ts)
const GRID_SEP = "::";

// ============ ผลสรุปของคำถาม 1 ข้อ ============
// แบ่งเป็น 3 แบบ ตามชนิดคำถาม
export type Summary =
  | {
      kind: "bars";              // การ์ดแบบแท่ง
      rows: { label: string; count: number }[];
      n: number;                 // ตัวหารของ %: จำนวนคนที่ตอบข้อนี้
      avg: string | null;        // ค่าเฉลี่ย (เฉพาะ rating / linear)
      scaleMax: number | null;   // คะแนนเต็ม (rating / linear = 5 หรือ 10, ตัวเลือก = null)
    }
  | {
      kind: "text";              // การ์ดแบบข้อความ
      samples: string[];         // ตัวอย่างคำตอบ (ไม่ซ้ำกัน)
      n: number;
    }
  | {
      kind: "grid";              // การ์ดแบบตาราง (mcgrid / cbgrid)
      n: number;                 // จำนวนคนที่ตอบข้อนี้
      multiple: boolean;         // cbgrid = เลือกได้หลายช่องต่อแถว
      columns: string[];         // หัวคอลัมน์ (ตามภาษา)
      // ต่อแถว: จำนวนคนที่เลือกแต่ละคอลัมน์ (ยาวเท่า columns) + จำนวนคนที่ตอบแถวนี้ (ตัวหาร %)
      rows: { label: string; counts: number[]; answered: number }[];
    };

// คะแนนเต็มของคำถามแบบสเกล — ไม่มี ratingMax (เช่น ข้อมูลตัวอย่าง) → 5
// ตัวอย่าง: { type: "linear", ratingMax: 10 } → 10 | { type: "rating" } → 5
export const scaleMaxOf = (q: ReportQuestion) => q.ratingMax ?? 5;

// คำถามที่ใช้ในการ์ด "ความพึงพอใจ": rating ข้อแรกตามลำดับ ถ้าไม่มีใช้ linear ข้อแรก
// (Wizard แปลง rating ตัวเลขแบบเก่าเป็น linear → งานจาก Wizard อาจมีแต่ linear)
// ไม่มีทั้งสองแบบ → undefined (หน้าจอไม่แสดงการ์ด)
export function satisfactionQuestion(questions: ReportQuestion[]): ReportQuestion | undefined {
  const sorted = [...questions].sort((a, b) => a.order - b.order);
  return sorted.find((q) => q.type === "rating") ?? sorted.find((q) => q.type === "linear");
}

// answersOf: คำตอบของข้อนี้ ตัดคนที่ข้าม (undefined) และ array ว่างออก
// → ความยาวที่ได้ = "จำนวนคนที่ตอบข้อนี้" (1 คน = 1 ช่อง แม้เลือกหลายตัวเลือก)
// ใช้ทั้งใน summarize และ exportCsv (ข้อข้อความต้องการคำตอบทั้งหมด ไม่ใช่แค่ตัวอย่าง 3 ข้อ)
export function answersOf(question: ReportQuestion, responses: SurveyResponse[]) {
  return responses
    .map((r) => r.answers[question.id])
    .filter((a) => a !== undefined && !(Array.isArray(a) && a.length === 0));
}

// ============ สรุปตาราง (mcgrid / cbgrid) ============
// รูปแบบคำตอบที่หน้า /s เก็บ:
//   mcgrid → string[] เรียงตามแถว ช่องที่ i = คอลัมน์ที่เลือกในแถว i ("" = ยังไม่ตอบแถวนั้น)
//            เช่น แถว [หัวข้อ 1, หัวข้อ 2] ตอบ ["ดี", "พอใช้"]
//   cbgrid → string[] ของ "แถว::คอลัมน์" เช่น ["หัวข้อ 1::ดี", "หัวข้อ 1::พอใช้"]
// ค่าที่ไม่รู้จัก (คอลัมน์/แถวที่ไม่มีในคำถาม, ช่องว่าง, ไม่ใช่ array) → ข้าม ไม่ crash
// ตัวอย่าง: แถว [A, B] คอลัมน์ [ดี, พอใช้] คำตอบ mcgrid 2 คน ["ดี","ดี"], ["พอใช้",""]
//   → n = 2, A: counts [1, 1] answered 2 | B: counts [1, 0] answered 1
function summarizeGrid(question: ReportQuestion, answers: unknown[], lang: Lang): Summary {
  const rows = question.rows ?? [];
  const cols = question.options ?? [];
  const multiple = question.type === "cbgrid";
  const colIndex = (th: string) => cols.findIndex((c) => c.th === th);

  const counts = rows.map(() => cols.map(() => 0));
  const answeredRows = rows.map(() => 0);
  let n = 0;

  for (const value of answers) {
    if (!Array.isArray(value)) continue; // รูปแบบผิด → ข้ามทั้งคำตอบ
    let any = false;

    if (multiple) {
      // ต่อแถว: นับคนที่ตอบแถวนี้ 1 ครั้ง แม้เลือกหลายช่อง
      const touched = new Set<number>();
      for (const cell of value) {
        if (typeof cell !== "string") continue;
        const sep = cell.indexOf(GRID_SEP);
        if (sep < 0) continue;
        const r = rows.findIndex((row) => row.th === cell.slice(0, sep));
        const c = colIndex(cell.slice(sep + GRID_SEP.length));
        if (r < 0 || c < 0) continue; // แถว/คอลัมน์ที่ไม่รู้จัก → ข้ามค่านี้
        counts[r][c]++;
        touched.add(r);
      }
      touched.forEach((r) => answeredRows[r]++);
      any = touched.size > 0;
    } else {
      // mcgrid: ตำแหน่งใน array = แถว · ยาวกว่าจำนวนแถวก็ตัดส่วนเกินทิ้ง
      rows.forEach((_, r) => {
        const picked = value[r];
        if (typeof picked !== "string" || picked === "") return; // แถวนี้ไม่ได้ตอบ
        const c = colIndex(picked);
        if (c < 0) return; // คอลัมน์ที่ไม่รู้จัก → ข้าม
        counts[r][c]++;
        answeredRows[r]++;
        any = true;
      });
    }
    if (any) n++;
  }

  return {
    kind: "grid",
    n,
    multiple,
    columns: cols.map((c) => tr(c, lang)),
    rows: rows.map((row, r) => ({ label: tr(row, lang), counts: counts[r], answered: answeredRows[r] })),
  };
}

// summarize: รับคำถาม + คำตอบทั้งหมด → คืนผลสรุปของข้อนั้น
export function summarize(
  question: ReportQuestion,
  responses: SurveyResponse[],
  lang: Lang,
  scale?: RatingLabel
): Summary {
  const answers = answersOf(question, responses);

  switch (question.type) {
    case "rating":
    case "linear": {
      // แถวคะแนน max → 1 (5→1 หรือ 10→1) ปลายสเกลต่อคำกำกับถ้ามี เช่น "5 ดีมาก", "1 ควรปรับปรุง"
      const max = scaleMaxOf(question);
      // นับเฉพาะคะแนนที่อยู่ในช่วง 1..max (ค่าแปลกๆ ไม่ทำให้ค่าเฉลี่ยเพี้ยน)
      const scores = answers.map(Number).filter((s) => Number.isInteger(s) && s >= 1 && s <= max);
      const n = scores.length;
      const rows = Array.from({ length: max }, (_, i) => max - i).map((score) => {
        let label = String(score);
        if (scale && score === max) label += ` ${tr(scale.max, lang)}`;
        if (scale && score === 1) label += ` ${tr(scale.min, lang)}`;
        return { label, count: scores.filter((s) => s === score).length };
      });
      // ค่าเฉลี่ย เช่น (5×14 + 4×11 + 3×4 + 2×2 + 1×0) ÷ 31 = 130 ÷ 31 ≈ 4.2
      const avg = n > 0 ? (scores.reduce((s, a) => s + a, 0) / n).toFixed(1) : null;
      return { kind: "bars", rows, n, avg, scaleMax: max };
    }

    case "single":
    case "dropdown":
    case "opinion":
    case "yesno":
    case "multi": {
      // คำตอบเก็บเป็นข้อความไทยของตัวเลือก
      // - ตัวเลือกเดียว / dropdown / ระดับความเห็น / ใช่-ไม่ใช่ = string เช่น "พอดี", "ใช่"
      // - หลายตัวเลือก = string[] เช่น ["Auto layout", "Prototype"]
      // นับ "จำนวนคนที่เลือกตัวเลือกนี้" → คนละ 1 ต่อตัวเลือก
      const rows = (question.options ?? []).map((opt) => ({
        label: tr(opt, lang),
        count: answers.filter((a) => (Array.isArray(a) ? a.includes(opt.th) : a === opt.th)).length,
      }));
      return { kind: "bars", rows, n: answers.length, avg: null, scaleMax: null };
    }

    case "mcgrid":
    case "cbgrid":
      return summarizeGrid(question, answers, lang);

    default: {
      // short / long / date → ตัวอย่างคำตอบที่ไม่ซ้ำกัน SAMPLE_COUNT ข้อแรก
      const samples = [...new Set(answers.map(String))].slice(0, SAMPLE_COUNT);
      return { kind: "text", samples, n: answers.length };
    }
  }
}
