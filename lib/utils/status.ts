// lib/utils/status.ts
import { EventStatus } from "@/types";

// ชื่อไทย + สีป้ายของแต่ละสถานะ
export const STATUS_LABEL: Record<EventStatus, { text: string; color: string }> = {
  draft:     { text: "ฉบับร่าง",     color: "bg-slate-100 text-slate-600" },
  scheduled: { text: "ใกล้ถึง",      color: "bg-blue-50 text-blue-600" },
  active:    { text: "กำลังจัดงาน",  color: "bg-green-50 text-green-600" },
  ended:     { text: "จบแล้ว",       color: "bg-slate-200 text-slate-600" },
  deleted:   { text: "ถูกลบ",        color: "bg-red-50 text-red-600" },
};

export const KEEP_DAYS = 30;  // เก็บรายการที่ถูกลบกี่วัน

// เหลืออีกกี่วันก่อนลบถาวร
export function daysLeft(purgeAt?: string): number {
  if (!purgeAt) return 0;
  const ms = new Date(purgeAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}