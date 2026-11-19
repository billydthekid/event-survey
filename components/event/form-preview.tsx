"use client";
// ฟ้าใส: ตัวอย่างฟอร์มลงทะเบียนแบบที่ผู้เข้าร่วมเห็นบนมือถือ (แบบ Preview ของ Google Form)
// ฟ้าใส: - FieldSample: ช่องกรอกตัวอย่างของแต่ละประเภท (ใช้ทั้งในการ์ดของ Wizard ขั้นที่ 3 และใน Preview)
// ฟ้าใส: - FormPreview: ทั้งฟอร์ม ใช้ใน Dialog "Preview ฟอร์ม" และขั้น Preview ของ Wizard

import { Calendar, ChevronDown, Clock, Paperclip } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FormField } from "@/types/event";
import { BG_LAYER, lookStyle, type PageLook } from "@/lib/theme-presets";
import { useTr } from "@/lib/wizard-lang";

// ฟ้าใส: หน้าตากล่องช่องกรอกตัวอย่าง
const box = "rounded-lg border bg-muted/30 px-3 py-2.5 text-sm text-muted-foreground";

export function FieldSample({ f, className }: { f: FormField; className?: string }) { // ฟ้าใส: ตัวอย่างช่องกรอกของแต่ละประเภท
  // ฟ้าใส: ตัวเลือกข้อความตามภาษา
  const tr = useTr();
  // ฟ้าใส: ตัวเลือกของช่อง (ไม่มี = ตัวเลือกตัวอย่าง)
  const options = f.options?.length ? f.options : [tr("ตัวเลือก 1", "Option 1"), tr("ตัวเลือก 2", "Option 2")];
  switch (f.kind) {
    // ฟ้าใส: ข้อความยาว
    case "paragraph":
      return <div className={cn(box, "h-20", className)}>{tr("พิมพ์คำตอบ…", "Your answer…")}</div>;
    // ฟ้าใส: ที่อยู่
    case "address":
      return (
        <div className={cn(box, "h-20", className)}>
          {tr("บ้านเลขที่ ถนน แขวง/ตำบล เขต/อำเภอ จังหวัด รหัสไปรษณีย์", "House no., street, district, province, postcode")}
        </div>
      );
    // ฟ้าใส: อีเมล
    case "email":
      return <div className={cn(box, className)}>name@email.com</div>;
    // ฟ้าใส: เบอร์โทร
    case "phone":
      return <div className={cn(box, className)}>0X-XXX-XXXX</div>;
    // ฟ้าใส: ตัวเลข
    case "number":
      return <div className={cn(box, className)}>{tr("ตัวเลข", "Number")}</div>;
    // ฟ้าใส: วันที่
    case "date":
      return (
        <div className={cn(box, "flex items-center justify-between", className)}>
          dd / mm / yyyy <Calendar className="size-4" />
        </div>
      );
    // ฟ้าใส: เวลา
    case "time":
      return (
        <div className={cn(box, "flex items-center justify-between", className)}>
          -- : -- <Clock className="size-4" />
        </div>
      );
    // ฟ้าใส: แนบไฟล์
    case "file":
      return (
        <div className={cn(box, "flex items-center gap-2 border-dashed", className)}>
          <Paperclip className="size-4" /> {tr("แนบเอกสาร / รูปภาพ", "Attach a document / photo")}
        </div>
      );
    // ฟ้าใส: Dropdown
    case "dropdown":
      return (
        <div className={cn(box, "flex items-center justify-between", className)}>
          {tr("เลือกคำตอบ", "Choose")} <ChevronDown className="size-4" />
        </div>
      );
    // ฟ้าใส: ตัวเลือกเดียว
    case "radio":
    // ฟ้าใส: หลายตัวเลือก
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
    // ฟ้าใส: ข้อความสั้น (ค่าตั้งต้น)
    default:
      return <div className={cn(box, className)}>{tr("ผู้กรอกพิมพ์คำตอบที่นี่…", "Attendee types here…")}</div>;
  }
}

// ฟ้าใส: ภาพจำลองฟอร์มลงทะเบียนทั้งหน้า
export function FormPreview({
  fields,
  primary: primaryProp,
  eventName,
  look,
}: {
  fields: FormField[];
  primary: string;
  eventName: string;
  /** ฟ้าใส: สีของหน้าฟอร์ม (ขั้น Branding → ปรับแต่งเอง แท็บ ฟอร์ม) · ไม่ส่ง = พื้นขาวแบบเดิม */
  look?: PageLook;
}) {
  // ฟ้าใส: สีหลัก (ตั้งแยกให้ฟอร์มได้)
  const primary = look?.primary ?? primaryProp;
  // ฟ้าใส: ตัวเลือกข้อความตามภาษา
  const tr = useTr();
  return (
    <div className={cn("mx-auto w-full max-w-sm overflow-hidden rounded-[2rem] border bg-background p-5 shadow-lg", look && BG_LAYER)} style={look ? lookStyle(look) : undefined}>
      {/* ฟ้าใส: แบนเนอร์หัวหน้า 4:1 แบบ Google Forms (ตั้งในขั้น Branding) */}
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
