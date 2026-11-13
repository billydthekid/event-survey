// app/admin/settings/PasswordCard.tsx
// การ์ด "เปลี่ยน password": มีปุ่มของตัวเอง (ไม่เกี่ยวกับปุ่ม "บันทึกการตั้งค่า" ด้านล่าง)
// ไม่แสดง "เปลี่ยนล่าสุด" เพราะไม่มีข้อมูลรองรับ
"use client";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { changeMyPassword } from "./accountActions";
import { Field, SettingsSection } from "./LanguageCard";
import { SettingsText } from "./text";

type FieldKey = "current" | "next" | "confirm";

export function PasswordCard({ t }: { t: SettingsText }) {
  const p = t.password;

  // ค่าใน 3 ช่อง
  const [values, setValues] = useState<Record<FieldKey, string>>({ current: "", next: "", confirm: "" });
  // error แสดงทีละช่อง เช่น { field: "next", message: "password ใหม่ยังไม่ผ่าน: ตัวเลข (0-9)" }
  const [error, setError] = useState<{ field: FieldKey; message: string } | null>(null);
  // ช่องไหนกดปุ่มตาให้ "แสดง" รหัสอยู่ (แยกกันทีละช่อง) เช่น { current: false, next: true, confirm: false }
  const [visible, setVisible] = useState<Record<FieldKey, boolean>>({ current: false, next: false, confirm: false });
  const toggleVisible = (field: FieldKey) => setVisible((old) => ({ ...old, [field]: !old[field] }));

  const change = (field: FieldKey, v: string) => {
    setValues((old) => ({ ...old, [field]: v }));
    setError(null); // พิมพ์ใหม่ → ซ่อน error เดิม
  };

  const handleSubmit = () => {
    const result = changeMyPassword(values);

    if (result.ok) {
      setValues({ current: "", next: "", confirm: "" }); // สำเร็จ → ล้างทุกช่อง
      toast.add({ type: "success", title: p.changed });
      return;
    }

    // แปลงผลจาก accountActions → ข้อความใต้ช่องที่ผิด
    if (result.error === "wrong_current") setError({ field: "current", message: p.wrongCurrent });
    if (result.error === "mismatch") setError({ field: "confirm", message: p.mismatch });
    if (result.error === "weak") {
      // ตัวอย่าง: failed = ["upper", "special"] → "password ใหม่ยังไม่ผ่าน: ตัวพิมพ์ใหญ่ (A-Z), อักขระพิเศษ เช่น ! @ # $"
      setError({ field: "next", message: p.weak(result.failed.map((r) => p.rules[r])) });
    }
  };

  // ช่องกรอก 1 ช่อง + ปุ่มตาด้านขวา (สไตล์เดียวกับหน้า login)
  // visible[field] = false → type="password" (เห็นเป็นจุด), true → type="text" (เห็นตัวอักษรจริง)
  const input = (field: FieldKey, placeholder: string) => (
    <>
      <div className="relative">
        <Input
          type={visible[field] ? "text" : "password"}
          autoComplete={field === "current" ? "current-password" : "new-password"}
          value={values[field]}
          onChange={(e) => change(field, e.target.value)}
          placeholder={placeholder}
          aria-invalid={error?.field === field || undefined}
          className="h-10 bg-white pr-10" // pr-10 = เว้นที่ขวาให้ปุ่มตา ข้อความจะได้ไม่ทับไอคอน
        />
        {/* type="button" สำคัญ: ไม่งั้นถ้าอยู่ใน <form> จะกลายเป็นปุ่ม submit */}
        <button
          type="button"
          onClick={() => toggleVisible(field)}
          aria-label={visible[field] ? p.hidePassword : p.showPassword}
          aria-pressed={visible[field]}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
        >
          {/* กำลังแสดงอยู่ → ไอคอนตาขีดฆ่า (กดเพื่อซ่อน) / กำลังซ่อน → ไอคอนตา (กดเพื่อแสดง) */}
          {visible[field] ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
      {error?.field === field && <p className="mt-1 text-xs text-red-500">{error.message}</p>}
    </>
  );

  return (
    <SettingsSection title={p.title} hint={p.hint}>
      <div className="grid gap-5 md:grid-cols-2">
        {/* password ปัจจุบัน: กินเต็มแถว (ตามรูป) */}
        <div className="md:col-span-2">
          <Field label={p.currentLabel}>{input("current", p.currentPlaceholder)}</Field>
        </div>
        <Field label={p.nextLabel}>{input("next", p.nextPlaceholder)}</Field>
        <Field label={p.confirmLabel}>{input("confirm", p.confirmPlaceholder)}</Field>
      </div>

      {/* กฎเป็นข้อความบรรทัดเดียวตามรูป */}
      <p className="mt-3 text-xs text-slate-500">{p.rulesHint}</p>

      <div className="mt-4 flex justify-end">
        <Button variant="outline" onClick={handleSubmit} className="h-10 bg-white px-4">
          {p.submit}
        </Button>
      </div>
    </SettingsSection>
  );
}
