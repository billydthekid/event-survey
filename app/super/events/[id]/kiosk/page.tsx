// app/super/events/[id]/kiosk/page.tsx
// จอ Kiosk สำหรับ Super Admin (URL: /super/events/<id>/kiosk)
// Super Admin เปิดจอ Kiosk ของทุก Event ได้ โดยไม่ต้องเป็นผู้ดูแลงานนั้น (ตาม recap: "ดู QR · เปิดจอ Kiosk")
// ใช้จอเดียวกับฝั่ง Event Admin (/admin/events/<id>/kiosk) → หน้าตาและกฎการแสดง QR เหมือนกันทุกอย่าง
//
// ครอบด้วย <Suspense> เพราะโปรเจกต์เปิด cacheComponents ต้องอ่าน params ภายใน Suspense (เหมือนหน้า Kiosk ฝั่ง /admin)
import { Suspense } from "react";
import { KioskView } from "@/app/admin/events/[id]/kiosk/KioskView";

export default function SuperKioskPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<p className="text-sm text-slate-400">Loading…</p>}>
      <KioskView params={params} />
    </Suspense>
  );
}
