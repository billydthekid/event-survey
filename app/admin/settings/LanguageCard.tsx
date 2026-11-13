// app/admin/settings/LanguageCard.tsx
// การ์ด "ภาษาที่แสดง": เลือกภาษา (มีผลทันที)
"use client";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Lang } from "@/types";
import { setMyLang } from "./accountActions";
import { LANG_OPTIONS, SettingsText } from "./text";

export function LanguageCard({ lang, t }: { lang: Lang; t: SettingsText }) {
  return (
    <SettingsSection title={t.language.title} hint={t.language.hint}>
      <div className="grid gap-5 md:grid-cols-2">
        <Field label={t.language.langLabel}>
          {/* items: ให้ช่องแสดง "ภาษาไทย" แทนค่า "th" */}
          <Select
            value={lang}
            items={LANG_OPTIONS}
            // เลือกแล้วบันทึกลงบัญชีทันที → ทั้งหน้า + Topbar + Sidebar เปลี่ยนภาษาตาม
            onValueChange={(v) => v && setMyLang(v as Lang)}
          >
            <SelectTrigger className="h-10 w-full bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LANG_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </div>
    </SettingsSection>
  );
}

// ============ ชิ้นส่วนที่การ์ดอื่นจะใช้ร่วม (ขั้น b, c) ============

// สไตล์ช่องอ่านอย่างเดียว: พื้นเทา ไม่มีกรอบเด่น (ตามรูปช่อง Username / หน่วยงาน)
export const READONLY = "h-10 cursor-default border-transparent bg-slate-100 focus-visible:ring-0";

// การ์ด 1 ส่วน: ซ้าย = หัวข้อ + คำอธิบาย, ขวา = ช่องกรอก
export function SettingsSection({
  title,
  hint,
  side,
  children,
}: {
  title: string;
  hint: string;
  side?: React.ReactNode; // ของเพิ่มใต้คำอธิบาย เช่น ป้าย role
  children: React.ReactNode;
}) {
  return (
    <Card className="grid gap-6 rounded-2xl px-6 py-6 ring-slate-200 md:grid-cols-[minmax(0,1fr)_minmax(0,2.4fr)]">
      <div>
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="mt-1 text-xs text-slate-500">{hint}</p>
        {side}
      </div>
      <div>{children}</div>
    </Card>
  );
}

// ป้ายชื่อ + ช่องกรอก 1 ช่อง
export function Field({ label, children }: { label: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-sm font-semibold">{label}</p>
      {children}
    </div>
  );
}
