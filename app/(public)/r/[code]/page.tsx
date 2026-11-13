// app/(public)/r/[code]/page.tsx
// หน้าลงทะเบียน (ผู้เข้าร่วมสแกน QR ลงทะเบียนที่จอ Kiosk → มาที่ /r/<รหัสงาน> เช่น /r/FIG-1017)
// ไม่ต้อง login · pattern เดียวกับหน้า Kiosk: Server Component ส่ง params (Promise) ต่อให้ client
// ครอบ <Suspense> เพราะโปรเจกต์เปิด cacheComponents (อ่าน params / เวลาปัจจุบันต้องอยู่ใน Suspense)
import { Suspense } from "react";
import { PublicLoading } from "@/components/public/public-ui";
import { RegisterView } from "./RegisterView";

export default function RegisterPage({ params }: { params: Promise<{ code: string }> }) {
  return (
    <Suspense fallback={<PublicLoading />}>
      <RegisterView params={params} />
    </Suspense>
  );
}
