// lib/utils/eventList.ts
// ตัวช่วยของหน้ารวมทุก Event (Event / Survey / Report) — ค้นหา + เรียง + สถานะ Survey / Report
// รับข้อมูลเป็นพารามิเตอร์ ไม่อ่าน store เอง (แบบเดียวกับ stats.ts)
import { Event } from "@/types";

// ============ ค้นหา ============
// ตรงกับชื่อ Event (ไทย / อังกฤษ) หรือรหัส เช่น "fig" เจอ FIG-1017 · ช่องว่าง = ผ่านทุกอัน
export function matchKeyword(event: Event, keyword: string): boolean {
  const kw = keyword.trim().toLowerCase();
  if (!kw) return true;
  return [event.name.th, event.name.en ?? "", event.code].some((text) => text.toLowerCase().includes(kw));
}

// ============ เรียง ============
export type SortKey = "date" | "registered" | "name";

export const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "date", label: "วันที่จัดล่าสุด" },
  { key: "registered", label: "ลงทะเบียนมากสุด" },
  { key: "name", label: "ชื่อ ก–ฮ" },
];

// คืน array ใหม่ (ไม่แก้ของเดิม) · registered = { eventId: จำนวน } จาก countByEvent
export function sortEvents(list: Event[], key: SortKey, registered: Record<string, number>): Event[] {
  const copy = [...list];
  if (key === "registered") return copy.sort((a, b) => (registered[b.id] ?? 0) - (registered[a.id] ?? 0));
  if (key === "name") return copy.sort((a, b) => a.name.th.localeCompare(b.name.th, "th"));
  // วันที่ล่าสุดขึ้นก่อน · Event ที่ยังไม่กำหนดวัน (Draft) ไว้ท้าย
  return copy.sort((a, b) => {
    if (!a.date || !b.date) return a.date ? -1 : b.date ? 1 : 0;
    return b.date.localeCompare(a.date);
  });
}

// ============ สถานะ Survey ของ Event ============
export type SurveyState = "on" | "off" | "none";

export function surveyState(event: Event): SurveyState {
  if (!event.survey) return "none";
  return event.survey.enabled ? "on" : "off";
}

// ข้อความในตาราง เช่น "เปิดใช้ · 7 ข้อ" / "ยังไม่มี Survey"
export function surveyLabel(event: Event): string {
  const state = surveyState(event);
  if (state === "none") return "ยังไม่มี Survey";
  const count = event.survey?.questions.length ?? 0;
  return `${state === "on" ? "เปิดใช้" : "ปิดอยู่"} · ${count} ข้อ`;
}

// ============ สถานะรายงานของ Event ============
// กำลังจัดงาน = ข้อมูลยังเพิ่มอยู่ · จบแล้ว = สรุปแล้ว · ใกล้ถึง / ฉบับร่าง = ยังไม่มีข้อมูล
export type ReportState = "live" | "done" | "wait";

export const REPORT_LABEL: Record<ReportState, { text: string; color: string }> = {
  live: { text: "มีข้อมูล · อัปเดตสด", color: "bg-green-50 text-green-600" },
  done: { text: "มีข้อมูล · สรุปแล้ว", color: "bg-blue-50 text-blue-600" },
  wait: { text: "ยังไม่เริ่มงาน", color: "bg-slate-100 text-slate-500" },
};

export function reportState(event: Event): ReportState {
  if (event.status === "active") return "live";
  if (event.status === "ended") return "done";
  return "wait";
}
