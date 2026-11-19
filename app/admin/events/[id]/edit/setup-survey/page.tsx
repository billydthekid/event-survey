// /admin/events/[id]/edit/setup-survey — ตั้งค่า Event ขั้นที่ 4: Survey
// หน้าของแต่ละขั้นแยกไฟล์ → URL เปลี่ยนตามขั้น · logic ทั้งหมดอยู่ที่ components/event-wizard/event-setup-wizard.tsx
import { EventSetupWizard } from "@/components/event-wizard/event-setup-wizard";

export default function SetupStep4Page() {
  return <EventSetupWizard step={4} />;
}
