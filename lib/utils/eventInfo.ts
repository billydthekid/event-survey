// lib/utils/eventInfo.ts
// ตัวช่วยของหน้า Event (ข้อมูล + QR) — /super/events/<id>/event
// รับ Event เข้ามาแล้วคืนข้อความ/ค่าที่หน้าจอใช้ ไม่อ่าน store เอง
import { Event, EventType } from "@/types";
import { eventRange } from "@/lib/utils/date";

// ---------- ชื่อประเภทงาน (ชุดเดียวกับ Wizard ของพิชชาภา) ----------
export const TYPE_LABEL: Record<EventType, string> = {
  seminar: "สัมมนา",
  workshop: "Workshop",
  training: "อบรม",
  jobfair: "Job Fair",
  openhouse: "Open House",
};

// ---------- ตัวเลือกหน้าจอ Kiosk ----------
export const KIOSK_OPTIONS: { value: Event["kiosk"]["screen"]; label: string }[] = [
  { value: "register", label: "Register" },
  { value: "survey", label: "Survey" },
  { value: "both", label: "ทั้งคู่" },
];

// ---------- กฎล็อกการแก้ไข ----------
// ตกลงกับ Jin 13 พ.ย.: เริ่มงานแล้ว (กำลังจัดงาน / จบแล้ว) = ล็อก — ตรงกับฝั่งผู้จัดงานที่ล็อกหลัง Active
// ใช้สถานะ ไม่ใช้วัน+เวลา เพราะ Event ตัวอย่างบางงานไม่มีเวลาเริ่ม (จะไม่ล็อกทั้งที่จบแล้ว)
export function isEditLocked(event: Event): boolean {
  return event.status === "active" || event.status === "ended";
}

// ---------- Survey เปิดต่อหลังจบงานกี่วัน ----------
// เช่น งานจบ 23 ต.ค. 15:00 · Survey ปิด 26 ต.ค. 23:59 → 3 · ข้อมูลไม่ครบ / ปิดก่อนจบงาน → null
export function surveyDaysAfterEnd(event: Event): number | null {
  const range = eventRange(event);
  const closesAt = event.surveyWindow.closesAt;
  if (!range || !closesAt) return null;
  const ms = new Date(closesAt).getTime() - range.end.getTime();
  if (ms <= 0) return null;
  return Math.floor(ms / (24 * 60 * 60 * 1000));
}

// ---------- ชื่อไฟล์จาก path ----------
// "/kiosk/ads/workshop-figma.png" → "workshop-figma.png"
export function fileName(path: string): string {
  return path.split("/").pop() ?? path;
}
