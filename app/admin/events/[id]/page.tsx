// app/admin/events/[id]/page.tsx
// Dashboard ของ Event หนึ่งงาน (URL: /admin/events/<id>)
//
// pattern เดียวกับหน้า QR / Kiosk:
// - ไฟล์นี้เป็น Server Component รับ params (Promise) แล้วส่งต่อทั้งก้อน
// - ครอบด้วย <Suspense> เพราะโปรเจกต์เปิด cacheComponents ต้องอ่าน params ภายใน Suspense
import { Suspense } from "react";
import { DashboardView } from "./DashboardView";

export default function EventDashboardPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<p className="text-sm text-slate-400">Loading…</p>}>
      {/* ส่ง Promise ไปทั้งก้อน ให้ DashboardView เป็นคน use() เอง (อยู่ภายใน Suspense) */}
      <DashboardView params={params} />
    </Suspense>
  );
}
