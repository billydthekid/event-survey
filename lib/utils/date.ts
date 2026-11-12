import { format, parseISO } from "date-fns";
import { th } from "date-fns/locale";

/** พฤ. 30 ต.ค. 2569 */
export function formatThaiDate(iso: string, withYear = true) {
  if (!iso) return "-";
  const d = parseISO(iso);
  const base = format(d, "EEE d MMM", { locale: th });
  return withYear ? `${base} ${d.getFullYear() + 543}` : base;
}

/** จ. 27 ต.ค. · 09:00 น. (รับ yyyy-MM-ddTHH:mm) */
export function formatThaiDateTime(iso: string) {
  if (!iso) return "-";
  const d = parseISO(iso);
  return `${format(d, "EEE d MMM", { locale: th })} · ${format(d, "HH:mm")} น.`;
}

/** Event เริ่มแล้วหรือยัง → ถ้าเริ่มแล้วทุกขั้นตอนถูกล็อก */
export function isEventLocked(date: string, startTime: string) {
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
