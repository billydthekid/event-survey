"use client";
// ส่วนแก้คำตอบในการ์ดคำถามของ Survey Builder (ใต้ชื่อคำถาม) — แยกตามประเภท 12 แบบ
// - ตัวเลือก (single / multi / dropdown / opinion): แก้ / ลบ / เพิ่มในการ์ด
// - ตาราง (mcgrid / cbgrid): แก้แถว (หัวข้อ) และคอลัมน์ (ตัวเลือก)
// - linear: คำกำกับปลายซ้าย/ขวา · ประเภทอื่น: แสดงตัวอย่างช่องตอบ (AnswerSample)

import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SurveyQuestion } from "@/types/event";
import { AnswerSample } from "./survey-preview";
import { useTr } from "@/lib/wizard-lang";

export function QuestionEditor({
  q,
  primary,
  update,
}: {
  q: SurveyQuestion;
  primary: string;
  update: (v: Partial<SurveyQuestion>) => void;
}) {
  const tr = useTr();
  switch (q.type) {
    case "single":
    case "multi":
    case "dropdown":
    case "opinion":
      return (
        <ListEditor
          items={q.options}
          onChange={(options) => update({ options })}
          marker={(k) =>
            q.type === "dropdown" ? (
              <span className="w-4 text-center text-xs text-muted-foreground">{k + 1}</span>
            ) : (
              <span className={cn("size-4 shrink-0 border", q.type === "multi" ? "rounded" : "rounded-full")} />
            )
          }
          addLabel={q.type === "opinion" ? tr("+ เพิ่มระดับ", "+ Add level") : tr("+ เพิ่มตัวเลือก", "+ Add option")}
          newItem={(n) => (q.type === "opinion" ? tr(`ระดับ ${n}`, `Level ${n}`) : tr(`ตัวเลือก ${n}`, `Option ${n}`))}
        />
      );
    case "mcgrid":
    case "cbgrid":
      return (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground">{tr("แถว (หัวข้อที่ให้ประเมิน)", "Rows (topics to rate)")}</p>
              <ListEditor
                items={q.rows ?? []}
                onChange={(rows) => update({ rows })}
                marker={(k) => <span className="w-4 text-center text-xs text-muted-foreground">{k + 1}</span>}
                addLabel={tr("+ เพิ่มแถว", "+ Add row")}
                newItem={(n) => tr(`หัวข้อ ${n}`, `Topic ${n}`)}
                min={1}
              />
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground">{tr("คอลัมน์ (ตัวเลือก)", "Columns (choices)")}</p>
              <ListEditor
                items={q.options}
                onChange={(options) => update({ options })}
                marker={() => <span className={cn("size-4 shrink-0 border", q.type === "cbgrid" ? "rounded" : "rounded-full")} />}
                addLabel={tr("+ เพิ่มคอลัมน์", "+ Add column")}
                newItem={(n) => tr(`ตัวเลือก ${n}`, `Option ${n}`)}
              />
            </div>
          </div>
          <AnswerSample q={q} primary={primary} />
        </div>
      );
    case "linear":
      return (
        <div className="space-y-3">
          <AnswerSample q={q} primary={primary} />
          <div className="grid max-w-md grid-cols-2 gap-2">
            <input
              value={q.scaleLabels?.min ?? ""}
              onChange={(e) => update({ scaleLabels: { min: e.target.value, max: q.scaleLabels?.max ?? "" } })}
              placeholder={tr("คำกำกับเลข 1 เช่น น้อยที่สุด", "Label for 1, e.g. least")}
              aria-label={tr("คำกำกับคะแนนต่ำสุด", "Lowest score label")}
              className="rounded-lg border px-3 py-2 text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <input
              value={q.scaleLabels?.max ?? ""}
              onChange={(e) => update({ scaleLabels: { min: q.scaleLabels?.min ?? "", max: e.target.value } })}
              placeholder={tr(`คำกำกับเลข ${q.ratingMax ?? 5} เช่น มากที่สุด`, `Label for ${q.ratingMax ?? 5}, e.g. most`)}
              aria-label={tr("คำกำกับคะแนนสูงสุด", "Highest score label")}
              className="rounded-lg border px-3 py-2 text-right text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
        </div>
      );
    default:
      // short / long / date / rating / yesno → แสดงตัวอย่างอย่างเดียว (yesno = ใช่/ไม่ใช่ ตายตัว)
      return <AnswerSample q={q} primary={primary} />;
  }
}

// รายการข้อความที่แก้ / ลบ / เพิ่มได้ (ตัวเลือก, แถว, คอลัมน์)
function ListEditor({
  items,
  onChange,
  marker,
  addLabel,
  newItem,
  min = 2,
}: {
  items: string[];
  onChange: (next: string[]) => void;
  marker: (k: number) => React.ReactNode;
  addLabel: string;
  newItem: (n: number) => string;
  min?: number;
}) {
  const tr = useTr();
  return (
    <div className="space-y-2">
      {items.map((o, k) => (
        <div key={k} className="group flex max-w-2xl items-center gap-3 rounded-lg border px-4 py-2.5">
          {marker(k)}
          <input
            value={o}
            placeholder={newItem(k + 1)}
            onChange={(e) => onChange(items.map((x, n) => (n === k ? e.target.value : x)))}
            aria-label={tr(`รายการที่ ${k + 1}`, `Item ${k + 1}`)}
            className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
          />
          <button
            type="button"
            aria-label={tr("ลบ", "Remove")}
            disabled={items.length <= min}
            onClick={() => onChange(items.filter((_, n) => n !== k))}
            className="text-muted-foreground opacity-0 transition hover:text-foreground focus:opacity-100 group-hover:opacity-100 disabled:hidden"
          >
            <X className="size-4" />
          </button>
        </div>
      ))}
      <button type="button" onClick={() => onChange([...items, newItem(items.length + 1)])} className="text-sm text-primary hover:underline">
        {addLabel}
      </button>
    </div>
  );
}
