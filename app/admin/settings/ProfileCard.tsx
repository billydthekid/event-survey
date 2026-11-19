// app/admin/settings/ProfileCard.tsx
// การ์ด "โปรไฟล์ของฉัน": แก้ได้แค่ชื่อ-นามสกุล / Username, หน่วยงาน, Role, Event ที่ได้รับมอบหมาย แสดงอย่างเดียว
// การ์ดนี้ไม่บันทึกเอง → ค่าในช่องชื่อถูกเก็บที่ page.tsx (ปุ่ม "บันทึกการตั้งค่า" อยู่ที่นั่น)
"use client";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Event, User } from "@/types";
import { useAssignedEvent } from "../assignedEvent";
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
  // Event ที่ได้รับมอบหมาย: ใช้ hook เดียวกับ Sidebar → แสดงงานเดียวกันเสมอ
  // ตัวอย่าง: Pichapa.organizer (ข้อมูลเก่ามี 2 งาน) → "เส้นทางอาชีพดิจิทัล" งานเดียว ตามกติกาใน assignedEvent.ts
  // ⚠️ hook อ่าน currentUser จาก store เอง ไม่ได้ใช้ prop user
  //    ตอนนี้ page.tsx ส่ง currentUser เข้ามา จึงเป็นคนเดียวกัน — ถ้าวันหลังส่ง user คนอื่นมา จะแสดงงานผิดคน
  const assigned = useAssignedEvent();

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
          <ReadonlyBox value={user.username} />
        </Field>

        {/* หน่วยงาน: กินเต็มแถว (ตามรูป) */}
        <div className="md:col-span-2">
          <Field label={t.profile.orgLabel}>
            <ReadonlyBox value={user.org} />
          </Field>
        </div>

        {/* Event ที่ได้รับมอบหมาย: อ่านอย่างเดียว กินเต็มแถว (ตามรูป)
            loading → เว้นว่าง (กันข้อความ "ยังไม่ได้รับมอบหมาย" แวบขึ้นมา) | none → ข้อความสีเทา | ok → ชิปเดียว */}
        <div className="md:col-span-2">
          <Field label={t.profile.eventsLabel}>
            {assigned.status === "none" && <p className="text-sm text-slate-400">{t.profile.noEvents}</p>}
            {assigned.status === "ok" && (
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700">
                  {eventName(assigned.event)}
                </span>
              </div>
            )}
          </Field>
        </div>
      </div>

      <p className="mt-4 text-xs text-slate-500">{t.profile.lockedHint}</p>
    </SettingsSection>
  );
}

// ============ กล่องแสดงค่าอ่านอย่างเดียว (Username / หน่วยงาน) ============
// เดิมใช้ <Input readOnly> → คลิกแล้วโฟกัสได้ มีเคอร์เซอร์พิมพ์กะพริบ ทั้งที่แก้ไม่ได้
// เปลี่ยนเป็น <div> ธรรมดา: โฟกัสไม่ได้ (ไม่มีเคอร์เซอร์ / Tab ข้ามไป) แต่ยังลากเลือก + copy ข้อความได้
// หน้าตาเหมือนช่องเดิม: ใช้ READONLY (h-10, พื้นเทา, ไม่มีกรอบ) + ขอบมน/ระยะห่าง/ขนาดตัวอักษรแบบ Input
// รับ: value = ข้อความที่จะแสดง เช่น "event.admin1"
function ReadonlyBox({ value }: { value: string }) {
  return (
    <div className={`flex w-full items-center rounded-lg border px-2.5 text-base md:text-sm ${READONLY}`}>
      {/* truncate: ข้อความยาวเกินช่อง → ตัดเป็น ... เหมือน input เดิมที่ไม่ขึ้นบรรทัดใหม่ */}
      <span className="truncate">{value}</span>
    </div>
  );
}
