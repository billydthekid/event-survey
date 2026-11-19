// ฟ้าใส: ปิดการตรวจ instant navigation + ครอบด้วย Suspense
// ฟ้าใส: (Wizard เป็น client component อ่าน localStorage — ตามแบบ report/layout.tsx)
import { Suspense } from "react";

// ฟ้าใส: ปิดการตรวจ instant navigation ของ Next.js (หน้านี้อ่าน localStorage)
export const instant = false;

export default function EditLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<p className="p-8 text-sm text-slate-400">Loading…</p>}>
      {children}
    </Suspense>
  );
}
