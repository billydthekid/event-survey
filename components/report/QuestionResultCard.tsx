// components/report/QuestionResultCard.tsx
// การ์ดผลคำถาม 1 ข้อ (Report ④ แท็บ Overview / Survey)
// rating → คะแนนเฉลี่ย + แถบ 5 → 1 · ตัวเลือก → แถบต่อตัวเลือก · ข้อความ / วันที่ → รายการคำตอบ
"use client";
import { useState } from "react";
import { Lang, Question } from "@/types";
import { percent, QTYPE_LABEL, QuestionSummary, textOf } from "@/lib/utils/surveyStats";

interface QuestionResultCardProps {
  no: number;               // ลำดับข้อ (เริ่ม 1)
  question: Question;
  summary: QuestionSummary; // จาก summarizeQuestion()
  lang: Lang;
  footer?: React.ReactNode; // เช่น ลิงก์ "ดูสรุปทุกข้อในแท็บ Survey"
}

// แถบ 1 แถว: ป้าย | แถบ | จำนวน · %
function BarRow({ label, count, total, max }: { label: string; count: number; total: number; max: number }) {
  return (
    <li className="grid grid-cols-[minmax(0,140px)_1fr_72px] items-center gap-4 text-sm">
      <span className="truncate">{label}</span>
      <span className="h-3 rounded-full bg-slate-100">
        <span className="block h-3 rounded-full bg-blue-600" style={{ width: `${max === 0 ? 0 : (count / max) * 100}%` }} />
      </span>
      <span className="text-right text-slate-500">{count} · {percent(count, total)}%</span>
    </li>
  );
}

const TEXT_PREVIEW = 5;   // ข้อความ: โชว์ก่อนกี่คำตอบ

export function QuestionResultCard({ no, question, summary, lang, footer }: QuestionResultCardProps) {
  const [showAll, setShowAll] = useState(false);

  return (
    <div className="flex h-full flex-col rounded-xl bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold text-blue-600">
        ข้อ {no} · {QTYPE_LABEL[question.type]}
        {!question.required && <span className="font-normal text-slate-400"> · ไม่บังคับ</span>}
      </p>
      <h3 className="mt-1 text-lg font-bold">{textOf(question.title, lang)}</h3>

      <div className="mt-4 flex-1">
        {summary.answered === 0 && <p className="text-sm text-slate-400">ยังไม่มีคำตอบ</p>}

        {/* ---------- Rating ---------- */}
        {summary.kind === "rating" && summary.answered > 0 && (
          <>
            <p>
              <span className="text-4xl font-bold">{summary.average}</span>
              <span className="ml-2 text-sm text-slate-500">/ 5 จาก {summary.answered} คำตอบ</span>
            </p>
            <ul className="mt-4 space-y-3">
              {summary.levels.map((l) => (
                <BarRow
                  key={l.score} label={String(l.score)} count={l.count} total={summary.answered}
                  max={Math.max(...summary.levels.map((x) => x.count))}
                />
              ))}
            </ul>
          </>
        )}

        {/* ---------- ตัวเลือก ---------- */}
        {summary.kind === "choice" && summary.answered > 0 && (
          <>
            {question.type === "multi" && (
              <p className="mb-3 text-xs text-slate-500">เลือกได้หลายข้อ · % เทียบกับ {summary.answered} คนที่ตอบ</p>
            )}
            <ul className="space-y-3">
              {summary.options.map((o) => (
                <BarRow
                  key={o.label.th} label={textOf(o.label, lang)} count={o.count} total={summary.answered}
                  max={Math.max(...summary.options.map((x) => x.count))}
                />
              ))}
            </ul>
          </>
        )}

        {/* ---------- ข้อความ / วันที่ ---------- */}
        {summary.kind === "text" && summary.answered > 0 && (
          <>
            <p className="mb-3 text-xs text-slate-500">ตอบ {summary.answered} คน</p>
            <ul className="space-y-2">
              {(showAll ? summary.answers : summary.answers.slice(0, TEXT_PREVIEW)).map((a, i) => (
                <li key={i} className="rounded-lg bg-slate-50 px-3 py-2 text-sm">{a}</li>
              ))}
            </ul>
            {summary.answers.length > TEXT_PREVIEW && (
              <button onClick={() => setShowAll(!showAll)} className="mt-3 text-sm text-blue-600 hover:underline">
                {showAll ? "ย่อ" : `ดูทั้งหมด ${summary.answers.length} คำตอบ`}
              </button>
            )}
          </>
        )}
      </div>

      {footer && <div className="mt-4">{footer}</div>}
    </div>
  );
}
