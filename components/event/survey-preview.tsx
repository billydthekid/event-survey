"use client";

import { ChevronDown, Star } from "lucide-react";
import type { SurveyQuestion } from "@/types/event";

/** คะแนนเต็ม / รูปแบบของคำถาม rating (ไม่ได้ตั้ง = 1–5 แบบตัวเลข เหมือนหน้า /s จริง) */
export const ratingOf = (q: SurveyQuestion) => ({ max: q.ratingMax ?? 5, style: q.ratingStyle ?? "number" });

/** ตัวอย่างช่องให้คะแนน — ใช้ทั้งใน Preview มือถือ และการ์ดคำถามใน Survey Builder (หน้าตาเดียวกับหน้า /s) */
export function RatingSample({ q, primary, size = "md" }: { q: SurveyQuestion; primary: string; size?: "sm" | "md" }) {
  const { max, style } = ratingOf(q);
  const nums = Array.from({ length: max }, (_, i) => i + 1);
  if (style === "star") {
    return (
      <div className="flex flex-wrap gap-1">
        {nums.map((n) => (
          <Star key={n} className={size === "sm" ? "size-5" : "size-7"} style={{ color: primary }} />
        ))}
      </div>
    );
  }
  return (
    <div className="grid max-w-md grid-cols-5 gap-1.5">
      {nums.map((n) => (
        <span
          key={n}
          className={`flex items-center justify-center rounded-lg border font-semibold ${size === "sm" ? "h-8 text-xs" : "h-10 text-sm"}`}
        >
          {n}
        </span>
      ))}
    </div>
  );
}

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
            {q.type === "rating" && <RatingSample q={q} primary={primary} size="sm" />}
          </div>
        ))}
      </div>
      <button type="button" className="mt-6 w-full rounded-lg py-2.5 text-sm font-semibold text-white" style={{ backgroundColor: primary }}>
        {lang === "th" ? "ส่งแบบประเมิน" : "Submit"}
      </button>
    </div>
  );
}
