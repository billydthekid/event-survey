"use client";
// ส่วนแก้คำตอบในการ์ดคำถามของ Survey Builder (ใต้ชื่อคำถาม) — แยกตามประเภท 12 แบบ
// - ตัวเลือก (single / multi / dropdown / opinion): แก้ / ลบ / เพิ่มในการ์ด
// - ตาราง (mcgrid / cbgrid): แก้แถว (หัวข้อ) และคอลัมน์ (ตัวเลือก)
// - linear: คำกำกับปลายซ้าย/ขวา · ประเภทอื่น: แสดงตัวอย่างช่องตอบ (AnswerSample)

import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SurveyQuestion } from "@/types/event";
import { AnswerSample } from "./survey-preview";

export function QuestionEditor({
  q,
  primary,
  update,
}: {
  q: SurveyQuestion;
  primary: string;
  update: (v: Partial<SurveyQuestion>) => void;
}) {
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
          addLabel={q.type === "opinion" ? "+ เพิ่มระดับ" : "+ เพิ่มตัวเลือก"}
          newItem={(n) => (q.type === "opinion" ? `ระดับ ${n}` : `ตัวเลือก ${n}`)}
        />
      );
    case "mcgrid":
    case "cbgrid":
      return (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground">แถว (หัวข้อที่ให้ประเมิน)</p>
              <ListEditor
                items={q.rows ?? []}
                onChange={(rows) => update({ rows })}
                marker={(k) => <span className="w-4 text-center text-xs text-muted-foreground">{k + 1}</span>}
                addLabel="+ เพิ่มแถว"
                newItem={(n) => `หัวข้อ ${n}`}
                min={1}
              />
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground">คอลัมน์ (ตัวเลือก)</p>
              <ListEditor
                items={q.options}
                onChange={(options) => update({ options })}
                marker={() => <span className={cn("size-4 shrink-0 border", q.type === "cbgrid" ? "rounded" : "rounded-full")} />}
                addLabel="+ เพิ่มคอลัมน์"
                newItem={(n) => `ตัวเลือก ${n}`}
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
              placeholder="คำกำกับเลข 1 เช่น น้อยที่สุด"
              aria-label="คำกำกับคะแนนต่ำสุด"
              className="rounded-lg border px-3 py-2 text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <input
              value={q.scaleLabels?.max ?? ""}
              onChange={(e) => update({ scaleLabels: { min: q.scaleLabels?.min ?? "", max: e.target.value } })}
              placeholder={`คำกำกับเลข ${q.ratingMax ?? 5} เช่น มากที่สุด`}
              aria-label="คำกำกับคะแนนสูงสุด"
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
  return (
    <div className="space-y-2">
      {items.map((o, k) => (
        <div key={k} className="group flex max-w-2xl items-center gap-3 rounded-lg border px-4 py-2.5">
          {marker(k)}
          <input
            value={o}
            onChange={(e) => onChange(items.map((x, n) => (n === k ? e.target.value : x)))}
            aria-label={`รายการที่ ${k + 1}`}
            className="min-w-0 flex-1 bg-transparent text-sm outline-none"
          />
          <button
            type="button"
            aria-label="ลบ"
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
