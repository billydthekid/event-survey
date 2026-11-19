"use client";
// ขั้นที่ 1: ข้อมูลทั่วไป — หน้าเดียวเรียงลงมา: ชื่อ/รายละเอียด/ประเภท → วัน เวลา สถานที่ → ผู้จัด → ผู้ที่ลงทะเบียนได้
// ช่อง (*) + วันเวลา + รายชื่อ Event ปิด ต้องครบก่อนกด "ถัดไป" (stepBlock ใน lib/utils/wizard-rules.ts)

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useWizardStore } from "@/lib/wizard-store";
import { useNow } from "@/lib/hooks/useNow";
import { nowParts, validateDates } from "@/lib/utils/wizard-rules";
import { DateTimeRange } from "./date-time-range";
import { AllowListCard } from "./allow-list-card";
import { WizardSection } from "./wizard-section";
import { EVENT_TYPES } from "@/lib/event-types";
import type { EventType } from "@/types/event";
import { useTr, useWizardLang } from "@/lib/wizard-lang";

export function StepGeneral() {
  const g = useWizardStore((s) => s.draft.general);
  const draft = useWizardStore((s) => s.draft);
  const patch = useWizardStore((s) => s.patch);
  const now = useNow();
  const { today } = nowParts(now);
  const lang = useWizardLang();
  const tr = useTr();
  const err = validateDates(draft, now, lang);
  const set = (v: Partial<typeof g>) => patch("general", v);

  return (
    <>
      {/* กรอกภาษาไทยอย่างเดียว (ตัดปุ่มสลับ ไทย / English ออกแล้ว · nameEn / descEn เดิมยังเก็บไว้ แต่แก้จากหน้านี้ไม่ได้) */}
      <WizardSection title={tr("ชื่อและรายละเอียด", "Name and description")}>
        <div className="space-y-1.5">
          <Label>{tr("ชื่อ Event", "Event name")} <span className="text-destructive">*</span></Label>
          <Input value={g.nameTh} onChange={(e) => set({ nameTh: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label>{tr("รายละเอียด", "Description")} <span className="text-destructive">*</span></Label>
          <Textarea rows={3} value={g.descTh} onChange={(e) => set({ descTh: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label>{tr("ประเภทงาน", "Event type")} <span className="text-destructive">*</span></Label>
          <ToggleGroup value={[g.type]} onValueChange={(v) => v[0] && set({ type: v[0] as EventType })} variant="outline" className="flex-wrap justify-start">
            {EVENT_TYPES.map((t) => (
              <ToggleGroupItem key={t.value} value={t.value} className="rounded-full">
                {t[lang]}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
          {g.type === "other" && (
            <Input
              placeholder={tr("ระบุประเภทงาน เช่น งานบวช, ทัศนศึกษา", "Type the event type, e.g. field trip")}
              value={g.typeOther ?? ""}
              onChange={(e) => set({ typeOther: e.target.value })}
              aria-label={tr("ประเภทงานอื่นๆ", "Other event type")}
            />
          )}
        </div>
      </WizardSection>

      <WizardSection
        title={tr("วัน เวลา และสถานที่", "Date, time and place")}
        action={
          <ToggleGroup value={[g.mode]} onValueChange={(v) => v[0] && set({ mode: v[0] as "onsite" | "online" })} variant="outline" size="sm">
            <ToggleGroupItem value="onsite">{tr("สถานที่จริง", "In person")}</ToggleGroupItem>
            <ToggleGroupItem value="online">Online</ToggleGroupItem>
          </ToggleGroup>
        }
      >
        {/* เริ่ม / จบ (งานข้ามวันได้ · วันจบว่าง = วันเดียวกับวันเริ่ม) */}
        <DateTimeRange
          required
          minDate={today}
          start={{ date: g.date, time: g.startTime }}
          end={{ date: g.endDate || g.date, time: g.endTime }}
          onStart={(v) =>
            // เลื่อนวันเริ่มไปหลังวันจบเดิม → ล้างวันจบ (กลับเป็นวันเดียวกัน)
            set({ date: v.date, startTime: v.time, ...(g.endDate && v.date > g.endDate ? { endDate: "" } : {}) })
          }
          onEnd={(v) => set({ endDate: v.date === g.date ? "" : v.date, endTime: v.time })}
          startError={err.date || err.startTime}
          endError={err.endTime}
        />
        <div className="space-y-1.5">
          <Label>{g.mode === "onsite" ? tr("สถานที่", "Venue") : tr("ลิงก์เข้าร่วม", "Joining link")} <span className="text-destructive">*</span></Label>
          <Input value={g.venue} onChange={(e) => set({ venue: e.target.value })} />
        </div>
        {g.mode === "onsite" && (
          <>
            <div className="space-y-1.5">
              <Label>{tr("จุดนัดพบ", "Meeting point")} <span className="text-xs text-muted-foreground">{tr("(ไม่บังคับ)", "(optional)")}</span></Label>
              <Input value={g.spot} onChange={(e) => set({ spot: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>{tr("ลิงก์แผนที่", "Map link")} <span className="text-xs text-muted-foreground">{tr("(ไม่บังคับ)", "(optional)")}</span></Label>
              <Input placeholder={tr("วางลิงก์ Google Maps", "Paste a Google Maps link")} value={g.mapUrl} onChange={(e) => set({ mapUrl: e.target.value })} />
            </div>
          </>
        )}
      </WizardSection>

      <WizardSection
        title={tr("ผู้จัดและช่องทางติดต่อ", "Organizer and contact")}
        description={tr("ให้ผู้เข้าร่วมรู้ว่าใครจัด และติดต่อใครถ้ามีคำถาม", "Let attendees know who runs the event and who to contact")}
      >
        <div className="space-y-1.5">
          <Label>{tr("ชื่อผู้จัด / หน่วยงาน", "Organizer / unit")} <span className="text-destructive">*</span></Label>
          <Input value={g.organizer} onChange={(e) => set({ organizer: e.target.value })} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>{tr("เบอร์โทร", "Phone")} <span className="text-xs text-muted-foreground">{tr("(ไม่บังคับ)", "(optional)")}</span></Label>
            <Input placeholder="0X XXX XXXX" value={g.phone} onChange={(e) => set({ phone: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>{tr("อีเมล", "Email")} <span className="text-xs text-muted-foreground">{tr("(ไม่บังคับ)", "(optional)")}</span></Label>
            <Input type="email" value={g.email} onChange={(e) => set({ email: e.target.value })} />
          </div>
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="show-contact">{tr("แสดงช่องทางติดต่อบนหน้า Event", "Show contact details on the event page")}</Label>
          <Switch id="show-contact" checked={g.showContact} onCheckedChange={(v) => set({ showContact: v })} />
        </div>
      </WizardSection>

      {/* เปิด / ปิด Event (Event ปิด = รับเฉพาะรายชื่อที่ import) */}
      <AllowListCard />
    </>
  );
}
