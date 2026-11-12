// app/admin/events/[id]/report/SurveyView.tsx
// เนื้อหาแท็บ Survey: การ์ดสรุปผล 1 ใบต่อคำถาม เลือกรูปแบบการ์ดตามชนิดคำถาม
// - rating / single / dropdown / multi → แท่งแนวนอน (HBar จาก charts.tsx)
// - short / long / date → ตัวอย่างคำตอบ + ลิงก์ไปแท็บคำตอบรายคน
"use client";
import Link from "next/link";
import { ClipboardList } from "lucide-react";
import { BiText, Lang, Question, SurveyResponse } from "@/types";
import { Card } from "@/components/ui/card";
import { useReport } from "./ReportShell";
import { HBar } from "./charts";
import { RatingLabel } from "./mockData";

// ============ พจนานุกรมข้อความ 2 ภาษา ============
const TEXT = {
  th: {
    qLabel: (n: number, type: string) => `ข้อ ${n} · ${type}`,
    types: { rating: "Rating", single: "ตัวเลือกเดียว", multi: "หลายตัวเลือก", dropdown: "Dropdown", short: "ข้อความสั้น", long: "ข้อความยาว", date: "วันที่" },
    avg: (avg: string) => `เฉลี่ย ${avg} / 5`,
    answers: (n: number) => `${n} คำตอบ`,
    multiPeople: (n: number) => `เลือกได้หลายข้อ · ${n} คน`,
    optional: "(ไม่บังคับ)",
    noAnswers: "ยังไม่มีคำตอบ",
    seeAll: "ดูทั้งหมดในคำตอบรายคน",
    empty: "Survey นี้ยังไม่มีคำถาม",
  },
  en: {
    qLabel: (n: number, type: string) => `Q${n} · ${type}`,
    types: { rating: "Rating", single: "Single choice", multi: "Multiple choice", dropdown: "Dropdown", short: "Short text", long: "Long text", date: "Date" },
    avg: (avg: string) => `avg. ${avg} / 5`,
    answers: (n: number) => `${n} responses`,
    multiPeople: (n: number) => `Multiple answers allowed · ${n} people`,
    optional: "(optional)",
    noAnswers: "No responses yet",
    seeAll: "See all in Responses",
    empty: "This survey has no questions yet",
  },
};
type Text = (typeof TEXT)["th"];

// % แบบปัดเศษ เช่น pct(22, 31) → 71
const pct = (n: number, total: number) => (total > 0 ? Math.round((n / total) * 100) : 0);

// ข้อความตามภาษา (ไม่มี EN → ใช้ TH)
const tr = (text: BiText, lang: Lang) => (lang === "en" && text.en ? text.en : text.th);

// จำนวนตัวอย่างคำตอบที่แสดงในการ์ดข้อความ (ตาม design = 3)
const SAMPLE_COUNT = 3;

// ============ ผลสรุปของคำถาม 1 ข้อ ============
// แบ่งเป็น 2 แบบ ตามชนิดคำถาม
type Summary =
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
function summarize(
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

// ============ ส่วนหลัก ============
export function SurveyView() {
  const { event, data, lang } = useReport();
  const t = TEXT[lang];

  const questions = [...data.survey.questions].sort((a, b) => a.order - b.order);
  const answersHref = `/admin/events/${event.id}/report/answers`;

  if (questions.length === 0) {
    return (
      <Card className="items-center gap-2 rounded-2xl py-12 text-center ring-slate-200">
        <ClipboardList size={32} className="text-slate-400" />
        <p className="text-sm text-slate-500">{t.empty}</p>
      </Card>
    );
  }

  return (
    // 2 คอลัมน์บนจอกว้าง; ข้อความยาวกินเต็มแถว (md:col-span-2) แบบ design ข้อ 7
    <div className="grid gap-4 md:grid-cols-2">
      {questions.map((question) => (
        <QuestionCard
          key={question.id}
          question={question}
          summary={summarize(question, data.responses, lang, data.ratingLabels?.[question.id])}
          hint={data.ratingLabels?.[question.id]?.hint}
          lang={lang}
          t={t}
          answersHref={answersHref}
        />
      ))}
    </div>
  );
}

// ============ การ์ดคำถาม 1 ใบ ============
function QuestionCard({
  question,
  summary,
  hint,
  lang,
  t,
  answersHref,
}: {
  question: Question;
  summary: Summary;
  hint?: BiText;
  lang: Lang;
  t: Text;
  answersHref: string;
}) {
  // ----- บรรทัดสรุปใต้ชื่อคำถาม -----
  // rating:      "เฉลี่ย 4.2 / 5 · 31 คำตอบ" (+ " · 1 = ง่าย, 5 = ยาก" ถ้ามี hint)
  // หลายตัวเลือก: "เลือกได้หลายข้อ · 31 คน"
  // อื่นๆ:        "26 คำตอบ" (+ " (ไม่บังคับ)" ถ้าข้อนั้นไม่บังคับ)
  const parts: string[] = [];
  if (summary.kind === "bars" && summary.avg) parts.push(t.avg(summary.avg));
  parts.push(question.type === "multi" ? t.multiPeople(summary.n) : t.answers(summary.n));
  if (hint) parts.push(tr(hint, lang));
  const subtitle = parts.join(" · ") + (question.required ? "" : ` ${t.optional}`);

  return (
    <Card className={`gap-3 rounded-2xl px-5 ring-slate-200 ${question.type === "long" ? "md:col-span-2" : ""}`}>
      <div>
        <p className="text-xs font-semibold text-blue-600">{t.qLabel(question.order, t.types[question.type])}</p>
        <p className="mt-1 font-semibold">{tr(question.title, lang)}</p>
        <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>
      </div>

      {summary.kind === "bars" ? (
        <BarsBody summary={summary} />
      ) : (
        <TextBody samples={summary.samples} t={t} answersHref={answersHref} />
      )}
    </Card>
  );
}

// ============ เนื้อหาการ์ดแบบแท่ง ============
function BarsBody({ summary }: { summary: Extract<Summary, { kind: "bars" }> }) {
  // แท่งที่มีคนเลือกมากที่สุดยาวเต็ม (ใช้ max เดียวกันทั้งการ์ด)
  const max = Math.max(0, ...summary.rows.map((r) => r.count));
  return (
    <div className="space-y-2">
      {summary.rows.map((row) => (
        <HBar
          key={row.label}
          label={row.label}
          value={row.count}
          max={max}
          // % คิดจาก n = จำนวนคนที่ตอบข้อนี้ เช่น 22 · 71% (22 ÷ 31)
          right={`${row.count} · ${pct(row.count, summary.n)}%`}
        />
      ))}
    </div>
  );
}

// ============ เนื้อหาการ์ดแบบข้อความ ============
function TextBody({ samples, t, answersHref }: { samples: string[]; t: Text; answersHref: string }) {
  if (samples.length === 0) return <p className="text-sm text-slate-400">{t.noAnswers}</p>;
  return (
    <>
      <div className="space-y-2">
        {samples.map((text) => (
          <p key={text} className="rounded-lg bg-slate-50 px-4 py-2.5 text-sm">
            “{text}”
          </p>
        ))}
      </div>
      <Link href={answersHref} className="text-sm text-blue-600 underline underline-offset-2">
        {t.seeAll}
      </Link>
    </>
  );
}
