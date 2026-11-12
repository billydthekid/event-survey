// app/admin/events/[id]/report/participants/page.tsx
// แท็บที่ยังไม่ทำ — แสดง "กำลังพัฒนา" (ส่วนหัวและแถบแท็บมาจาก report/layout.tsx)
import { ComingSoon } from "../ComingSoon";

// ปิดการตรวจ instant navigation (เหตุผลดู report/layout.tsx)
export const instant = false;

export default function Page() {
  return <ComingSoon />;
}
