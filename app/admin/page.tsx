// app/admin/page.tsx
// /admin ไม่มีหน้าของตัวเองแล้ว → ส่งต่อไป "Event ของฉัน" (/admin/events) ทันที
// เหตุผล: หน้า Login ส่ง Event Admin มาที่ /admin หลังล็อกอิน จึงต้องมีหน้านี้ไว้ ไม่ให้เจอ 404
// เป็น Server Component (ไม่มี "use client") แบบเดียวกับ app/page.tsx
// - ยังไม่ล็อกอิน: /admin → /admin/events → ด่านใน admin/layout.tsx พาไป /login
// - ล็อกอินเป็น event admin แล้ว: /admin → /admin/events แล้วจบที่นั่น
import { redirect } from "next/navigation";

export default function AdminIndex() {
  redirect("/admin/events");
}
