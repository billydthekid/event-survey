"use client";
// ตัวอย่างฟอร์มลงทะเบียนแบบที่ผู้เข้าร่วมเห็นบนมือถือ (แบบ Preview ของ Google Form)
// - FieldSample: ช่องกรอกตัวอย่างของแต่ละประเภท (ใช้ทั้งในการ์ดของ Wizard ขั้นที่ 4 และใน Preview)
// - FormPreview: ทั้งฟอร์ม ใช้ใน Dialog "Preview ฟอร์ม" และ Preview เต็มจอขั้นที่ 6

import { Calendar, ChevronDown, Clock, Paperclip } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FormField } from "@/types/event";

const box = "rounded-lg border bg-muted/30 px-3 py-2.5 text-sm text-muted-foreground";

export function FieldSample({ f, className }: { f: FormField; className?: string }) { // ตัวอย่างช่องกรอกของแต่ละประเภท
  const options = f.options?.length ? f.options : ["ตัวเลือก 1", "ตัวเลือก 2"];
  switch (f.kind) {
    case "paragraph":
      return <div className={cn(box, "h-20", className)}>พิมพ์คำตอบ…</div>;
    case "address":
      return <div className={cn(box, "h-20", className)}>บ้านเลขที่ ถนน แขวง/ตำบล เขต/อำเภอ จังหวัด รหัสไปรษณีย์</div>;
    case "email":
      return <div className={cn(box, className)}>name@email.com</div>;
    case "phone":
      return <div className={cn(box, className)}>0X-XXX-XXXX</div>;
    case "number":
      return <div className={cn(box, className)}>ตัวเลข</div>;
    case "date":
      return (
        <div className={cn(box, "flex items-center justify-between", className)}>
          dd / mm / yyyy <Calendar className="size-4" />
        </div>
      );
    case "time":
      return (
        <div className={cn(box, "flex items-center justify-between", className)}>
          -- : -- <Clock className="size-4" />
        </div>
      );
    case "file":
      return (
        <div className={cn(box, "flex items-center gap-2 border-dashed", className)}>
          <Paperclip className="size-4" /> แนบเอกสาร / รูปภาพ
        </div>
      );
    case "dropdown":
      return (
        <div className={cn(box, "flex items-center justify-between", className)}>
          เลือกคำตอบ <ChevronDown className="size-4" />
        </div>
      );
    case "radio":
    case "checkbox":
      return (
        <ul className={cn("space-y-1.5 text-sm text-muted-foreground", className)}>
          {options.map((o, i) => (
            <li key={i} className="flex items-center gap-2">
              <span className={cn("size-4 shrink-0 border", f.kind === "radio" ? "rounded-full" : "rounded")} />
              {o || "—"}
            </li>
          ))}
        </ul>
      );
    default:
      return <div className={cn(box, className)}>ผู้กรอกพิมพ์คำตอบที่นี่…</div>;
  }
}

export function FormPreview({
  fields,
  primary,
  eventName,
}: {
  fields: FormField[];
  primary: string;
  eventName: string;
}) {
  return (
    <div className="mx-auto w-full max-w-sm rounded-[2rem] border bg-background p-5 shadow-lg">
      <span className="rounded-full px-2 py-0.5 text-[11px] font-semibold" style={{ background: `${primary}1A`, color: primary }}>
        ลงทะเบียนเข้าร่วม
      </span>
      <p className="mt-2 mb-4 text-base font-bold">{eventName || "(ยังไม่ตั้งชื่อ Event)"}</p>
      {fields.length === 0 && <p className="text-sm text-muted-foreground">ยังไม่มีช่องในฟอร์ม</p>}
      <div className="space-y-5">
        {fields.map((f) => (
          <div key={f.id} className="space-y-2">
            <p className="text-sm font-medium">
              {f.label || "(ยังไม่ตั้งชื่อช่อง)"} {f.required && <span className="text-destructive">*</span>}
            </p>
            <FieldSample f={f} />
          </div>
        ))}
      </div>
      <button type="button" className="mt-6 w-full rounded-lg py-2.5 text-sm font-semibold text-white" style={{ backgroundColor: primary }}>
        ลงทะเบียน
      </button>
    </div>
  );
}
