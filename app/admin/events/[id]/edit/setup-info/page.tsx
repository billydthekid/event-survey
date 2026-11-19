// /admin/events/[id]/edit/setup-info — ตั้งค่า Event ขั้นที่ 1: ข้อมูลทั่วไป
// หน้าของแต่ละขั้นแยกไฟล์ → URL เปลี่ยนตามขั้น · logic ทั้งหมดอยู่ที่ components/event-wizard/event-setup-wizard.tsx
import { EventSetupWizard } from "@/components/event-wizard/event-setup-wizard";

export default function SetupStep1Page() {
  return <EventSetupWizard step={1} />;
}
