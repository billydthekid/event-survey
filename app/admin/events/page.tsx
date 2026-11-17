// app/admin/events/page.tsx
// หน้า "Event ของฉัน" ถูกเอาออกแล้ว (กติกา: 1 Event Admin ดูแล 1 Event → ไม่ต้องมีหน้ารายการ)
// เก็บ path นี้ไว้เป็นทางผ่าน เพราะ Wizard ของเพื่อน (wizard-shell.tsx, edit/page.tsx) ยังลิงก์มาที่ /admin/events
// /admin/events → /admin → Dashboard ของ Event ที่ได้รับมอบหมาย (หรือการ์ด "ยังไม่ได้รับมอบหมาย")
import { redirect } from "next/navigation";

export default function AdminEventsRedirect() {
  redirect("/admin");
}
