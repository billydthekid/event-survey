// app/admin/events/[id]/qr/page.tsx
// หน้า QR ลงทะเบียน / Survey ของ Event หนึ่งงาน (URL: /admin/events/<id>/qr)
//
// ไฟล์นี้เป็น Server Component (ไม่มี "use client") ทำหน้าที่แค่ "ส่งต่อ"
// - Next.js เวอร์ชันนี้ส่ง params มาเป็น Promise (ยังไม่ใช่ค่าจริงทันที)
// - โปรเจกต์เปิด cacheComponents ไว้ คู่มือจึงให้รอ (อ่าน) params ภายใน <Suspense>
//   ระหว่างรอจะแสดง fallback ก่อน แล้วค่อยแสดง QrView เมื่อได้ค่า
import { Suspense } from "react";
import { QrView } from "./QrView";

export default function QrPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<p className="text-sm text-slate-400">Loading…</p>}>
      {/* ส่ง Promise ไปทั้งก้อน ให้ QrView เป็นคน use() เอง (อยู่ภายใน Suspense) */}
      <QrView params={params} />
    </Suspense>
  );
}
