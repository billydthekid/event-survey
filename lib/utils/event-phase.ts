import type { EventDraft } from "@/types/event";

export type Phase = "draft" | "scheduled" | "open" | "active" | "ended";

export function getPhase(d: EventDraft, now = new Date()): Phase {
  if (d.status === "draft") return "draft";
  const start = new Date(`${d.general.date}T${d.general.startTime}`);
  const end = new Date(`${d.general.date}T${d.general.endTime}`);
  if (now > end) return "ended";
  if (now >= start) return "active";
  if (now >= new Date(d.schedule.regOpen)) return "open";
  return "scheduled";
}

export const PHASE_META: Record<Phase, { th: string; en: string; cls: string }> = {
  draft: { th: "Draft", en: "Draft", cls: "bg-slate-100 text-slate-700" },
  scheduled: { th: "รอเปิดรับ", en: "Scheduled", cls: "bg-blue-100 text-blue-800" },
  open: { th: "เปิดรับอยู่", en: "Open", cls: "bg-emerald-100 text-emerald-800" },
  active: { th: "กำลังจัดงาน", en: "Active", cls: "bg-violet-100 text-violet-800" },
  ended: { th: "จบแล้ว", en: "Ended", cls: "bg-zinc-200 text-zinc-700" },
};

export function isRegOpen(d: EventDraft, now = new Date()) {
  if (d.status === "draft") return false;
  return now >= new Date(d.schedule.regOpen) && now <= new Date(d.schedule.regClose);
}

export function isSurveyOpen(d: EventDraft, now = new Date()) {
  if (d.status === "draft" || !d.survey.enabled) return false;
  return now >= new Date(d.schedule.surveyOpen) && now <= new Date(d.schedule.surveyClose);
}

/** สถานะของ Survey (ใช้ในการ์ด "สถานะ" ของหน้า Survey) */
export function getSurveyState(d: EventDraft, now = new Date()) {
  if (d.status === "draft") return { key: "draft" as const, label: "ฉบับร่าง", cls: "text-amber-700" };
  if (!d.survey.enabled) return { key: "off" as const, label: "ปิดอยู่", cls: "text-slate-600" };
  if (isSurveyOpen(d, now)) return { key: "open" as const, label: "เปิดรับคำตอบ", cls: "text-emerald-700" };
  if (d.schedule.surveyClose && now > new Date(d.schedule.surveyClose)) {
    return { key: "closed" as const, label: "ปิดรับแล้ว", cls: "text-zinc-600" };
  }
  return { key: "waiting" as const, label: "รอเปิดให้ตอบ", cls: "text-blue-700" };
}
