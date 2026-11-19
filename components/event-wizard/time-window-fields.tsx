"use client";
// ช่วงเปิด–ปิด ใช้ 2 ที่: ขั้นฟอร์มลงทะเบียน (regOpen/regClose) และขั้น Survey (surveyOpen/surveyClose)
// หน้าตาแบบ "เริ่ม / จบ" (DateTimeRange) · เก็บเป็น datetime-local ค่าเดียว ("yyyy-MM-ddTHH:mm")
// บังคับกรอกทั้ง 2 ช่องก่อนไปขั้นถัดไป (stepBlock)

import { useWizardStore } from "@/lib/wizard-store";
import { useNow } from "@/lib/hooks/useNow";
import { nowParts, validateDates } from "@/lib/utils/wizard-rules";
import type { EventDraft } from "@/types/event";
import { useWizardLang } from "@/lib/wizard-lang";
import { DateTimeRange, joinDateTime, splitDateTime } from "./date-time-range";

type Key = keyof Pick<EventDraft["schedule"], "regOpen" | "regClose" | "surveyOpen" | "surveyClose">;

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
  required?: boolean; // แสดง * (Survey ไม่มีคำถาม = ไม่บังคับ)
}) {
  const draft = useWizardStore((s) => s.draft);
  const patch = useWizardStore((s) => s.patch);
  const now = useNow();
  const { today } = nowParts(now);
  const err = validateDates(draft, now, useWizardLang());
  const sc = draft.schedule;
  const open = splitDateTime(sc[openKey]);
  const close = splitDateTime(sc[closeKey]);

  return (
    <DateTimeRange
      required={required}
      startLabel={openLabel}
      endLabel={closeLabel}
      minDate={today}
      start={open}
      end={close}
      // เลือกแค่วัน → เวลาเริ่มต้น 09:00 / 18:00 · เลือกแค่เวลา → วันนี้ (ปิดรับ = วันเดียวกับเปิดรับ)
      onStart={(v) => patch("schedule", { [openKey]: joinDateTime(v, { date: today, time: "09:00" }) })}
      onEnd={(v) => patch("schedule", { [closeKey]: joinDateTime(v, { date: open.date || today, time: "18:00" }) })}
      startError={err[openKey]}
      endError={err[closeKey]}
    />
  );
}
