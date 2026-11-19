"use client";
// ฟ้าใส: ช่องเลือก "เริ่ม / จบ" (แบบ Luma): 2 แถว · ซ้าย = จุด + เส้นประเชื่อม · ขวา = กล่องวันที่ "พุธ 18 พ.ย." + กล่องเวลา "20:30"
// ฟ้าใส: กดกล่องไหนก็เปิดตัวเลือกของเบราว์เซอร์ (input date / time ซ่อนอยู่ใต้กล่อง · showPicker)
// ฟ้าใส: ใช้ 3 ที่: วันเวลาจัดงาน (ขั้น 1) · เปิด–ปิดรับลงทะเบียน (ขั้น 3) · เปิด–ปิดรับคำตอบ Survey (ขั้น 4)

import { format, parseISO } from "date-fns";
import { enGB, th } from "date-fns/locale";
import { useTr, useWizardLang } from "@/lib/wizard-lang";
import type { Lang } from "@/types";
import { cn } from "@/lib/utils";
import { FieldError } from "./field-error";

// ฟ้าใส: ค่าวัน + เวลา 1 ชุด
export interface DateTimeValue {
  date: string; // ฟ้าใส: yyyy-MM-dd
  time: string; // ฟ้าใส: HH:mm
}

/** ฟ้าใส: "2026-11-18" → "พุธ 18 พ.ย." */
function dayLabel(iso: string, lang: Lang) {
  // ฟ้าใส: ยังไม่เลือกวัน → ข้อความชวนเลือก
  if (!iso) return lang === "en" ? "Pick a date" : "เลือกวันที่";
  return format(parseISO(iso), lang === "en" ? "EEE d MMM" : "EEEE d MMM", { locale: lang === "en" ? enGB : th });
}

// ฟ้าใส: ช่องเลือก เริ่ม / จบ 2 แถว
export function DateTimeRange({
  start,
  end,
  onStart,
  onEnd,
  startLabel,
  endLabel,
  minDate,
  startError,
  endError,
  required,
}: {
  start: DateTimeValue;
  end: DateTimeValue;
  // ฟ้าใส: เลือกเวลาเริ่มแล้ว
  onStart: (v: DateTimeValue) => void;
  // ฟ้าใส: เลือกเวลาจบแล้ว
  onEnd: (v: DateTimeValue) => void;
  startLabel?: string;
  endLabel?: string;
  minDate?: string; // ฟ้าใส: วันแรกที่เลือกได้ (yyyy-MM-dd)
  startError?: string;
  endError?: string;
  required?: boolean;
}) {
  // ฟ้าใส: ตัวเลือกข้อความตามภาษา
  const tr = useTr();
  startLabel ??= tr("เริ่ม", "Start");
  endLabel ??= tr("จบ", "End");
  return (
    <div className="space-y-1.5">
      <div className="rounded-xl bg-muted/60 p-1.5">
        <Row
          label={startLabel}
          value={start}
          onChange={onStart}
          minDate={minDate}
          invalid={!!startError}
          required={required}
          dot="filled"
        />
        <Row
          label={endLabel}
          value={end}
          onChange={onEnd}
          minDate={start.date || minDate}
          invalid={!!endError}
          required={required}
          dot="hollow"
        />
      </div>
      <FieldError text={startError} />
      <FieldError text={endError} />
    </div>
  );
}

// ฟ้าใส: แถว 1 แถว: ชื่อ + กล่องวันที่ + กล่องเวลา
function Row({
  label,
  value,
  onChange,
  minDate,
  invalid,
  required,
  dot,
}: {
  label: string;
  value: DateTimeValue;
  // ฟ้าใส: เลือกค่าใหม่แล้ว
  onChange: (v: DateTimeValue) => void;
  minDate?: string;
  invalid: boolean;
  required?: boolean;
  dot: "filled" | "hollow";
}) {
  // ฟ้าใส: ตัวเลือกข้อความตามภาษา
  const tr = useTr();
  // ฟ้าใส: ภาษาที่เลือก
  const lang = useWizardLang();
  // ฟ้าใส: หน้าตากล่อง (ผิด = ขอบแดง)
  const box = cn(
    "relative flex h-10 items-center rounded-lg bg-background/70 px-3 text-sm font-medium transition hover:bg-background",
    invalid && "ring-1 ring-destructive"
  );
  // ฟ้าใส: input ของเบราว์เซอร์คลุมทั้งกล่องแบบโปร่งใส → กดตรงไหนก็เปิดตัวเลือก
  const overlay = "absolute inset-0 size-full cursor-pointer opacity-0";
  // ฟ้าใส: กดกล่อง → เปิดตัวเลือกวัน / เวลาของเบราว์เซอร์
  const openPicker = (e: React.MouseEvent<HTMLInputElement>) => {
    try {
      e.currentTarget.showPicker?.();
    } catch {
      // ฟ้าใส: เบราว์เซอร์ที่ไม่รองรับ showPicker → ใช้การคลิกปกติ
    }
  };

  return (
    <div className="relative grid grid-cols-[5.5rem_minmax(0,1fr)_6rem] items-center gap-1.5 py-0.5">
      {/* ฟ้าใส: จุด + ชื่อแถว · เส้นประเชื่อมจากจุด "เริ่ม" ลงไปจุด "จบ" */}
      <span className="flex items-center gap-2.5 pl-3 text-sm text-muted-foreground">
        <span
          className={cn(
            "relative size-2.5 shrink-0 rounded-full",
            dot === "filled" ? "bg-muted-foreground/60" : "border border-muted-foreground/60 bg-transparent",
            dot === "filled" && "after:absolute after:top-full after:left-1/2 after:h-8 after:-translate-x-1/2 after:border-l after:border-dashed after:border-muted-foreground/50"
          )}
        />
        {label}
        {required && <span className="text-destructive">*</span>}
      </span>

      <label className={box}>
        <span className={cn(!value.date && "text-muted-foreground")}>{dayLabel(value.date, lang)}</span>
        <input
          type="date"
          aria-label={`${label}: ${tr("วันที่", "date")}`}
          min={minDate}
          value={value.date}
          onClick={openPicker}
          onChange={(e) => onChange({ ...value, date: e.target.value })}
          className={overlay}
        />
      </label>

      <label className={cn(box, "justify-center tabular-nums")}>
        <span className={cn(!value.time && "text-muted-foreground")}>{value.time || "--:--"}</span>
        <input
          type="time"
          aria-label={`${label}: ${tr("เวลา", "time")}`}
          value={value.time}
          onClick={openPicker}
          onChange={(e) => onChange({ ...value, time: e.target.value })}
          className={overlay}
        />
      </label>
    </div>
  );
}

// ฟ้าใส: ============ แปลงค่า datetime-local ("yyyy-MM-ddTHH:mm") ↔ { date, time } ============
// ฟ้าใส: ใช้กับช่วงเปิด–ปิดรับ (schedule) ที่เก็บเป็นค่าเดียว
export function splitDateTime(v: string): DateTimeValue {
  return { date: v.slice(0, 10), time: v.slice(11, 16) };
}

/** ฟ้าใส: เลือกได้ครึ่งเดียว (มีแต่วัน หรือมีแต่เวลา) → เติมอีกครึ่งให้ เพื่อเก็บเป็นค่าเดียวได้ */
export function joinDateTime(v: DateTimeValue, fallback: DateTimeValue): string {
  // ฟ้าใส: ไม่ได้เลือกทั้งวันและเวลา → ค่าว่าง
  if (!v.date && !v.time) return "";
  return `${v.date || fallback.date}T${v.time || fallback.time}`;
}
