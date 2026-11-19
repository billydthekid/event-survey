"use client";
// /admin/events/[id]/edit — ทางเข้า "ตั้งค่า Event" (ปุ่มใน Sidebar, หลังสร้าง Event ฯลฯ)
// ไม่มีเนื้อหาเอง: พาไปหน้าของขั้นที่ทำค้างไว้ (/edit/setup-…) · Event อื่น / ยังไม่เคยเปิด → ขั้นที่ 1
// ถ้าขั้นที่จำไว้ยังไปไม่ได้ (ขั้นก่อนหน้ายังไม่ครบ) หน้าของขั้นนั้นจะพากลับไปขั้นแรกที่ยังไม่ครบเอง
import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useWizardStore } from "@/lib/wizard-store";
import { stepHref } from "@/components/event-wizard/wizard-shell";

export default function EditEventEntryPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  useEffect(() => {
    // wizard store อ่าน localStorage ตอนสร้าง store แล้ว → อ่านค่าได้เลย
    const s = useWizardStore.getState();
    const lastStep = s.draft.id === id ? s.step : 1; // step ที่จำไว้เป็นของ Event ที่เปิดล่าสุดเท่านั้น
    router.replace(stepHref(id, lastStep));
  }, [id, router]);

  return null;
}
