// app/super/settings/page.tsx
// หน้า Settings ของ Super Admin
// ใช้การ์ดภาษา / เปลี่ยน password และฟังก์ชันบันทึกชุดเดียวกับหน้า Settings ของ Event Admin (app/admin/settings)
// ต่างกันที่: การ์ดโปรไฟล์ (Role = Super Admin, ดูแลทุก Event) + การ์ดข้อมูลระบบ
"use client";
import { useState } from "react";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { KEEP_DAYS } from "@/lib/utils/status";
import { visibleEvents } from "@/lib/utils/stats";
import { User } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Toaster, toast } from "@/components/ui/toast";
import { updateDisplayName } from "@/app/admin/settings/accountActions";
import { Field, LanguageCard, READONLY, SettingsSection } from "@/app/admin/settings/LanguageCard";
import { PasswordCard } from "@/app/admin/settings/PasswordCard";
import { SettingsText, TEXT } from "@/app/admin/settings/text";

export default function SuperSettingsPage() {
  const user = useStore((s) => s.currentUser);
  // ยังไม่ login → super layout พาไป /login เอง
  if (!user) return null;
  return <SettingsContent user={user} />;
}

// ข้อความที่ต่างจากหน้า Event Admin (ที่เหลือใช้ของเดิม)
function superText(lang: User["lang"]): SettingsText {
  const base = TEXT[lang];
  const th = lang === "th";
  return {
    ...base,
    breadcrumb: th ? "ผู้ดูแลระบบ / Settings" : "Administrator / Settings",
    subtitle: th
      ? "ตั้งค่าโปรไฟล์ ภาษา และความปลอดภัยของบัญชี Super Admin"
      : "Manage your Super Admin profile, language and account security",
    profile: {
      ...base.profile,
      hint: th ? "ข้อมูลบัญชีผู้ดูแลระบบ" : "Administrator account details",
      role: "Super Admin",
      lockedHint: th
        ? "Username และหน่วยงานแก้ไขได้ที่หน้าจัดการผู้ใช้"
        : "Username and organization can be changed on the User management page",
    },
    password: {
      ...base.password,
      hint: th
        ? "ลืม password ให้ Super Admin คนอื่นรีเซ็ตให้ที่หน้าจัดการผู้ใช้"
        : "Forgot your password? Ask another Super Admin to reset it",
    },
  };
}

function SettingsContent({ user }: { user: User }) {
  const t = superText(user.lang);
  const th = user.lang === "th";
  const users = useStore((s) => s.users);
  const events = useStore((s) => s.events);
  const logs = useStore((s) => s.logs);

  // ----- ฟอร์มชื่อ (บันทึกเมื่อกดปุ่ม) -----
  const [name, setName] = useState(user.name);
  const [nameError, setNameError] = useState(false);

  const handleSave = () => {
    const result = updateDisplayName(name);
    if (!result.ok) {
      setNameError(result.error === "empty");
      return;
    }
    setName(name.trim());
    toast.add({ type: "success", title: t.actions.saved });
  };

  const handleCancel = () => {
    setName(user.name);
    setNameError(false);
  };

  // ----- ข้อมูลระบบ (อ่านอย่างเดียว) -----
  const deletedCount = events.filter((e) => e.status === "deleted").length;
  const stats = [
    { label: th ? "บัญชีผู้ใช้" : "User accounts", value: users.length, href: "/super/users" },
    { label: th ? "Event ที่ใช้งาน" : "Active events", value: visibleEvents(events).length, href: "/super/events" },
    { label: th ? "รายการที่ถูกลบ" : "Deleted events", value: deletedCount, href: "/super/deleted" },
    { label: th ? "Action Log" : "Action log entries", value: logs.length, href: "/super/action-log" },
  ];

  return (
    <div>
      <p className="text-sm text-slate-400">{t.breadcrumb}</p>
      <h1 className="mt-1 text-3xl font-bold">{t.title}</h1>
      <p className="mt-1 text-slate-500">{t.subtitle}</p>

      <div className="mt-6 grid gap-5">
        {/* ===== โปรไฟล์ ===== */}
        <SettingsSection
          title={t.profile.title}
          hint={t.profile.hint}
          side={<Badge className="mt-3 bg-blue-50 text-blue-700">{t.profile.role}</Badge>}
        >
          <div className="grid gap-5 md:grid-cols-2">
            <Field label={<>{t.profile.nameLabel} <span className="text-red-500">*</span></>}>
              <Input
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setNameError(false);
                }}
                placeholder={t.profile.namePlaceholder}
                aria-invalid={nameError || undefined}
                className="h-10 bg-white"
              />
              {nameError && <p className="mt-1 text-xs text-red-500">{t.profile.nameEmpty}</p>}
            </Field>
            <Field label={t.profile.usernameLabel}>
              <ReadonlyBox value={user.username} />
            </Field>
            <Field label={t.profile.orgLabel}>
              <ReadonlyBox value={user.org} />
            </Field>
            <Field label={th ? "สิทธิ์การดูแล" : "Access"}>
              <ReadonlyBox value={th ? "ทุก Event และทุกบัญชีผู้ใช้" : "All events and all user accounts"} />
            </Field>
          </div>
          <p className="mt-4 text-xs text-slate-500">{t.profile.lockedHint}</p>

          <div className="mt-5 flex justify-end gap-3">
            <Button variant="secondary" onClick={handleCancel} className="h-10 px-4">
              {t.actions.cancel}
            </Button>
            <Button onClick={handleSave} className="h-10 bg-blue-600 px-4 text-white hover:bg-blue-700">
              {t.actions.save}
            </Button>
          </div>
        </SettingsSection>

        {/* ===== ภาษา / password (การ์ดเดียวกับ Event Admin) ===== */}
        <LanguageCard lang={user.lang} t={t} />
        <PasswordCard t={t} />

        {/* ===== ข้อมูลระบบ ===== */}
        <SettingsSection
          title={th ? "ข้อมูลระบบ" : "System"}
          hint={th ? "ภาพรวมของระบบ กดเพื่อไปหน้าที่เกี่ยวข้อง" : "System overview, click to open the related page"}
        >
          <div className="grid gap-3 md:grid-cols-4">
            {stats.map((s) => (
              <Link key={s.href} href={s.href} className="rounded-xl bg-slate-50 p-4 hover:bg-slate-100">
                <p className="text-xs text-slate-500">{s.label}</p>
                <p className="mt-1 text-2xl font-bold">{s.value.toLocaleString("th-TH")}</p>
              </Link>
            ))}
          </div>
          <div className="mt-4 rounded-lg bg-blue-50 px-4 py-3 text-sm text-blue-700">
            {th
              ? `Event ที่ถูกลบจะเก็บไว้ ${KEEP_DAYS} วัน แล้วลบถาวร · Organizer 1 คนดูแลได้ Event เดียว`
              : `Deleted events are kept for ${KEEP_DAYS} days, then removed permanently · Each organizer manages one event`}
          </div>
        </SettingsSection>
      </div>

      <Toaster />
    </div>
  );
}

// กล่องแสดงค่าอ่านอย่างเดียว (แบบเดียวกับหน้า Settings ของ Event Admin)
function ReadonlyBox({ value }: { value: string }) {
  return (
    <div className={`flex w-full items-center rounded-lg border px-2.5 text-base md:text-sm ${READONLY}`}>
      <span className="truncate">{value}</span>
    </div>
  );
}
