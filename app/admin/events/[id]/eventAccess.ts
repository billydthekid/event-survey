// app/admin/events/[id]/eventAccess.ts
// ด่านสิทธิ์ของหน้าที่แสดงข้อมูล Event (ใช้ร่วมกัน: Report และ Dashboard)
// รวมกฎไว้ที่เดียว → ทุกหน้าตัดสิน "เห็นได้ไหม / มีข้อมูลไหม" เหมือนกันเสมอ
// เป็น hook (เรียก useStore) จึงใช้ได้เฉพาะใน Client Component
import { useStore } from "@/lib/store";
import { Event } from "@/types";
import { getReportData, ReportData } from "./report/mockData";

// ผลของการตรวจ 4 แบบ
// - loading : store ยังโหลดจาก localStorage ไม่เสร็จ → ยังไม่ตัดสินอะไร (กันขึ้น "ไม่พบ" แวบหนึ่ง)
// - denied  : ด่านที่ 1 ไม่ผ่าน — ไม่พบ / ถูกลบ / ไม่ได้ login / ไม่ได้รับมอบหมาย → ห้ามแสดงข้อมูล Event
// - nodata  : ด่านที่ 2 — ผ่านสิทธิ์ แต่ยังเป็น Draft / Scheduled (หรือไม่มีข้อมูล) → มี event แต่ไม่มี data
// - ok      : ผ่านทั้งสองด่าน → มีทั้ง event และ data
export type EventAccess =
  | { status: "loading" }
  | { status: "denied" }
  | { status: "nodata"; event: Event }
  | { status: "ok"; event: Event; data: ReportData };

// useEventAccess: รับ id ของ Event → คืนผลการตรวจข้างบน
// ตัวอย่าง (login เป็น u-event-1):
//   "e-workshop" (active, ได้รับมอบหมาย)       → { status: "ok", event, data }
//   "e-comm"     (ของ u-event-3)               → { status: "denied" }
//   Event draft ที่ได้รับมอบหมาย                → { status: "nodata", event }
export function useEventAccess(id: string): EventAccess {
  const user = useStore((s) => s.currentUser);
  const hydrated = useStore((s) => s.hydrated);
  const event = useStore((s) => s.events.find((e) => e.id === id));

  if (!hydrated) return { status: "loading" };

  // ด่านที่ 1: ไม่พบ / ถูกลบ / ไม่มีสิทธิ์
  const allowed =
    event !== undefined &&
    event.status !== "deleted" &&
    user !== null &&
    event.adminIds.includes(user.id);
  if (!allowed) return { status: "denied" };

  // ด่านที่ 2: มีข้อมูลรายงานเฉพาะงานที่เริ่มแล้ว (active / ended)
  const data = event.status === "active" || event.status === "ended" ? getReportData(event.id) : null;
  return data ? { status: "ok", event, data } : { status: "nodata", event };
}
