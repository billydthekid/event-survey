// ฟ้าใส: /admin/events/[id]/edit/setup-form — ตั้งค่า Event ขั้นที่ 3: ฟอร์มลงทะเบียน
// ฟ้าใส: หน้าของแต่ละขั้นแยกไฟล์ → URL เปลี่ยนตามขั้น · logic ทั้งหมดอยู่ที่ components/event-wizard/event-setup-wizard.tsx
import { EventSetupWizard } from "@/components/event-wizard/event-setup-wizard";

export default function SetupStep3Page() {
  return <EventSetupWizard step={3} />;
}
