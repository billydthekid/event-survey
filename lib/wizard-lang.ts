// lib/wizard-lang.ts
// ภาษาของหน้า "ตั้งค่า Event" (Wizard) — ใช้ค่าเดียวกับปุ่ม ไทย / EN ของหน้า Dashboard (currentUser.lang)
// เปลี่ยนภาษาที่ไหนก็เปลี่ยนทั้งแอป (setMyLang ใน app/admin/settings/accountActions.ts)
//
// วิธีใช้ในคอมโพเนนต์:  const tr = useTr();  tr("ถัดไป", "Next")
// ในฟังก์ชันที่ไม่ใช่คอมโพเนนต์ (เช่น ข้อความ error ของกติกา): รับ lang เข้ามา แล้วใช้ makeTr(lang)
import { useStore } from "@/lib/store";
import type { Lang } from "@/types";

export type Tr = (th: string, en: string) => string;

/** สร้างตัวเลือกข้อความตามภาษา: tr("ไทย", "English") */
export const makeTr = (lang: Lang): Tr => (th, en) => (lang === "en" ? en : th);

/** ภาษาปัจจุบันของผู้ใช้ (ยังไม่ login / ยังโหลดไม่เสร็จ = ไทย) */
export function useWizardLang(): Lang {
  return useStore((s) => s.currentUser?.lang ?? "th");
}

/** วันที่สั้นตามภาษา: "2026-12-20" → ไทย "20 ธ.ค. 2569" · EN "20 Dec 2026" (ว่าง = "") */
export function fmtDate(iso: string, lang: Lang): string {
  if (!iso) return "";
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(lang === "en" ? "en-GB" : "th-TH", { day: "numeric", month: "short", year: "numeric" });
}

/** ตัวเลือกข้อความตามภาษาปัจจุบัน */
export function useTr(): Tr {
  return makeTr(useWizardLang());
}
