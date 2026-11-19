// ฟ้าใส: lib/wizard-lang.ts
// ฟ้าใส: ภาษาของหน้า "ตั้งค่า Event" (Wizard) — ใช้ค่าเดียวกับปุ่ม ไทย / EN ของหน้า Dashboard (currentUser.lang)
// ฟ้าใส: เปลี่ยนภาษาที่ไหนก็เปลี่ยนทั้งแอป (setMyLang ใน app/admin/settings/accountActions.ts)
//
// ฟ้าใส: วิธีใช้ในคอมโพเนนต์:  const tr = useTr();  tr("ถัดไป", "Next")
// ฟ้าใส: ในฟังก์ชันที่ไม่ใช่คอมโพเนนต์ (เช่น ข้อความ error ของกติกา): รับ lang เข้ามา แล้วใช้ makeTr(lang)
import { useStore } from "@/lib/store";
import type { Lang } from "@/types";

// ฟ้าใส: ชนิดของฟังก์ชันเลือกข้อความ tr(ไทย, อังกฤษ)
export type Tr = (th: string, en: string) => string;

/** ฟ้าใส: สร้างตัวเลือกข้อความตามภาษา: tr("ไทย", "English") */
export const makeTr = (lang: Lang): Tr => (th, en) => (lang === "en" ? en : th);

/** ฟ้าใส: ภาษาปัจจุบันของผู้ใช้ (ยังไม่ login / ยังโหลดไม่เสร็จ = ไทย) */
export function useWizardLang(): Lang {
  return useStore((s) => s.currentUser?.lang ?? "th");
}

/** ฟ้าใส: วันที่สั้นตามภาษา: "2026-12-20" → ไทย "20 ธ.ค. 2569" · EN "20 Dec 2026" (ว่าง = "") */
export function fmtDate(iso: string, lang: Lang): string {
  // ฟ้าใส: ไม่มีวันที่ → คืนค่าว่าง
  if (!iso) return "";
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(lang === "en" ? "en-GB" : "th-TH", { day: "numeric", month: "short", year: "numeric" });
}

/** ฟ้าใส: ตัวเลือกข้อความตามภาษาปัจจุบัน */
export function useTr(): Tr {
  return makeTr(useWizardLang());
}
