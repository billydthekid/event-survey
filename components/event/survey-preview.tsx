"use client";
// ฟ้าใส: ตัวอย่างคำถาม Survey 12 ประเภท แบบที่ผู้เข้าร่วมเห็นบนหน้า /s
// ฟ้าใส: - AnswerSample: ช่องตอบตัวอย่างของคำถาม 1 ข้อ (ใช้ทั้งในการ์ดของ Survey Builder และใน Preview)
// ฟ้าใส: - SurveyPreview: ทั้งแบบประเมิน (Dialog "Preview มือถือ" และขั้น Preview ของ Wizard)

import { Calendar, ChevronDown, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { normalizeQuestion } from "@/lib/survey-types";
import type { SurveyQuestion } from "@/types/event";
import { BG_LAYER, lookStyle, type PageLook } from "@/lib/theme-presets";
import { useTr } from "@/lib/wizard-lang";

// ฟ้าใส: หน้าตากล่องคำตอบตัวอย่าง
const box = "rounded-lg border bg-muted/30 px-3 py-2.5 text-sm text-muted-foreground";

/** ฟ้าใส: คะแนนเต็มของ linear / rating (ไม่ได้ตั้ง = 5) */
export const ratingOf = (q: SurveyQuestion) => ({ max: q.ratingMax ?? 5 });

// ฟ้าใส: ช่องตอบตัวอย่างของคำถาม 1 ข้อ (ตามประเภท)
export function AnswerSample({ q: raw, primary, size = "md" }: { q: SurveyQuestion; primary: string; size?: "sm" | "md" }) {
  // ฟ้าใส: แปลง rating เก่าให้เป็นรูปแบบปัจจุบัน
  const q = normalizeQuestion(raw);
  // ฟ้าใส: ขนาดเล็ก (ใช้ใน Preview)
  const sm = size === "sm";
  // ฟ้าใส: ตัวเลือกข้อความตามภาษา
  const tr = useTr();
  // ฟ้าใส: ตัวเลข 1 ถึงคะแนนเต็ม
  const nums = Array.from({ length: ratingOf(q).max }, (_, i) => i + 1);

  switch (q.type) {
    // ฟ้าใส: ข้อความสั้น
    case "short":
      return <div className={cn(box, "max-w-md")}>{tr("พิมพ์คำตอบสั้น ๆ", "Short answer")}</div>;
    // ฟ้าใส: ข้อความยาว
    case "long":
      return <div className={cn(box, "h-20")}>{tr("พิมพ์คำตอบ…", "Your answer…")}</div>;
    // ฟ้าใส: วันที่
    case "date":
      return (
        <div className={cn(box, "flex max-w-xs items-center justify-between")}>
          dd / mm / yyyy <Calendar className="size-4" />
        </div>
      );
    // ฟ้าใส: Dropdown
    case "dropdown":
      return (
        <div className={cn(box, "flex max-w-md items-center justify-between")}>
          {q.options[0] || tr("เลือกคำตอบ", "Choose")} <ChevronDown className="size-4" />
        </div>
      );
    // ฟ้าใส: ตัวเลือกเดียว
    case "single":
    // ฟ้าใส: หลายตัวเลือก
    case "multi":
    // ฟ้าใส: ระดับความเห็น
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
    // ฟ้าใส: ใช่ / ไม่ใช่
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
    // ฟ้าใส: ให้ดาว
    case "rating":
      return (
        <div className="flex flex-wrap gap-1">
          {nums.map((n) => (
            <Star key={n} className={sm ? "size-5" : "size-7"} style={{ color: primary }} />
          ))}
        </div>
      );
    // ฟ้าใส: สเกลตัวเลข
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
    // ฟ้าใส: ตารางเลือกข้อเดียว
    case "mcgrid":
    // ฟ้าใส: ตารางเลือกหลายข้อ
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
    // ฟ้าใส: ประเภทอื่น
    default:
      return null;
  }
}

/** ฟ้าใส: แสดงตัวอย่างแบบประเมินแบบที่ผู้เข้าร่วมเห็นบนมือถือ */
export function SurveyPreview({
  questions,
  lang,
  primary: primaryProp,
  title,
  look,
}: {
  questions: SurveyQuestion[];
  lang: "th" | "en";
  primary: string;
  title: string;
  /** ฟ้าใส: สีของหน้า Survey (ขั้น Branding → ปรับแต่งเอง แท็บ Survey) · ไม่ส่ง = พื้นขาวแบบเดิม */
  look?: PageLook;
}) {
  // ฟ้าใส: สีหลัก (ตั้งแยกให้ Survey ได้)
  const primary = look?.primary ?? primaryProp;
  // ฟ้าใส: ตัวเลือกข้อความตามภาษา
  const tr = useTr();
  // ฟ้าใส: ชื่อคำถามตามภาษา (ไม่มีชื่อ = ข้อความแทน)
  const label = (q: SurveyQuestion) => (lang === "en" && q.titleEn ? q.titleEn : q.titleTh) || tr("(ยังไม่ตั้งชื่อคำถาม)", "(Untitled question)");

  return (
    <div className={cn("mx-auto w-full max-w-sm overflow-hidden rounded-[2rem] border bg-background p-5 shadow-lg", look && BG_LAYER)} style={look ? lookStyle(look) : undefined}>
      {/* ฟ้าใส: แบนเนอร์หัวหน้า 4:1 แบบ Google Forms (ตั้งในขั้น Branding) */}
      {look?.banner && (
        // eslint-disable-next-line @next/next/no-img-element -- data URL ของแบนเนอร์ที่ crop แล้ว
        <img src={look.banner} alt="" className="-mx-1 mb-4 aspect-[4/1] w-[calc(100%+0.5rem)] rounded-xl object-cover" />
      )}
      <p className="mb-4 text-base font-bold">{title}</p>
      {questions.length === 0 && <p className="text-sm text-muted-foreground" style={{ color: look?.muted }}>{tr("ยังไม่มีคำถาม", "No questions yet")}</p>}
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
        {tr("ส่งแบบประเมิน", "Submit")}
      </button>
    </div>
  );
}
