import type { EventDraft } from "@/types/event";

// ฟ้าใส: สถานะของ Event ที่คำนวณจากวันเวลา
export type Phase = "draft" | "scheduled" | "open" | "active" | "ended";

// ฟ้าใส: หาสถานะปัจจุบันของ Event
export function getPhase(d: EventDraft, now = new Date()): Phase {
  // ฟ้าใส: ยังเป็นร่าง → Draft
  if (d.status === "draft") return "draft";
  // ฟ้าใส: เวลาเริ่มงาน
  const start = new Date(`${d.general.date}T${d.general.startTime}`);
  const end = new Date(`${d.general.endDate || d.general.date}T${d.general.endTime}`); // ฟ้าใส: วันจบว่าง = วันเดียวกับวันเริ่ม
  // ฟ้าใส: เลยเวลาจบแล้ว → จบแล้ว
  if (now > end) return "ended";
  // ฟ้าใส: ถึงเวลาเริ่มแล้ว → กำลังจัดงาน
  if (now >= start) return "active";
  // ฟ้าใส: ถึงเวลาเปิดรับลงทะเบียนแล้ว → เปิดรับอยู่
  if (now >= new Date(d.schedule.regOpen)) return "open";
  return "scheduled";
}

// ฟ้าใส: ชื่อและสีของแต่ละสถานะ (ไทย / อังกฤษ)
export const PHASE_META: Record<Phase, { th: string; en: string; cls: string }> = {
  draft: { th: "Draft", en: "Draft", cls: "bg-slate-100 text-slate-700" },
  scheduled: { th: "รอเปิดรับ", en: "Scheduled", cls: "bg-blue-100 text-blue-800" },
  open: { th: "เปิดรับอยู่", en: "Open", cls: "bg-emerald-100 text-emerald-800" },
  active: { th: "กำลังจัดงาน", en: "Active", cls: "bg-violet-100 text-violet-800" },
  ended: { th: "จบแล้ว", en: "Ended", cls: "bg-zinc-200 text-zinc-700" },
};

// ฟ้าใส: ตอนนี้เปิดรับลงทะเบียนอยู่ไหม
export function isRegOpen(d: EventDraft, now = new Date()) {
  // ฟ้าใส: ร่าง → ยังไม่เปิด
  if (d.status === "draft") return false;
  return now >= new Date(d.schedule.regOpen) && now <= new Date(d.schedule.regClose);
}

// ฟ้าใส: ตอนนี้เปิดให้ตอบ Survey อยู่ไหม
export function isSurveyOpen(d: EventDraft, now = new Date()) {
  // ฟ้าใส: ร่าง / ไม่มี Survey → ไม่เปิด
  if (d.status === "draft" || !d.survey.enabled) return false;
  return now >= new Date(d.schedule.surveyOpen) && now <= new Date(d.schedule.surveyClose);
}

/** ฟ้าใส: สถานะของ Survey (ใช้ในการ์ด "สถานะ" ของหน้า Survey) */
export function getSurveyState(d: EventDraft, now = new Date()) {
  // ฟ้าใส: ร่าง → ฉบับร่าง
  if (d.status === "draft") return { key: "draft" as const, label: "ฉบับร่าง", cls: "text-amber-700" };
  // ฟ้าใส: (ไม่มีสถานะ "ปิดอยู่" แล้ว — Survey บังคับมีทุก Event)
  if (isSurveyOpen(d, now)) return { key: "open" as const, label: "เปิดรับคำตอบ", cls: "text-emerald-700" };
  // ฟ้าใส: เลยเวลาปิดรับคำตอบแล้ว → ปิดแล้ว
  if (d.schedule.surveyClose && now > new Date(d.schedule.surveyClose)) {
    return { key: "closed" as const, label: "ปิดรับแล้ว", cls: "text-zinc-600" };
  }
  return { key: "waiting" as const, label: "รอเปิดให้ตอบ", cls: "text-blue-700" };
}
