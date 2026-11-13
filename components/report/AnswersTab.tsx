// components/report/AnswersTab.tsx
// แท็บ "คำตอบรายคน" (Report ④) — ซ้าย: รายชื่อคนที่ตอบ · ขวา: คำตอบทุกข้อของคนที่เลือก
"use client";
import { useState } from "react";
import { Lang, Question, Registration, SurveyResponse } from "@/types";
import { formatShortDateTime } from "@/lib/utils/date";
import { answerText, registrationIdOf, textOf } from "@/lib/utils/surveyStats";

interface AnswersTabProps {
  questions: Question[];   // เรียงตามลำดับแล้ว
  registrations: Registration[];
  responses: SurveyResponse[];
  lang: Lang;
}

export function AnswersTab({ questions, registrations, responses, lang }: AnswersTabProps) {
  // เรียงคำตอบใหม่ → เก่า · ค่าเริ่มต้นเลือกคนแรก
  const list = [...responses].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = list.find((r) => r.id === selectedId) ?? list[0];

  // ชื่อผู้ตอบ: หาจาก registrationId · คำตอบที่ไม่รู้ว่าใคร → "ไม่ระบุชื่อ"
  const nameOf = (r: SurveyResponse) => {
    const reg = registrations.find((x) => x.id === registrationIdOf(r));
    return reg ? String(reg.answers.name ?? "ไม่ระบุชื่อ") : "ไม่ระบุชื่อ";
  };

  // คำตอบที่เป็นตัวเลือก (เก็บเป็นข้อความไทย) → แสดงตามภาษาที่เลือก · อื่นๆ ใช้ answerText
  const display = (q: Question, value: SurveyResponse["answers"][string] | undefined) => {
    const label = (v: string) => {
      const o = q.options?.find((x) => x.th === v || x.en === v);
      return o ? textOf(o, lang) : v;
    };
    if (q.options && Array.isArray(value)) return value.length ? value.map(label).join(", ") : "—";
    if (q.options && typeof value === "string" && value !== "") return label(value);
    return answerText(value);
  };

  if (list.length === 0) {
    return <div className="rounded-xl bg-white p-10 text-center text-sm text-slate-400 shadow-sm">ยังไม่มีคำตอบ</div>;
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
      {/* ---------- รายชื่อคนที่ตอบ ---------- */}
      <div className="rounded-xl bg-white p-3 shadow-sm">
        <p className="px-2 py-2 text-sm font-semibold">ผู้ตอบ {list.length} คน</p>
        <ul className="max-h-[560px] overflow-y-auto">
          {list.map((r) => (
            <li key={r.id}>
              <button
                onClick={() => setSelectedId(r.id)}
                className={`w-full rounded-lg px-3 py-2 text-left text-sm ${
                  r.id === selected.id ? "bg-blue-50 text-blue-700" : "hover:bg-slate-50"
                }`}
              >
                <span className="block font-medium">{nameOf(r)}</span>
                <span className="text-xs text-slate-500">{formatShortDateTime(r.createdAt)}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* ---------- คำตอบของคนที่เลือก ---------- */}
      <div className="rounded-xl bg-white p-5 shadow-sm">
        <h2 className="text-lg font-bold">{nameOf(selected)}</h2>
        <p className="text-sm text-slate-500">ตอบเมื่อ {formatShortDateTime(selected.createdAt)}</p>
        <ol className="mt-4 space-y-4">
          {questions.map((q, i) => (
            <li key={q.id} className="border-t border-slate-100 pt-4">
              <p className="text-xs text-slate-500">ข้อ {i + 1}</p>
              <p className="font-medium">{textOf(q.title, lang)}</p>
              <p className="mt-1 text-sm text-slate-700">
                {display(q, selected.answers[q.id])}
                {q.type === "rating" && selected.answers[q.id] !== undefined && " / 5"}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
