// app/super/settings/page.tsx
// หน้า Settings ของ Super Admin
// การ์ดภาษา / เปลี่ยน password ใช้ชุดเดียวกับหน้า Settings ของ Event Admin (app/admin/settings)
// ต่างกันที่การ์ดโปรไฟล์: Super Admin แก้ชื่อ, Username และหน่วยงานของตัวเองได้
"use client";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { makeUsername } from "@/lib/utils/username";
import { User } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Toaster, toast } from "@/components/ui/toast";
import { Field, LanguageCard, READONLY, SettingsSection } from "@/app/admin/settings/LanguageCard";
import { PasswordCard } from "@/app/admin/settings/PasswordCard";
import { SettingsText, TEXT } from "@/app/admin/settings/text";

export default function SuperSettingsPage() {
  const user = useStore((s) => s.currentUser);
  // ยังไม่ login → super layout พาไป /login เอง
  if (!user) return null;
  // key = id → สลับบัญชีแล้วฟอร์มเริ่มใหม่จากข้อมูลของคนนั้น
  return <SettingsContent key={user.id} user={user} />;
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
        ? "แก้ชื่อ, Username และหน่วยงานได้ · ถ้าเปลี่ยน Username ครั้งถัดไปให้ล็อกอินด้วยชื่อใหม่"
        : "You can edit your name, username and organization · Sign in with the new username next time",
    },
    password: {
      ...base.password,
      hint: th
        ? "ลืม password ให้ Super Admin คนอื่นรีเซ็ตให้ที่หน้าจัดการผู้ใช้"
        : "Forgot your password? Ask another Super Admin to reset it",
    },
  };
}

// ส่วนหน้าของ Username (ตัด .admin ท้ายออก) เช่น "thanaphat.admin" → "thanaphat"
const baseOf = (username: string) => username.replace(/\.(admin|organizer|super|event)$/, "");

type Errors = { name?: string; username?: string; org?: string };

function SettingsContent({ user }: { user: User }) {
  const t = superText(user.lang);
  const th = user.lang === "th";
  const users = useStore((s) => s.users);
  const addLog = useStore((s) => s.addLog);

  // ----- ฟอร์ม (บันทึกเมื่อกดปุ่ม) -----
  const [name, setName] = useState(user.name);
  const [base, setBase] = useState(baseOf(user.username));
  const [org, setOrg] = useState(user.org);
  const [errors, setErrors] = useState<Errors>({});

  const newUsername = makeUsername(base, user.role);
  const changed =
    name.trim() !== user.name || newUsername !== user.username || org.trim() !== user.org;

  const handleSave = () => {
    const e: Errors = {};
    if (name.trim() === "") e.name = t.profile.nameEmpty;
    if (base.trim() === "") e.username = th ? "กรุณากรอก Username" : "Please enter a username";
    else if (!/^[a-zA-Z0-9._-]+$/.test(base.trim()))
      e.username = th ? "ใช้ได้เฉพาะ a-z, 0-9, จุด, ขีด" : "Use only a-z, 0-9, dot, dash";
    else if (users.some((u) => u.id !== user.id && u.username === newUsername))
      e.username = th ? "Username นี้มีคนใช้แล้ว" : "This username is already taken";
    if (org.trim() === "") e.org = th ? "กรุณากรอกหน่วยงาน" : "Please enter an organization";
    setErrors(e);
    if (Object.keys(e).length > 0) return;

    // อัปเดตทั้ง currentUser และ users[] ให้ตรงกัน (login ตรวจจาก users[])
    const patch = { name: name.trim(), username: newUsername, org: org.trim() };
    useStore.setState((s) => ({
      currentUser: s.currentUser ? { ...s.currentUser, ...patch } : s.currentUser,
      users: s.users.map((u) => (u.id === user.id ? { ...u, ...patch } : u)),
    }));
    addLog("update_profile", "user", user.id, "แก้ไขโปรไฟล์ของตัวเอง");
    setName(patch.name);
    setOrg(patch.org);
    toast.add({ type: "success", title: t.actions.saved });
  };

  const handleCancel = () => {
    setName(user.name);
    setBase(baseOf(user.username));
    setOrg(user.org);
    setErrors({});
  };

  const err = (msg?: string) => msg && <p className="mt-1 text-xs text-red-500">{msg}</p>;

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
                onChange={(e) => { setName(e.target.value); setErrors((x) => ({ ...x, name: undefined })); }}
                placeholder={t.profile.namePlaceholder}
                aria-invalid={!!errors.name || undefined}
                className="h-10 bg-white"
              />
              {err(errors.name)}
            </Field>

            <Field label={<>{t.profile.usernameLabel} <span className="text-red-500">*</span></>}>
              <div className="flex h-10 items-center rounded-lg border border-input bg-white pr-3 focus-within:ring-2 focus-within:ring-blue-500">
                <input
                  value={base}
                  onChange={(e) => { setBase(e.target.value); setErrors((x) => ({ ...x, username: undefined })); }}
                  aria-invalid={!!errors.username || undefined}
                  className="h-full w-full bg-transparent px-2.5 text-sm outline-none"
                />
                <span className="text-sm text-slate-400">.admin</span>
              </div>
              {err(errors.username)}
            </Field>

            <Field label={<>{t.profile.orgLabel} <span className="text-red-500">*</span></>}>
              <Input
                value={org}
                onChange={(e) => { setOrg(e.target.value); setErrors((x) => ({ ...x, org: undefined })); }}
                aria-invalid={!!errors.org || undefined}
                className="h-10 bg-white"
              />
              {err(errors.org)}
            </Field>

            <Field label={th ? "สิทธิ์การดูแล" : "Access"}>
              <div className={`flex w-full items-center rounded-lg border px-2.5 text-sm ${READONLY}`}>
                {th ? "ทุก Event และทุกบัญชีผู้ใช้" : "All events and all user accounts"}
              </div>
            </Field>
          </div>
          <p className="mt-4 text-xs text-slate-500">{t.profile.lockedHint}</p>

          <div className="mt-5 flex justify-end gap-3">
            <Button variant="secondary" onClick={handleCancel} disabled={!changed} className="h-10 px-4">
              {t.actions.cancel}
            </Button>
            <Button onClick={handleSave} disabled={!changed} className="h-10 bg-blue-600 px-4 text-white hover:bg-blue-700">
              {t.actions.save}
            </Button>
          </div>
        </SettingsSection>

        {/* ===== ภาษา / password (การ์ดเดียวกับ Event Admin) ===== */}
        <LanguageCard lang={user.lang} t={t} />
        <PasswordCard t={t} />
      </div>

      <Toaster />
    </div>
  );
}
