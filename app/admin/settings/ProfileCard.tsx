// app/admin/settings/ProfileCard.tsx
// การ์ด "โปรไฟล์ของฉัน": แก้ได้แค่ชื่อ-นามสกุล / Username, หน่วยงาน, Role, Event ที่ดูแล แสดงอย่างเดียว
// การ์ดนี้ไม่บันทึกเอง → ค่าในช่องชื่อถูกเก็บที่ page.tsx (ปุ่ม "บันทึกการตั้งค่า" อยู่ที่นั่น)
"use client";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useStore } from "@/lib/store";
import { Event, User } from "@/types";
import { Field, READONLY, SettingsSection } from "./LanguageCard";
import { SettingsText } from "./text";

export function ProfileCard({
  user,
  name,
  onNameChange,
  nameError,
  t,
}: {
  user: User;
  name: string;                       // ค่าในช่องตอนนี้ (ยังไม่บันทึก)
  onNameChange: (v: string) => void;
  nameError: boolean;                 // true = กดบันทึกแล้วชื่อว่าง
  t: SettingsText;
}) {
  // ดึง events ทั้งก้อนจาก store แล้วค่อยกรองข้างนอก
  // (ถ้ากรองใน selector จะได้ array ใหม่ทุกครั้ง → zustand สั่งวาดใหม่วนไม่จบ)
  const events = useStore((s) => s.events);

  // Event ที่ฉันได้รับมอบหมาย และยังไม่ถูกลบ
  // ตัวอย่าง: user u-event-2 → ["วันเปิดบ้าน 2569", "เส้นทางอาชีพดิจิทัล"]
  const myEvents = events.filter((e) => e.adminIds.includes(user.id) && e.status !== "deleted");

  // ชื่อตามภาษา: EN และมีชื่ออังกฤษ → ใช้ชื่ออังกฤษ ไม่งั้นใช้ชื่อไทย (แบบเดียวกับ Sidebar)
  const eventName = (e: Event) => (user.lang === "en" && e.name.en ? e.name.en : e.name.th);

  return (
    <SettingsSection
      title={t.profile.title}
      hint={t.profile.hint}
      side={<Badge className="mt-3 bg-green-50 text-green-700">{t.profile.role}</Badge>}
    >
      <div className="grid gap-5 md:grid-cols-2">
        <Field
          label={
            <>
              {t.profile.nameLabel} <span className="text-red-500">*</span>
            </>
          }
        >
          <Input
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder={t.profile.namePlaceholder}
            aria-invalid={nameError || undefined}
            className="h-10 bg-white"
          />
          {nameError && <p className="mt-1 text-xs text-red-500">{t.profile.nameEmpty}</p>}
        </Field>

        <Field label={t.profile.usernameLabel}>
          <Input readOnly value={user.username} className={READONLY} />
        </Field>

        {/* หน่วยงาน: กินเต็มแถว (ตามรูป) */}
        <div className="md:col-span-2">
          <Field label={t.profile.orgLabel}>
            <Input readOnly value={user.org} className={READONLY} />
          </Field>
        </div>

        {/* Event ที่ดูแล: อ่านอย่างเดียว กินเต็มแถว (ตามรูป) */}
        <div className="md:col-span-2">
          <Field label={t.profile.eventsLabel}>
            {myEvents.length === 0 ? (
              <p className="text-sm text-slate-400">{t.profile.noEvents}</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {myEvents.map((e) => (
                  <span key={e.id} className="rounded-full bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700">
                    {eventName(e)}
                  </span>
                ))}
              </div>
            )}
          </Field>
        </div>
      </div>

      <p className="mt-4 text-xs text-slate-500">{t.profile.lockedHint}</p>
    </SettingsSection>
  );
}
