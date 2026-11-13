// lib/event-types.ts
// ประเภทงานทั้งหมด + ชื่อที่แสดง (ไทย / อังกฤษ) รวมไว้ที่เดียว — Wizard, Preview และ Survey ใช้ร่วมกัน
// "other" = ผู้จัดพิมพ์ชื่อประเภทเอง เก็บใน general.typeOther
import type { EventType } from "@/types/event";

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

/** ชื่อประเภทงานที่แสดง · type "other" ใช้ชื่อที่ผู้จัดพิมพ์เอง (ว่าง = "อื่นๆ") */
export function eventTypeLabel(type: EventType, other?: string, lang: "th" | "en" = "th"): string {
  if (type === "other" && other?.trim()) return other.trim();
  const t = EVENT_TYPES.find((x) => x.value === type);
  return t ? t[lang] : type;
}
