// ปิดการตรวจ instant navigation + ครอบด้วย Suspense
import { Suspense } from "react";

export const instant = false;

export default function SurveyLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<p className="p-8 text-sm text-slate-400">Loading…</p>}>
      {children}
    </Suspense>
  );
}
