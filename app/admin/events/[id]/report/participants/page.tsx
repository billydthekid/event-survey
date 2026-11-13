// app/admin/events/[id]/report/participants/page.tsx
// แท็บ "ผู้เข้าร่วม" (URL: /admin/events/<id>/report/participants)
// ส่วนหัวและแถบแท็บมาจาก report/layout.tsx — ไฟล์นี้แสดงแค่เนื้อหาของแท็บ
import { ParticipantsView } from "../ParticipantsView";

// ปิดการตรวจ instant navigation (เหตุผลดู report/layout.tsx) — ต้องคงไว้ กันป้าย Insight ขึ้น
export const instant = false;

export default function Page() {
  return <ParticipantsView />;
}
