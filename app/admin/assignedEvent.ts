// app/admin/assignedEvent.ts
// หา "Event ที่ได้รับมอบหมาย" ของ Event Admin ที่ login อยู่ (ใช้ร่วมกัน: หน้า /admin และ EventSidebar)
// กติกา: 1 Event Admin ดูแล 1 Event (lib/utils/organizer.ts) → ฝั่ง /admin ไม่มีหน้ารายการและไม่มีตัวสลับ Event
// แหล่งข้อมูล: event.adminIds (แหล่งเดียวกับด่านสิทธิ์ใน eventAccess.ts)
//   ไม่ใช้ currentUser.eventIds เพราะเป็นค่าที่เก็บไว้ตอน login → ไม่อัปเดตเมื่อ Super เปลี่ยนผู้ดูแลทีหลัง
// เป็น hook (เรียก useStore) จึงใช้ได้เฉพาะใน Client Component
import { useStore } from "@/lib/store";
import { Event } from "@/types";

// ผลลัพธ์ 3 แบบ
// - loading : store ยังโหลดจาก localStorage ไม่เสร็จ → ยังไม่ตัดสินอะไร
// - none    : ไม่มี Event ที่ได้รับมอบหมาย (หรือยังไม่ login)
// - ok      : มี Event ที่ได้รับมอบหมาย
export type AssignedEvent =
  | { status: "loading" }
  | { status: "none" }
  | { status: "ok"; event: Event };

// ============ เลือก Event เดียวเมื่อข้อมูลเก่ามีหลายงาน ============
// ลำดับ: Active (วันใกล้สุด) → Scheduled (วันใกล้สุด) → Draft → Ended (วันล่าสุด)
// วันเท่ากัน / ไม่มีวัน → เรียงตาม id เพื่อให้ได้ผลเดิมทุกครั้ง (ไม่ขึ้นกับลำดับใน store)
// ตัวอย่าง: u-organizer-2 = [e-openhouse (ended 20 ต.ค.), e-career (scheduled 25 ต.ค.)] → e-career
export function pickAssigned(events: Event[]): Event | null {
  const byDate = (a: Event, b: Event) =>
    (a.date || "9999").localeCompare(b.date || "9999") || a.id.localeCompare(b.id); // ไม่มีวันที่ → ไว้ท้าย
  const of = (status: Event["status"]) => events.filter((e) => e.status === status).sort(byDate);
  return (
    of("active")[0] ??
    of("scheduled")[0] ??
    of("draft")[0] ??
    of("ended").at(-1) ?? // ended: เอาวันที่ล่าสุด (ท้ายสุดหลังเรียงจากเก่าไปใหม่)
    null
  );
}

// useAssignedEvent: ไม่รับค่า → คืน Event ที่ได้รับมอบหมายของ user ที่ login อยู่
// ตัวอย่าง: login เป็น u-organizer-1 → { status: "ok", event: e-workshop }
//           organizer ที่เพิ่งสร้าง ยังไม่มีงาน → { status: "none" }
export function useAssignedEvent(): AssignedEvent {
  const user = useStore((s) => s.currentUser);
  const hydrated = useStore((s) => s.hydrated);
  const events = useStore((s) => s.events);

  if (!hydrated) return { status: "loading" };
  if (!user) return { status: "none" };

  // Event ที่ฉันดูแล และยังไม่ถูกลบ
  const mine = events.filter((e) => e.adminIds.includes(user.id) && e.status !== "deleted");
  const event = pickAssigned(mine);
  return event ? { status: "ok", event } : { status: "none" };
}
