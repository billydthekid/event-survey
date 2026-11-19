"use client";
// ตัวอย่างฟอร์มลงทะเบียนแบบที่ผู้เข้าร่วมเห็นบนมือถือ (แบบ Preview ของ Google Form)
// - FieldSample: ช่องกรอกตัวอย่างของแต่ละประเภท (ใช้ทั้งในการ์ดของ Wizard ขั้นที่ 3 และใน Preview)
// - FormPreview: ทั้งฟอร์ม ใช้ใน Dialog "Preview ฟอร์ม" และขั้น Preview ของ Wizard

import { Calendar, ChevronDown, Clock, Paperclip } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FormField } from "@/types/event";
import { BG_LAYER, lookStyle, type PageLook } from "@/lib/theme-presets";
import { useTr } from "@/lib/wizard-lang";

const box = "rounded-lg border bg-muted/30 px-3 py-2.5 text-sm text-muted-foreground";

export function FieldSample({ f, className }: { f: FormField; className?: string }) { // ตัวอย่างช่องกรอกของแต่ละประเภท
  const tr = useTr();
  const options = f.options?.length ? f.options : [tr("ตัวเลือก 1", "Option 1"), tr("ตัวเลือก 2", "Option 2")];
  switch (f.kind) {
    case "paragraph":
      return <div className={cn(box, "h-20", className)}>{tr("พิมพ์คำตอบ…", "Your answer…")}</div>;
    case "address":
      return (
        <div className={cn(box, "h-20", className)}>
          {tr("บ้านเลขที่ ถนน แขวง/ตำบล เขต/อำเภอ จังหวัด รหัสไปรษณีย์", "House no., street, district, province, postcode")}
        </div>
      );
    case "email":
      return <div className={cn(box, className)}>name@email.com</div>;
    case "phone":
      return <div className={cn(box, className)}>0X-XXX-XXXX</div>;
    case "number":
      return <div className={cn(box, className)}>{tr("ตัวเลข", "Number")}</div>;
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
          <Paperclip className="size-4" /> {tr("แนบเอกสาร / รูปภาพ", "Attach a document / photo")}
        </div>
      );
    case "dropdown":
      return (
        <div className={cn(box, "flex items-center justify-between", className)}>
          {tr("เลือกคำตอบ", "Choose")} <ChevronDown className="size-4" />
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
      return <div className={cn(box, className)}>{tr("ผู้กรอกพิมพ์คำตอบที่นี่…", "Attendee types here…")}</div>;
  }
}

export function FormPreview({
  fields,
  primary: primaryProp,
  eventName,
  look,
}: {
  fields: FormField[];
  primary: string;
  eventName: string;
  /** สีของหน้าฟอร์ม (ขั้น Branding → ปรับแต่งเอง แท็บ ฟอร์ม) · ไม่ส่ง = พื้นขาวแบบเดิม */
  look?: PageLook;
}) {
  const primary = look?.primary ?? primaryProp;
  const tr = useTr();
  return (
    <div className={cn("mx-auto w-full max-w-sm overflow-hidden rounded-[2rem] border bg-background p-5 shadow-lg", look && BG_LAYER)} style={look ? lookStyle(look) : undefined}>
      {/* แบนเนอร์หัวหน้า 4:1 แบบ Google Forms (ตั้งในขั้น Branding) */}
      {look?.banner && (
        // eslint-disable-next-line @next/next/no-img-element -- data URL ของแบนเนอร์ที่ crop แล้ว
        <img src={look.banner} alt="" className="-mx-1 mb-4 aspect-[4/1] w-[calc(100%+0.5rem)] rounded-xl object-cover" />
      )}
      <span className="rounded-full px-2 py-0.5 text-[11px] font-semibold" style={{ background: `${primary}1A`, color: primary }}>
        {tr("ลงทะเบียนเข้าร่วม", "Registration")}
      </span>
      <p className="mt-2 mb-4 text-base font-bold">{eventName || tr("(ยังไม่ตั้งชื่อ Event)", "(Untitled event)")}</p>
      {fields.length === 0 && <p className="text-sm text-muted-foreground" style={{ color: look?.muted }}>{tr("ยังไม่มีช่องในฟอร์ม", "No fields yet")}</p>}
      <div className="space-y-5">
        {fields.map((f) => (
          <div key={f.id} className="space-y-2">
            <p className="text-sm font-medium">
              {f.label || tr("(ยังไม่ตั้งชื่อช่อง)", "(Untitled field)")} {f.required && <span className="text-destructive">*</span>}
            </p>
            <FieldSample f={f} />
          </div>
        ))}
      </div>
      <button type="button" className="mt-6 w-full rounded-lg py-2.5 text-sm font-semibold text-white" style={{ backgroundColor: primary }}>
        {tr("ลงทะเบียน", "Register")}
      </button>
    </div>
  );
}
