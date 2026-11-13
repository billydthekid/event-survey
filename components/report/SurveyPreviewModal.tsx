// components/report/SurveyPreviewModal.tsx
// popup "Preview มือถือ" (หน้า Survey ④) — จำลองหน้าจอมือถือที่ผู้เข้าร่วมเห็น แสดงอย่างเดียว กรอกไม่ได้
"use client";
import { useState } from "react";
import { ChevronDown, Star, X } from "lucide-react";
import { Lang, Survey } from "@/types";
import { textOf } from "@/lib/utils/surveyStats";

interface SurveyPreviewModalProps {
  survey: Survey;
  primary: string;   // สีหลักของ Theme Event
  onClose: () => void;
}

export function SurveyPreviewModal({ survey, primary, onClose }: SurveyPreviewModalProps) {
  const [lang, setLang] = useState<Lang>("th");
  const questions = [...survey.questions].sort((a, b) => a.order - b.order);
  const box = "rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-400";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40" onClick={onClose}>
      <div className="flex max-h-[92vh] flex-col items-center gap-3" onClick={(e) => e.stopPropagation()}>
        {/* ---------- แถบบน: ภาษา + ปิด ---------- */}
        <div className="flex w-[360px] items-center justify-between">
          <div className="flex rounded-lg bg-white p-1 text-xs shadow-sm">
            {(["th", "en"] as Lang[]).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={`rounded-md px-3 py-1 ${lang === l ? "bg-blue-600 text-white" : "text-slate-500"}`}
              >
                {l.toUpperCase()}
              </button>
            ))}
          </div>
          <button onClick={onClose} className="rounded-lg bg-white p-2 shadow-sm hover:bg-slate-50" title="ปิด">
            <X size={16} />
          </button>
        </div>

        {/* ---------- กรอบมือถือ ---------- */}
        <div className="w-[360px] overflow-y-auto rounded-[2.5rem] border-8 border-slate-800 bg-white">
          <div className="px-5 py-4 text-white" style={{ background: primary }}>
            <p className="text-xs opacity-80">{lang === "th" ? "แบบประเมิน" : "Survey"}</p>
            <p className="text-lg font-bold">{textOf(survey.title, lang)}</p>
          </div>

          <div className="space-y-5 p-5">
            {questions.map((q, i) => (
              <div key={q.id}>
                <p className="text-sm font-medium">
                  {i + 1}. {textOf(q.title, lang)} {q.required && <span className="text-red-500">*</span>}
                </p>
                <div className="mt-2">
                  {q.type === "rating" && (
                    <div className="flex gap-1 text-slate-300">
                      {[1, 2, 3, 4, 5].map((n) => <Star key={n} size={24} />)}
                    </div>
                  )}
                  {(q.type === "single" || q.type === "multi") && (
                    <ul className="space-y-1.5">
                      {(q.options ?? []).map((o) => (
                        <li key={o.th} className="flex items-center gap-2 text-sm">
                          <span className={`h-4 w-4 border border-slate-300 ${q.type === "single" ? "rounded-full" : "rounded"}`} />
                          {textOf(o, lang)}
                        </li>
                      ))}
                    </ul>
                  )}
                  {q.type === "dropdown" && (
                    <div className={`${box} flex items-center justify-between`}>
                      {lang === "th" ? "เลือก…" : "Select…"} <ChevronDown size={14} />
                    </div>
                  )}
                  {q.type === "short" && <div className={box}>{lang === "th" ? "พิมพ์คำตอบสั้น ๆ" : "Short answer"}</div>}
                  {q.type === "long" && <div className={`${box} h-16`}>{lang === "th" ? "พิมพ์คำตอบ" : "Your answer"}</div>}
                  {q.type === "date" && <div className={box}>{lang === "th" ? "วว/ดด/ปปปป" : "dd/mm/yyyy"}</div>}
                </div>
              </div>
            ))}

            <div className="rounded-lg py-2.5 text-center text-sm font-semibold text-white" style={{ background: primary }}>
              {lang === "th" ? "ส่งแบบประเมิน" : "Submit survey"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
