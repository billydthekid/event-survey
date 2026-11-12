// app/admin/events/[id]/kiosk/page.tsx
// หน้า Kiosk ของ Event หนึ่งงาน (URL: /admin/events/<id>/kiosk)
// หน้านี้ไม่มีในต้นฉบับ design — ออกแบบตามสไตล์หน้า QR
//
// pattern เดียวกับหน้า QR:
// - ไฟล์นี้เป็น Server Component รับ params (เป็น Promise) แล้วส่งต่อทั้งก้อน
// - ครอบด้วย <Suspense> เพราะโปรเจกต์เปิด cacheComponents ต้องอ่าน params ภายใน Suspense
import { Suspense } from "react";
import { KioskView } from "./KioskView";

export default function KioskPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<p className="text-sm text-slate-400">Loading…</p>}>
      <KioskView params={params} />
    </Suspense>
  );
}
