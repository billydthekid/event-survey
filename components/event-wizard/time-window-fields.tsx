"use client";
// ฟ้าใส: ช่วงเปิด–ปิด ใช้ 2 ที่: ขั้นฟอร์มลงทะเบียน (regOpen/regClose) และขั้น Survey (surveyOpen/surveyClose)
// ฟ้าใส: หน้าตาแบบ "เริ่ม / จบ" (DateTimeRange) · เก็บเป็น datetime-local ค่าเดียว ("yyyy-MM-ddTHH:mm")
// ฟ้าใส: บังคับกรอกทั้ง 2 ช่องก่อนไปขั้นถัดไป (stepBlock)

import { useWizardStore } from "@/lib/wizard-store";
import { useNow } from "@/lib/hooks/useNow";
import { nowParts, validateDates } from "@/lib/utils/wizard-rules";
import type { EventDraft } from "@/types/event";
import { useWizardLang } from "@/lib/wizard-lang";
import { DateTimeRange, joinDateTime, splitDateTime } from "./date-time-range";

// ฟ้าใส: ชื่อช่องเวลาที่ใช้ได้
type Key = keyof Pick<EventDraft["schedule"], "regOpen" | "regClose" | "surveyOpen" | "surveyClose">;

// ฟ้าใส: ช่องเวลาเปิด–ปิด (ลงทะเบียน หรือ Survey)
export function TimeWindowFields({
  openKey,
  closeKey,
  openLabel,
  closeLabel,
  required = true,
}: {
  openKey: Key;
  closeKey: Key;
  openLabel: string;
  closeLabel: string;
  required?: boolean; // ฟ้าใส: แสดง * (Survey ไม่มีคำถาม = ไม่บังคับ)
}) {
  // ฟ้าใส: Event ที่กำลังแก้
  const draft = useWizardStore((s) => s.draft);
  // ฟ้าใส: ฟังก์ชันบันทึก
  const patch = useWizardStore((s) => s.patch);
  // ฟ้าใส: เวลาปัจจุบัน
  const now = useNow();
  const { today } = nowParts(now);
  // ฟ้าใส: error วันเวลา
  const err = validateDates(draft, now, useWizardLang());
  // ฟ้าใส: ช่วงเวลาทั้งหมด
  const sc = draft.schedule;
  // ฟ้าใส: แยกวัน / เวลาของเวลาเปิด
  const open = splitDateTime(sc[openKey]);
  // ฟ้าใส: แยกวัน / เวลาของเวลาปิด
  const close = splitDateTime(sc[closeKey]);

  return (
    // ฟ้าใส: ช่องเลือกเริ่ม / จบ
    <DateTimeRange
      required={required}
      startLabel={openLabel}
      endLabel={closeLabel}
      minDate={today}
      start={open}
      end={close}
      // ฟ้าใส: เลือกแค่วัน → เวลาเริ่มต้น 09:00 / 18:00 · เลือกแค่เวลา → วันนี้ (ปิดรับ = วันเดียวกับเปิดรับ)
      onStart={(v) => patch("schedule", { [openKey]: joinDateTime(v, { date: today, time: "09:00" }) })}
      onEnd={(v) => patch("schedule", { [closeKey]: joinDateTime(v, { date: open.date || today, time: "18:00" }) })}
      startError={err[openKey]}
      endError={err[closeKey]}
    />
  );
}
