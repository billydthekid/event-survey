"use client";
// ฟ้าใส: ขั้นที่ 1: ข้อมูลทั่วไป — หน้าเดียวเรียงลงมา: ชื่อ/รายละเอียด/ประเภท → วัน เวลา สถานที่ → ผู้จัด → ผู้ที่ลงทะเบียนได้
// ฟ้าใส: ช่อง (*) + วันเวลา + รายชื่อ Event ปิด ต้องครบก่อนกด "ถัดไป" (stepBlock ใน lib/utils/wizard-rules.ts)

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

// ฟ้าใส: ขั้นที่ 1 ข้อมูลทั่วไป
export function StepGeneral() {
  // ฟ้าใส: ข้อมูลทั่วไปของ Event
  const g = useWizardStore((s) => s.draft.general);
  // ฟ้าใส: Event ทั้งก้อน (ใช้ตรวจวันเวลา)
  const draft = useWizardStore((s) => s.draft);
  // ฟ้าใส: ฟังก์ชันบันทึก
  const patch = useWizardStore((s) => s.patch);
  // ฟ้าใส: เวลาปัจจุบัน
  const now = useNow();
  const { today } = nowParts(now);
  // ฟ้าใส: ภาษาที่เลือก
  const lang = useWizardLang();
  // ฟ้าใส: ตัวเลือกข้อความตามภาษา
  const tr = useTr();
  // ฟ้าใส: error วันเวลา
  const err = validateDates(draft, now, lang);
  // ฟ้าใส: บันทึกบางช่องของข้อมูลทั่วไป
  const set = (v: Partial<typeof g>) => patch("general", v);

  return (
    <>
      {/* ฟ้าใส: กรอกภาษาไทยอย่างเดียว (ตัดปุ่มสลับ ไทย / English ออกแล้ว · nameEn / descEn เดิมยังเก็บไว้ แต่แก้จากหน้านี้ไม่ได้) */}
      <WizardSection title={tr("ชื่อและรายละเอียด", "Name and description")}>
        <div className="space-y-1.5">
          <Label>{tr("ชื่อ Event", "Event name")} <span className="text-destructive">*</span></Label>
          <Input
            placeholder={tr("เช่น Workshop ออกแบบ UX/UI สำหรับมือใหม่", "e.g. UX/UI Design Workshop for Beginners")}
            value={g.nameTh}
            onChange={(e) => set({ nameTh: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label>{tr("รายละเอียด", "Description")} <span className="text-destructive">*</span></Label>
          <Textarea
            rows={3}
            placeholder={tr(
              "เช่น เรียนรู้พื้นฐานการออกแบบ UX/UI ผ่าน Figma พร้อมลงมือทำจริง เหมาะสำหรับนักศึกษาทุกชั้นปี",
              "e.g. Learn UX/UI basics in Figma with hands-on practice. Open to students of all years."
            )}
            value={g.descTh}
            onChange={(e) => set({ descTh: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label>{tr("ประเภทงาน", "Event type")} <span className="text-destructive">*</span></Label>
          {/* ฟ้าใส: ปุ่มเลือกประเภทงาน */}
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

      {/* ฟ้าใส: ส่วนวัน เวลา และสถานที่ */}
      <WizardSection
        title={tr("วัน เวลา และสถานที่", "Date, time and place")}
        action={
          // ฟ้าใส: สถานที่จริง / Online
          <ToggleGroup value={[g.mode]} onValueChange={(v) => v[0] && set({ mode: v[0] as "onsite" | "online" })} variant="outline" size="sm">
            <ToggleGroupItem value="onsite">{tr("สถานที่จริง", "In person")}</ToggleGroupItem>
            <ToggleGroupItem value="online">Online</ToggleGroupItem>
          </ToggleGroup>
        }
      >
        {/* ฟ้าใส: เริ่ม / จบ (งานข้ามวันได้ · วันจบว่าง = วันเดียวกับวันเริ่ม) */}
        <DateTimeRange
          required
          minDate={today}
          start={{ date: g.date, time: g.startTime }}
          end={{ date: g.endDate || g.date, time: g.endTime }}
          onStart={(v) =>
            // ฟ้าใส: เลื่อนวันเริ่มไปหลังวันจบเดิม → ล้างวันจบ (กลับเป็นวันเดียวกัน)
            set({ date: v.date, startTime: v.time, ...(g.endDate && v.date > g.endDate ? { endDate: "" } : {}) })
          }
          onEnd={(v) => set({ endDate: v.date === g.date ? "" : v.date, endTime: v.time })}
          startError={err.date || err.startTime}
          endError={err.endTime}
        />
        <div className="space-y-1.5">
          <Label>{g.mode === "onsite" ? tr("สถานที่", "Venue") : tr("ลิงก์เข้าร่วม", "Joining link")} <span className="text-destructive">*</span></Label>
          <Input
            placeholder={
              g.mode === "onsite"
                ? tr("เช่น ห้องประชุม 301 อาคาร 3", "e.g. Meeting room 301, Building 3")
                : tr("เช่น https://zoom.us/j/123456789", "e.g. https://zoom.us/j/123456789")
            }
            value={g.venue}
            onChange={(e) => set({ venue: e.target.value })}
          />
        </div>
        {g.mode === "onsite" && (
          <>
            <div className="space-y-1.5">
              <Label>{tr("จุดนัดพบ", "Meeting point")} <span className="text-xs text-muted-foreground">{tr("(ไม่บังคับ)", "(optional)")}</span></Label>
              <Input
                placeholder={tr("เช่น หน้าลิฟต์ชั้น 3", "e.g. In front of the 3rd-floor lift")}
                value={g.spot}
                onChange={(e) => set({ spot: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>{tr("ลิงก์แผนที่", "Map link")} <span className="text-xs text-muted-foreground">{tr("(ไม่บังคับ)", "(optional)")}</span></Label>
              <Input placeholder={tr("วางลิงก์ Google Maps", "Paste a Google Maps link")} value={g.mapUrl} onChange={(e) => set({ mapUrl: e.target.value })} />
            </div>
          </>
        )}
      </WizardSection>

      {/* ฟ้าใส: ส่วนผู้จัดและช่องทางติดต่อ */}
      <WizardSection
        title={tr("ผู้จัดและช่องทางติดต่อ", "Organizer and contact")}
        description={tr("ให้ผู้เข้าร่วมรู้ว่าใครจัด และติดต่อใครถ้ามีคำถาม", "Let attendees know who runs the event and who to contact")}
      >
        <div className="space-y-1.5">
          <Label>{tr("ชื่อผู้จัด / หน่วยงาน", "Organizer / unit")} <span className="text-destructive">*</span></Label>
          <Input
            placeholder={tr("เช่น ชมรมคอมพิวเตอร์ คณะเทคโนโลยีสารสนเทศ", "e.g. Computer Club, Faculty of IT")}
            value={g.organizer}
            onChange={(e) => set({ organizer: e.target.value })}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>{tr("เบอร์โทร", "Phone")} <span className="text-xs text-muted-foreground">{tr("(ไม่บังคับ)", "(optional)")}</span></Label>
            <Input placeholder="0X XXX XXXX" value={g.phone} onChange={(e) => set({ phone: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>{tr("อีเมล", "Email")} <span className="text-xs text-muted-foreground">{tr("(ไม่บังคับ)", "(optional)")}</span></Label>
            <Input type="email" placeholder="name@example.com" value={g.email} onChange={(e) => set({ email: e.target.value })} />
          </div>
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="show-contact">{tr("แสดงช่องทางติดต่อบนหน้า Event", "Show contact details on the event page")}</Label>
          <Switch id="show-contact" checked={g.showContact} onCheckedChange={(v) => set({ showContact: v })} />
        </div>
      </WizardSection>

      {/* ฟ้าใส: เปิด / ปิด Event (Event ปิด = รับเฉพาะรายชื่อที่ import) */}
      <AllowListCard />
    </>
  );
}
