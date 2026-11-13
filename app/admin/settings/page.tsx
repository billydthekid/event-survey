// app/admin/settings/page.tsx
// หน้า Settings ของ Event Admin (ต้นฉบับ docs/figma/setting.png)
// ขั้น a: หัวหน้า + การ์ดภาษา | ขั้น b: การ์ดโปรไฟล์ + ปุ่ม ยกเลิก/บันทึก (ใช้กับชื่ออย่างเดียว)
// ขั้น c: การ์ดเปลี่ยน password (มีปุ่มของตัวเอง)
"use client";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { Lang, User } from "@/types";
import { Button } from "@/components/ui/button";
import { Toaster, toast } from "@/components/ui/toast";
import { updateDisplayName } from "./accountActions";
import { LanguageCard } from "./LanguageCard";
import { PasswordCard } from "./PasswordCard";
import { ProfileCard } from "./ProfileCard";
import { TEXT } from "./text";

export default function SettingsPage() {
  const user = useStore((s) => s.currentUser);

  // ยังไม่มีคน login → admin layout จะพาไป /login เอง ไม่ต้องแสดงอะไร
  if (!user) return null;

  // แยกเป็นคอมโพเนนต์ลูก: สร้างก็ต่อเมื่อมี user แล้ว
  // → useState(user.name) ได้ชื่อจริงเสมอ (ถ้าสร้างก่อน store โหลดเสร็จ จะค้างเป็น "")
  return <SettingsContent user={user} />;
}

function SettingsContent({ user }: { user: User }) {
  const lang: Lang = user.lang;
  const t = TEXT[lang];

  // ----- ฟอร์มชื่อ (ยังไม่บันทึกจนกดปุ่ม) -----
  const [name, setName] = useState(user.name);   // เช่น "ณัฐพล ใจดี"
  const [nameError, setNameError] = useState(false);

  const handleNameChange = (v: string) => {
    setName(v);
    setNameError(false); // เริ่มพิมพ์ใหม่ → ซ่อนข้อความ error
  };

  // บันทึก: ส่งชื่อให้ updateDisplayName ตรวจและบันทึก
  // ตัวอย่าง: "  ณัฐพล ใจดีมาก " → บันทึก "ณัฐพล ใจดีมาก" แล้วช่องแสดงค่าที่ตัดช่องว่างแล้ว
  const handleSave = () => {
    const result = updateDisplayName(name);
    if (!result.ok) {
      setNameError(result.error === "empty");
      return;
    }
    setName(name.trim());
    toast.add({ type: "success", title: t.actions.saved });
  };

  // ยกเลิก: คืนค่าช่องชื่อเป็นค่าที่บันทึกไว้ แล้วอยู่หน้าเดิม
  const handleCancel = () => {
    setName(user.name);
    setNameError(false);
  };

  return (
    <div>
      {/* หัวหน้า: breadcrumb เป็นข้อความเฉยๆ (ยังไม่มีหน้า "บัญชีของฉัน") */}
      <p className="text-sm text-slate-600">{t.breadcrumb}</p>
      <h1 className="mt-3 text-3xl font-bold">{t.title}</h1>
      <p className="mt-1 text-sm text-slate-500">{t.subtitle}</p>

      <div className="mt-6 grid gap-5">
        <ProfileCard user={user} name={name} onNameChange={handleNameChange} nameError={nameError} t={t} />
        <LanguageCard lang={lang} t={t} />
        <PasswordCard t={t} />
      </div>

      {/* ปุ่มล่าง: ใช้กับชื่ออย่างเดียว (ภาษาบันทึกทันทีที่เลือก) */}
      <div className="mt-5 flex justify-end gap-3">
        <Button variant="secondary" onClick={handleCancel} className="h-10 px-4">
          {t.actions.cancel}
        </Button>
        <Button onClick={handleSave} className="h-10 bg-blue-600 px-4 text-white hover:bg-blue-700">
          {t.actions.save}
        </Button>
      </div>

      {/* ที่แสดงข้อความแจ้ง (ทำแบบเดียวกับ ReportShell เพราะ layout ยังไม่มี Toaster) */}
      <Toaster />
    </div>
  );
}
