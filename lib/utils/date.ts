// lib/utils/date.ts
// รวมของทั้ง 2 ฝั่ง: date-fns (Wizard) + Intl (Dashboard)
import { format, parseISO } from "date-fns";
import { th } from "date-fns/locale";

// ============ formatters ส่วนกลาง ============
const dateFmt = new Intl.DateTimeFormat("th-TH", {
  day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Bangkok",
});
const timeFmt = new Intl.DateTimeFormat("th-TH", {
  hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Bangkok",
});
const dayFmt = new Intl.DateTimeFormat("th-TH", { day: "numeric", timeZone: "Asia/Bangkok" });
const monthFmt = new Intl.DateTimeFormat("th-TH", { month: "short", timeZone: "Asia/Bangkok" });
const keyFmt = new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Bangkok" });

function toDate(date: string): Date {
  return new Date(date.length === 10 ? `${date}T00:00:00+07:00` : date);
}

// ============ ฟังก์ชันหลัก (ใช้ร่วมกัน) ============

// default: "พฤ. 30 ต.ค. 2569" (มีวันในสัปดาห์ สำหรับ Wizard)
// withWeekday=false: "30 ต.ค. 2569" (ไม่มีวันในสัปดาห์ สำหรับ Dashboard)
export function formatThaiDate(iso: string, withWeekday = true): string {
  if (!iso) return "ยังไม่กำหนด";
  if (withWeekday) {
    const d = parseISO(iso);
    return `${format(d, "EEE d MMM", { locale: th })} ${d.getFullYear() + 543}`;
  }
  return dateFmt.format(toDate(iso));
}

// รับได้ทั้ง string และ Date → "จ. 27 ต.ค. · 09:00 น."
export function formatThaiDateTime(input: string | Date): string {
  if (!input) return "-";
  const d = typeof input === "string" ? parseISO(input) : input;
  return `${format(d, "EEE d MMM", { locale: th })} · ${format(d, "HH:mm")} น.`;
}

// Event เริ่มแล้วหรือยัง
export function isEventLocked(date: string, startTime: string): boolean {
  if (!date || !startTime) return false;
  return new Date() >= new Date(`${date}T${startTime}`);
}

/** 30 ต.ค. 14:00 (รับ yyyy-MM-ddTHH:mm) — ว่าง/ผิดรูปแบบ → "-" */
export function formatThaiShortDateTime(iso: string) {
  if (!iso) return "-";
  const d = parseISO(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return `${format(d, "d MMM", { locale: th })} ${format(d, "HH:mm")}`;
}
// ============ ส่วนของ jinnkvvlll (Dashboard / Report) ============

export function formatDayMonth(date: string): { day: string; month: string } | null {
  if (!date) return null;
  const d = toDate(date);
  return { day: dayFmt.format(d), month: monthFmt.format(d) };
}

export function formatTime(d: Date): string {
  return timeFmt.format(d);
}

export function isToday(date: string, now: Date): boolean {
  return !!date && keyFmt.format(now) === date;
}

export function formatRecent(iso: string, now: Date): string {
  const d = new Date(iso);
  if (keyFmt.format(d) === keyFmt.format(now)) return `${timeFmt.format(d)} น.`;
  return `${dayFmt.format(d)} ${monthFmt.format(d)} ${timeFmt.format(d)} น.`;
}

export function eventRange(event: { date: string; startTime: string; endTime: string }) {
  if (!event.date || !event.startTime || !event.endTime) return null;
  return {
    start: new Date(`${event.date}T${event.startTime}:00+07:00`),
    end: new Date(`${event.date}T${event.endTime}:00+07:00`),
  };
}

export function formatDuration(ms: number): string {
  const minutes = Math.floor(ms / 60000);
  if (minutes >= 24 * 60) return `${Math.floor(minutes / (24 * 60))} วัน`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h} ชม. ${m} น.` : `${m} น.`;
}

export function countdown(
  event: { date: string; startTime: string; endTime: string },
  now: Date
): { label: string; value: string } {
  const range = eventRange(event);
  if (!range) return { label: "เหลือเวลา", value: "ยังไม่กำหนด" };
  const t = now.getTime();
  if (t < range.start.getTime()) {
    return { label: "เริ่มงานในอีก", value: formatDuration(range.start.getTime() - t) };
  }
  if (t < range.end.getTime()) {
    return { label: "เหลือเวลา", value: formatDuration(range.end.getTime() - t) };
  }
  return { label: "เหลือเวลา", value: "จบงานแล้ว" };
}
