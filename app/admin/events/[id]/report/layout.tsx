// app/admin/events/[id]/report/layout.tsx
// กรอบที่ใช้ร่วมกันของทุกแท็บใน Report (Overview / ผู้เข้าร่วม / Survey / คำตอบรายคน)
// - Server Component: ครอบ ReportShell ด้วย <Suspense>
// - children = เนื้อหาของแท็บที่เปิดอยู่ (page.tsx ของแต่ละแท็บ)
//
// ต่างจากหน้า QR/Kiosk: ไม่ส่ง params (Promise) ลงไปให้ client
// เพราะเมื่อส่ง params ของ "layout" ให้ client แล้ว use() ทดสอบแล้วค้างที่ Loading… ตลอด
// จึงให้ ReportShell อ่าน id เองด้วย useParams() ตามที่คู่มือเสนอเป็นทางเลือก
// (useParams ต้องอยู่ใน <Suspense> เมื่อเปิด cacheComponents — จึงยังครอบ Suspense ไว้)
import { Suspense } from "react";
import { ReportShell } from "./ReportShell";

// ปิดการตรวจ instant navigation ของ Report: ReportShell (client) รอ useParams + ข้อมูลจาก localStorage
// ตอน prerender จึงไม่ render แท็บลูก → Next แจ้ง "dropped segment" (หน้านี้รอโหลดได้อยู่แล้ว)
export const instant = false;

// LayoutProps<"..."> เป็น type ที่ Next.js สร้างให้อัตโนมัติตาม route (คู่มือแนะนำให้ใช้กับ layout)
export default function ReportLayout(props: LayoutProps<"/admin/events/[id]/report">) {
  return (
    <Suspense fallback={<p className="text-sm text-slate-400">Loading…</p>}>
      <ReportShell>{props.children}</ReportShell>
    </Suspense>
  );
}
