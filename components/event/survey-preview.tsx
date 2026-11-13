"use client";
// ตัวอย่างคำถาม Survey 12 ประเภท แบบที่ผู้เข้าร่วมเห็นบนหน้า /s
// - AnswerSample: ช่องตอบตัวอย่างของคำถาม 1 ข้อ (ใช้ทั้งในการ์ดของ Survey Builder และใน Preview)
// - SurveyPreview: ทั้งแบบประเมิน (Dialog "Preview มือถือ" และ Preview เต็มจอขั้นที่ 6)

import { Calendar, ChevronDown, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { normalizeQuestion } from "@/lib/survey-types";
import type { SurveyQuestion } from "@/types/event";

const box = "rounded-lg border bg-muted/30 px-3 py-2.5 text-sm text-muted-foreground";

/** คะแนนเต็มของ linear / rating (ไม่ได้ตั้ง = 5) */
export const ratingOf = (q: SurveyQuestion) => ({ max: q.ratingMax ?? 5 });

export function AnswerSample({ q: raw, primary, size = "md" }: { q: SurveyQuestion; primary: string; size?: "sm" | "md" }) {
  const q = normalizeQuestion(raw);
  const sm = size === "sm";
  const nums = Array.from({ length: ratingOf(q).max }, (_, i) => i + 1);

  switch (q.type) {
    case "short":
      return <div className={cn(box, "max-w-md")}>พิมพ์คำตอบสั้น ๆ</div>;
    case "long":
      return <div className={cn(box, "h-20")}>พิมพ์คำตอบ…</div>;
    case "date":
      return (
        <div className={cn(box, "flex max-w-xs items-center justify-between")}>
          dd / mm / yyyy <Calendar className="size-4" />
        </div>
      );
    case "dropdown":
      return (
        <div className={cn(box, "flex max-w-md items-center justify-between")}>
          {q.options[0] || "เลือกคำตอบ"} <ChevronDown className="size-4" />
        </div>
      );
    case "single":
    case "multi":
    case "opinion":
      return (
        <ul className="space-y-1.5">
          {q.options.map((o, k) => (
            <li key={k} className="flex items-center gap-2 text-sm">
              <span className={cn("size-4 shrink-0 border", q.type === "multi" ? "rounded" : "rounded-full")} />
              {o || "—"}
            </li>
          ))}
        </ul>
      );
    case "yesno":
      return (
        <div className="flex max-w-xs gap-2">
          {q.options.map((o) => (
            <span key={o} className="flex-1 rounded-lg border py-2 text-center text-sm font-semibold">
              {o}
            </span>
          ))}
        </div>
      );
    case "rating":
      return (
        <div className="flex flex-wrap gap-1">
          {nums.map((n) => (
            <Star key={n} className={sm ? "size-5" : "size-7"} style={{ color: primary }} />
          ))}
        </div>
      );
    case "linear":
      return (
        <div className="max-w-md space-y-1">
          <div className="grid grid-cols-5 gap-1.5">
            {nums.map((n) => (
              <span key={n} className={cn("flex items-center justify-center rounded-lg border font-semibold", sm ? "h-8 text-xs" : "h-10 text-sm")}>
                {n}
              </span>
            ))}
          </div>
          {(q.scaleLabels?.min || q.scaleLabels?.max) && (
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{q.scaleLabels?.min}</span>
              <span>{q.scaleLabels?.max}</span>
            </div>
          )}
        </div>
      );
    case "mcgrid":
    case "cbgrid":
      return (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-xs">
            <thead>
              <tr>
                <th />
                {q.options.map((c, k) => (
                  <th key={k} className="px-2 py-1.5 font-medium text-muted-foreground">{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(q.rows ?? []).map((r, ri) => (
                <tr key={ri} className="border-t">
                  <th scope="row" className="px-2 py-1.5 text-left font-medium">{r}</th>
                  {q.options.map((_, k) => (
                    <td key={k} className="px-2 py-1.5">
                      <span className={cn("mx-auto block size-4 border", q.type === "cbgrid" ? "rounded" : "rounded-full")} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    default:
      return null;
  }
}

/** แสดงตัวอย่างแบบประเมินแบบที่ผู้เข้าร่วมเห็นบนมือถือ */
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

  return (
    <div className="mx-auto w-full max-w-sm rounded-[2rem] border bg-background p-5 shadow-lg">
      <p className="mb-4 text-base font-bold">{title}</p>
      {questions.length === 0 && <p className="text-sm text-muted-foreground">ยังไม่มีคำถาม</p>}
      <div className="space-y-5">
        {questions.map((q, i) => (
          <div key={q.id} className="space-y-2">
            <p className="text-sm font-medium">
              {i + 1}. {label(q)} {q.required && <span className="text-destructive">*</span>}
            </p>
            <AnswerSample q={q} primary={primary} size="sm" />
          </div>
        ))}
      </div>
      <button type="button" className="mt-6 w-full rounded-lg py-2.5 text-sm font-semibold text-white" style={{ backgroundColor: primary }}>
        {lang === "th" ? "ส่งแบบประเมิน" : "Submit"}
      </button>
    </div>
  );
}
