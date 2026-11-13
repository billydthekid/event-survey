// app/(public)/s/[code]/page.tsx
// หน้าแบบประเมิน (ผู้เข้าร่วมสแกน QR แบบประเมินที่จอ Kiosk → มาที่ /s/<รหัสงาน> เช่น /s/FIG-1017)
// ไม่ต้อง login · ครอบ <Suspense> เหมือนหน้าลงทะเบียน (cacheComponents)
import { Suspense } from "react";
import { PublicLoading } from "@/components/public/public-ui";
import { SurveyView } from "./SurveyView";

export default function SurveyPage({ params }: { params: Promise<{ code: string }> }) {
  return (
    <Suspense fallback={<PublicLoading />}>
      <SurveyView params={params} />
    </Suspense>
  );
}
