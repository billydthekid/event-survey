// ปิดการตรวจ instant navigation + ครอบด้วย Suspense
// (Wizard เป็น client component อ่าน localStorage — ตามแบบ report/layout.tsx)
import { Suspense } from "react";

export const instant = false;

export default function EditLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<p className="p-8 text-sm text-slate-400">Loading…</p>}>
      {children}
    </Suspense>
  );
}
