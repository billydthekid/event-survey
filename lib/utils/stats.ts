// lib/utils/stats.ts
import { Event, Registration, SurveyResponse } from "@/types";

// ฟังก์ชันคิดตัวเลขสำหรับ Dashboard / Report
// รับข้อมูลเป็นพารามิเตอร์ (หน้าเว็บดึงจาก store แล้วส่งเข้ามา) ไฟล์นี้ไม่อ่าน store เอง

// ============ นับต่อ Event ============
// ได้ผลเป็น { eventId: จำนวน } เช่น { "e-career": 320, "e-comm": 96 }
export function countByEvent(list: { eventId: string }[]): Record<string, number> {
  const result: Record<string, number> = {};
  list.forEach((item) => {
    result[item.eventId] = (result[item.eventId] ?? 0) + 1;
  });
  return result;
}

// % ตอบ Survey ทศนิยม 1 ตำแหน่ง — ถ้ายังไม่มีคนลงทะเบียนคืน 0 (กันหารศูนย์)
export function responseRate(responded: number, registered: number): number {
  if (registered === 0) return 0;
  return Math.round((responded / registered) * 1000) / 10;
}

// ไม่นับ Event ที่ถูกลบ (ท้ายตารางในหน้า ② เขียนว่า "ไม่รวมรายการที่ถูกลบ")
export function visibleEvents(events: Event[]): Event[] {
  return events.filter((e) => e.status !== "deleted");
}

// ============ ภาพรวมทุก Event (หน้า ②) ============
export interface Summary {
  eventCount: number;
  registered: number;
  responded: number;
  notResponded: number;
  rate: number;   // %
}

export function summarize(
  events: Event[],
  registrations: Registration[],
  responses: SurveyResponse[]
): Summary {
  const ids = visibleEvents(events).map((e) => e.id);
  const registered = registrations.filter((r) => ids.includes(r.eventId)).length;
  const responded = responses.filter((r) => ids.includes(r.eventId)).length;
  return {
    eventCount: ids.length,
    registered,
    responded,
    notResponded: registered - responded,
    rate: responseRate(responded, registered),
  };
}

// Event ที่คนลงทะเบียนมากสุด n อันดับ (การ์ด Top 3)
export function topByRegistrations(events: Event[], registrations: Registration[], n = 3) {
  const count = countByEvent(registrations);
  return visibleEvents(events)
    .map((e) => ({ event: e, registered: count[e.id] ?? 0 }))
    .sort((a, b) => b.registered - a.registered)
    .slice(0, n);
}
