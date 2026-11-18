// app/admin/events/[id]/eventAccess.ts
// ด่านสิทธิ์ของหน้าที่แสดงข้อมูล Event (ใช้ร่วมกัน: Report และ Dashboard)
// รวมกฎไว้ที่เดียว → ทุกหน้าตัดสิน "เห็นได้ไหม / มีข้อมูลไหม" เหมือนกันเสมอ
// เป็น hook (เรียก useStore) จึงใช้ได้เฉพาะใน Client Component
import { useMemo } from "react";
import { useStore } from "@/lib/store";
import { useWizardStore } from "@/lib/wizard-store";
import { Event } from "@/types";
import { ReportData } from "./report/mockData";
import { buildReportData } from "./report/reportData";

// ผลของการตรวจ 4 แบบ
// - loading : store ยังโหลดจาก localStorage ไม่เสร็จ → ยังไม่ตัดสินอะไร (กันขึ้น "ไม่พบ" แวบหนึ่ง)
// - denied  : ด่านที่ 1 ไม่ผ่าน — ไม่พบ / ถูกลบ / ไม่ได้ login / ไม่ได้รับมอบหมาย → ห้ามแสดงข้อมูล Event
// - nodata  : ด่านที่ 2 — ผ่านสิทธิ์ แต่ยังไม่เริ่มงาน (Draft / Scheduled) → มี event แต่ไม่มี data
// - ok      : ผ่านทั้งสองด่าน (Active / Ended) → มีทั้ง event และ data (data อาจว่าง เช่น ยังไม่มีคนลงทะเบียน)
export type EventAccess =
  | { status: "loading" }
  | { status: "denied" }
  | { status: "nodata"; event: Event }
  | { status: "ok"; event: Event; data: ReportData };

// useEventAccess: รับ id ของ Event → คืนผลการตรวจข้างบน
// ตัวอย่าง (login เป็น u-event-1):
//   "e-workshop" (active, ได้รับมอบหมาย)       → { status: "ok", event, data }  (46 คนลงทะเบียน / 31 คำตอบ)
//   "e-comm"     (ของ u-event-3)               → { status: "denied" }
//   Event draft ที่ได้รับมอบหมาย                → { status: "nodata", event }
export function useEventAccess(id: string): EventAccess {
  const user = useStore((s) => s.currentUser);
  const hydrated = useStore((s) => s.hydrated);
  const event = useStore((s) => s.events.find((e) => e.id === id));
  // ⚠️ ดึง "ทั้งก้อน" แล้วค่อยกรองข้างนอก — ถ้า filter ใน selector จะได้ array ใหม่ทุกครั้ง → render วนไม่จบ
  const allRegistrations = useStore((s) => s.registrations);
  const allResponses = useStore((s) => s.responses);
  // ร่างจาก Wizard (คำถาม Survey ที่ Event Admin ตั้งไว้) — คืน object เดิมใน store จึงไม่ render วน
  const draft = useWizardStore((s) => s.drafts[id]);

  // ประกอบข้อมูลรายงานใหม่เฉพาะเมื่อข้อมูลต้นทางเปลี่ยน (เช่น มีคนส่งคำตอบเพิ่ม)
  // hook ต้องถูกเรียกทุกครั้งก่อน return ใดๆ (กฎของ React hooks)
  const data = useMemo(
    () => (event ? buildReportData(event, draft, allRegistrations, allResponses) : null),
    [event, draft, allRegistrations, allResponses]
  );

  if (!hydrated) return { status: "loading" };

  // ด่านที่ 1: ไม่พบ / ถูกลบ / ไม่มีสิทธิ์
  const allowed =
    event !== undefined &&
    event.status !== "deleted" &&
    user !== null &&
    event.adminIds.includes(user.id);
  if (!allowed) return { status: "denied" };

  // ด่านที่ 2: มีข้อมูลรายงานเฉพาะงานที่เริ่มแล้ว (active / ended)
  const started = event.status === "active" || event.status === "ended";
  return started && data ? { status: "ok", event, data } : { status: "nodata", event };
}
