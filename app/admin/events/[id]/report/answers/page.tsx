// app/admin/events/[id]/report/answers/page.tsx
// แท็บ "คำตอบรายคน" (URL: /admin/events/<id>/report/answers)
// ส่วนหัวและแถบแท็บมาจาก report/layout.tsx — ไฟล์นี้แสดงแค่เนื้อหาของแท็บ
import { AnswersView } from "../AnswersView";

// ปิดการตรวจ instant navigation (เหตุผลดู report/layout.tsx) — ต้องคงไว้ กันป้าย Insight ขึ้น
export const instant = false;

export default function Page() {
  return <AnswersView />;
}
