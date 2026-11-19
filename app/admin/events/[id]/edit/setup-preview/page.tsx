// /admin/events/[id]/edit/setup-preview — ตั้งค่า Event ขั้นที่ 5: Preview และเผยแพร่
// หน้าของแต่ละขั้นแยกไฟล์ → URL เปลี่ยนตามขั้น · logic ทั้งหมดอยู่ที่ components/event-wizard/event-setup-wizard.tsx
import { EventSetupWizard } from "@/components/event-wizard/event-setup-wizard";

export default function SetupStep5Page() {
  return <EventSetupWizard step={5} />;
}
