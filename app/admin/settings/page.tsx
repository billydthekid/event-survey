// app/admin/settings/page.tsx
// หน้า Settings ของ Event Admin (ต้นฉบับ docs/figma/setting.png)
// ขั้น a: หัวหน้า + การ์ดภาษา | ขั้นถัดไปจะเพิ่มการ์ดโปรไฟล์ และการ์ดเปลี่ยนรหัสผ่าน
"use client";
import { useStore } from "@/lib/store";
import { Lang } from "@/types";
import { LanguageCard } from "./LanguageCard";
import { TEXT } from "./text";

export default function SettingsPage() {
  const user = useStore((s) => s.currentUser);

  // ภาษาจาก currentUser.lang (ก่อนโหลดเสร็จ = "th" เหมือนหน้าอื่น)
  const lang: Lang = user?.lang ?? "th";
  const t = TEXT[lang];

  // ยังไม่มีคน login → admin layout จะพาไป /login เอง ไม่ต้องแสดงอะไร
  if (!user) return null;

  return (
    <div>
      {/* หัวหน้า: breadcrumb เป็นข้อความเฉยๆ (ยังไม่มีหน้า "บัญชีของฉัน") */}
      <p className="text-sm text-slate-600">{t.breadcrumb}</p>
      <h1 className="mt-3 text-3xl font-bold">{t.title}</h1>
      <p className="mt-1 text-sm text-slate-500">{t.subtitle}</p>

      <div className="mt-6 grid gap-5">
        <LanguageCard lang={lang} t={t} />
      </div>
    </div>
  );
}
