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


// ============ Dashboard เจาะ Event (หน้า ③) ============
// ฟังก์ชันกลุ่มนี้รับรายการของ Event เดียว (หน้าเว็บกรอง eventId มาแล้ว)

const SLOT_MS = 30 * 60 * 1000;   // 30 นาที

export interface Slot {
  start: Date;
  count: number;
  future: boolean;   // ช่วงที่ยังไม่ถึงเวลา → กราฟวาดเป็นกล่องเส้นประ
}

// คนลงทะเบียนต่อช่วง 30 นาที ตั้งแต่เริ่มงานถึงจบงาน (กราฟแท่ง)
// คนที่ลงทะเบียนล่วงหน้า (ก่อนเริ่มงาน) ไม่อยู่ในช่วงไหนเลย → ไม่ถูกนับในกราฟ
export function registrationSlots(
  range: { start: Date; end: Date },
  registrations: Registration[],
  now: Date
): Slot[] {
  const times = registrations.map((r) => new Date(r.createdAt).getTime());
  const slots: Slot[] = [];
  for (let t = range.start.getTime(); t < range.end.getTime(); t += SLOT_MS) {
    slots.push({
      start: new Date(t),
      count: times.filter((x) => x >= t && x < t + SLOT_MS).length,
      future: t > now.getTime(),
    });
  }
  return slots;
}

// ความพึงพอใจ: นับแต่ละคะแนน (เรียง 5 → 1) + ค่าเฉลี่ยทศนิยม 1 ตำแหน่ง
// questionId = ข้อ Rating ที่ใช้นับ (หน้าเว็บส่งข้อ Rating ข้อแรกของ Survey มา เช่น "q1") · ไม่มี → นับได้ 0 ทุกระดับ
export function satisfactionSummary(responses: SurveyResponse[], questionId?: string) {
  const levels = [5, 4, 3, 2, 1].map((score) => ({
    score,
    count: questionId ? responses.filter((r) => Number(r.answers[questionId]) === score).length : 0,
  }));
  const total = levels.reduce((sum, l) => sum + l.count, 0);
  const points = levels.reduce((sum, l) => sum + l.score * l.count, 0);
  return {
    levels,
    total,
    average: total === 0 ? 0 : Math.round((points / total) * 10) / 10,
  };
}

// เวลาของรายการล่าสุด (ISO string เทียบกันแบบตัวอักษรได้เลย เพราะรูปแบบเดียวกันหมด) · ไม่มี → undefined
export function latestAt(list: { createdAt: string }[]): string | undefined {
  return list.reduce<string | undefined>((max, r) => (!max || r.createdAt > max ? r.createdAt : max), undefined);
}
