// app/admin/events/[id]/report/survey/page.tsx
// แท็บ Survey (URL: /admin/events/<id>/report/survey)
// ไม่ต้องอ่าน params ที่นี่ — report/layout.tsx ครอบ Suspense และ ReportShell อ่าน id แล้วส่งข้อมูลผ่าน Context
import { SurveyView } from "../SurveyView";

export default function ReportSurveyPage() {
  return <SurveyView />;
}
