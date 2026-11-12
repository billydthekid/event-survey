"use client";

import { ChevronDown, Star } from "lucide-react";
import type { SurveyQuestion } from "@/types/event";

/** แสดงตัวอย่างฟอร์ม Survey แบบที่ผู้เข้าร่วมเห็นบนมือถือ */
export function SurveyPreview({
  questions,
  lang,
  primary,
  title,
}: {
  questions: SurveyQuestion[];
  lang: "th" | "en";
  primary: string;
  title: string;
}) {
  const label = (q: SurveyQuestion) => (lang === "en" && q.titleEn ? q.titleEn : q.titleTh) || "(ยังไม่ตั้งชื่อคำถาม)";
  const box = "rounded-lg border bg-muted/30 px-3 py-2 text-xs text-muted-foreground";

  return (
    <div className="mx-auto w-full max-w-sm rounded-[2rem] border bg-background p-5 shadow-lg">
      <p className="mb-4 text-base font-bold">{title}</p>
      <div className="space-y-5">
        {questions.map((q, i) => (
          <div key={q.id} className="space-y-2">
            <p className="text-sm font-medium">
              {i + 1}. {label(q)} {q.required && <span className="text-destructive">*</span>}
            </p>
            {q.type === "short" && <div className={box}>{lang === "th" ? "พิมพ์คำตอบสั้น ๆ" : "Short answer"}</div>}
            {q.type === "long" && <div className={`${box} h-16`}>{lang === "th" ? "พิมพ์คำตอบ" : "Your answer"}</div>}
            {q.type === "date" && <div className={box}>dd / mm / yyyy</div>}
            {q.type === "dropdown" && (
              <div className={`${box} flex items-center justify-between`}>
                {q.options[0] ?? "—"} <ChevronDown className="size-3.5" />
              </div>
            )}
            {(q.type === "single" || q.type === "multi") && (
              <ul className="space-y-1.5">
                {q.options.map((o, k) => (
                  <li key={k} className="flex items-center gap-2 text-xs">
                    <span className={`size-4 border ${q.type === "single" ? "rounded-full" : "rounded"}`} />
                    {o || "—"}
                  </li>
                ))}
              </ul>
            )}
            {q.type === "rating" && (
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star key={n} className="size-6" style={{ color: primary }} />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
      <button type="button" className="mt-6 w-full rounded-lg py-2.5 text-sm font-semibold text-white" style={{ backgroundColor: primary }}>
        {lang === "th" ? "ส่งแบบประเมิน" : "Submit"}
      </button>
    </div>
  );
}
