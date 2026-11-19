// ฟ้าใส: lib/event-types.ts
// ฟ้าใส: ประเภทงานทั้งหมด + ชื่อที่แสดง (ไทย / อังกฤษ) รวมไว้ที่เดียว — Wizard, Preview และ Survey ใช้ร่วมกัน
// ฟ้าใส: "other" = ผู้จัดพิมพ์ชื่อประเภทเอง เก็บใน general.typeOther
import type { EventType } from "@/types/event";

// ฟ้าใส: รายการประเภทงานทั้งหมด (ค่า + ชื่อไทย / อังกฤษ)
export const EVENT_TYPES: { value: EventType; th: string; en: string }[] = [
  { value: "seminar", th: "สัมมนา", en: "Seminar" },
  { value: "workshop", th: "Workshop", en: "Workshop" },
  { value: "training", th: "อบรม", en: "Training" },
  { value: "conference", th: "ประชุมวิชาการ", en: "Conference" },
  { value: "jobfair", th: "Job Fair", en: "Job Fair" },
  { value: "openhouse", th: "Open House", en: "Open House" },
  { value: "competition", th: "แข่งขัน", en: "Competition" },
  { value: "exhibition", th: "นิทรรศการ", en: "Exhibition" },
  { value: "sports", th: "กีฬา", en: "Sports" },
  { value: "volunteer", th: "จิตอาสา", en: "Volunteer" },
  { value: "other", th: "อื่นๆ", en: "Other" },
];

/** ฟ้าใส: ชื่อประเภทงานที่แสดง · type "other" ใช้ชื่อที่ผู้จัดพิมพ์เอง (ว่าง = "อื่นๆ") */
export function eventTypeLabel(type: EventType, other?: string, lang: "th" | "en" = "th"): string {
  // ฟ้าใส: อื่นๆ ที่พิมพ์ชื่อเอง → ใช้ชื่อนั้น
  if (type === "other" && other?.trim()) return other.trim();
  // ฟ้าใส: หาชื่อประเภทงานจากรายการ
  const t = EVENT_TYPES.find((x) => x.value === type);
  return t ? t[lang] : type;
}
