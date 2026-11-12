// app/admin/settings/ProfileCard.tsx
// การ์ด "โปรไฟล์ของฉัน": แก้ได้แค่ชื่อ-นามสกุล / Username, หน่วยงาน, Role แสดงอย่างเดียว
// การ์ดนี้ไม่บันทึกเอง → ค่าในช่องชื่อถูกเก็บที่ page.tsx (ปุ่ม "บันทึกการตั้งค่า" อยู่ที่นั่น)
"use client";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { User } from "@/types";
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
      </div>

      <p className="mt-4 text-xs text-slate-500">{t.profile.lockedHint}</p>
    </SettingsSection>
  );
}
