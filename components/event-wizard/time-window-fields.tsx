"use client";
// ช่องเวลาเปิด–ปิด (datetime-local) ใช้ 2 ที่: ขั้นฟอร์มลงทะเบียน (regOpen/regClose) และขั้น Survey (surveyOpen/surveyClose)
// เดิมอยู่ในขั้น "ช่วงเวลา" ที่ตัดออกแล้ว · บังคับกรอกทั้ง 2 ช่องก่อนไปขั้นถัดไป (stepBlock)

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useWizardStore } from "@/lib/wizard-store";
import { useNow } from "@/lib/hooks/useNow";
import { nowParts, validateDates } from "@/lib/utils/wizard-rules";
import type { EventDraft } from "@/types/event";
import { FieldError } from "./field-error";

type Key = keyof Pick<EventDraft["schedule"], "regOpen" | "regClose" | "surveyOpen" | "surveyClose">;

export function TimeWindowFields({
  openKey,
  closeKey,
  openLabel,
  closeLabel,
}: {
  openKey: Key;
  closeKey: Key;
  openLabel: string;
  closeLabel: string;
}) {
  const draft = useWizardStore((s) => s.draft);
  const patch = useWizardStore((s) => s.patch);
  const now = useNow();
  const { nowLocal } = nowParts(now);
  const err = validateDates(draft, now);
  const sc = draft.schedule;

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-1.5">
        <Label>{openLabel} <span className="text-destructive">*</span></Label>
        <Input
          type="datetime-local"
          min={nowLocal}
          value={sc[openKey]}
          aria-invalid={!!err[openKey]}
          onChange={(e) => patch("schedule", { [openKey]: e.target.value })}
        />
        <FieldError text={err[openKey]} />
      </div>
      <div className="space-y-1.5">
        <Label>{closeLabel} <span className="text-destructive">*</span></Label>
        <Input
          type="datetime-local"
          min={sc[openKey] || nowLocal}
          value={sc[closeKey]}
          aria-invalid={!!err[closeKey]}
          onChange={(e) => patch("schedule", { [closeKey]: e.target.value })}
        />
        <FieldError text={err[closeKey]} />
      </div>
    </div>
  );
}
