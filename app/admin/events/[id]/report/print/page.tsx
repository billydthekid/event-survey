// app/admin/events/[id]/report/print/page.tsx
// หน้าพิมพ์สรุป Survey (URL: /admin/events/<id>/report/print)
// ไม่ต้องอ่าน params ที่นี่ — report/layout.tsx ครอบ Suspense และ ReportShell อ่าน id แล้วส่งข้อมูลผ่าน Context
import { PrintView } from "../PrintView";

// ปิดการตรวจ instant navigation (เหตุผลดู report/layout.tsx)
export const instant = false;

export default function ReportPrintPage() {
  return <PrintView />;
}
