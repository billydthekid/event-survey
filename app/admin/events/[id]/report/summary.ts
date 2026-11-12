// app/admin/events/[id]/report/summary.ts
// ตัวคำนวณสรุปผลคำถาม Survey (ไม่มี React / ไม่มี UI)
// ใช้ร่วมกันระหว่าง: แท็บ Survey (SurveyView), Export CSV และหน้า print
// → ทุกที่นับเลขด้วยโค้ดชุดเดียวกัน ตัวเลขบนจอกับในไฟล์จึงตรงกันเสมอ
import { BiText, Lang, Question, SurveyResponse } from "@/types";
import { RatingLabel } from "./mockData";

// % แบบปัดเศษ เช่น pct(22, 31) → 71
export const pct = (n: number, total: number) => (total > 0 ? Math.round((n / total) * 100) : 0);

// ข้อความตามภาษา (ไม่มี EN → ใช้ TH)
export const tr = (text: BiText, lang: Lang) => (lang === "en" && text.en ? text.en : text.th);

// จำนวนตัวอย่างคำตอบที่แสดงในการ์ดข้อความ (ตาม design = 3)
export const SAMPLE_COUNT = 3;

// ============ ผลสรุปของคำถาม 1 ข้อ ============
// แบ่งเป็น 2 แบบ ตามชนิดคำถาม
export type Summary =
  | {
      kind: "bars";              // การ์ดแบบแท่ง
      rows: { label: string; count: number }[];
      n: number;                 // ตัวหารของ %: จำนวนคนที่ตอบข้อนี้
      avg: string | null;        // ค่าเฉลี่ย (เฉพาะ rating)
    }
  | {
      kind: "text";              // การ์ดแบบข้อความ
      samples: string[];         // ตัวอย่างคำตอบ (ไม่ซ้ำกัน)
      n: number;
    };

// summarize: รับคำถาม + คำตอบทั้งหมด → คืนผลสรุปของข้อนั้น
export function summarize(
  question: Question,
  responses: SurveyResponse[],
  lang: Lang,
  scale?: RatingLabel
): Summary {
  // คำตอบของข้อนี้ ตัดคนที่ข้าม (undefined) และ array ว่างออก
  // → answers.length = "จำนวนคนที่ตอบข้อนี้" (1 คน = 1 ช่อง แม้เลือกหลายตัวเลือก)
  const answers = responses
    .map((r) => r.answers[question.id])
    .filter((a) => a !== undefined && !(Array.isArray(a) && a.length === 0));
  const n = answers.length;

  switch (question.type) {
    case "rating": {
      // แถวคะแนน 5 → 1 ปลายสเกลต่อคำกำกับถ้ามี เช่น "5 ดีมาก"
      const rows = [5, 4, 3, 2, 1].map((score) => {
        let label = String(score);
        if (scale && score === 5) label += ` ${tr(scale.max, lang)}`;
        if (scale && score === 1) label += ` ${tr(scale.min, lang)}`;
        return { label, count: answers.filter((a) => Number(a) === score).length };
      });
      // ค่าเฉลี่ย เช่น (5×14 + 4×11 + 3×4 + 2×2 + 1×0) ÷ 31 = 130 ÷ 31 ≈ 4.2
      const avg = n > 0 ? (answers.reduce<number>((s, a) => s + Number(a), 0) / n).toFixed(1) : null;
      return { kind: "bars", rows, n, avg };
    }

    case "single":
    case "dropdown":
    case "multi": {
      // คำตอบเก็บเป็นข้อความไทยของตัวเลือก
      // - ตัวเลือกเดียว / dropdown = string เช่น "พอดี"
      // - หลายตัวเลือก = string[] เช่น ["Auto layout", "Prototype"]
      // นับ "จำนวนคนที่เลือกตัวเลือกนี้" → คนละ 1 ต่อตัวเลือก
      const rows = (question.options ?? []).map((opt) => ({
        label: tr(opt, lang),
        count: answers.filter((a) => (Array.isArray(a) ? a.includes(opt.th) : a === opt.th)).length,
      }));
      return { kind: "bars", rows, n, avg: null };
    }

    default: {
      // short / long / date → ตัวอย่างคำตอบที่ไม่ซ้ำกัน SAMPLE_COUNT ข้อแรก
      const samples = [...new Set(answers.map(String))].slice(0, SAMPLE_COUNT);
      return { kind: "text", samples, n };
    }
  }
}
