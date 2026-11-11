// app/admin/events/[id]/report/page.tsx
// แท็บ Overview (URL: /admin/events/<id>/report)
// ไม่ต้องอ่าน params ที่นี่ — layout.tsx อ่านแล้ว และส่ง event/ข้อมูลมาให้ผ่าน Context
import { OverviewView } from "./OverviewView";

export default function ReportOverviewPage() {
  return <OverviewView />;
}
