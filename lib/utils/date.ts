// lib/utils/date.ts

// รูปแบบวันที่ภาษาไทยที่ใช้ใน Dashboard / Report — ล็อกเวลาไทยเสมอ (เครื่องผู้ใช้อยู่โซนไหนก็ได้ผลเดียวกัน)

// "25 ต.ค. 2569" (th-TH ใช้ปี พ.ศ. ให้อัตโนมัติ)
const dateFmt = new Intl.DateTimeFormat("th-TH", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "Asia/Bangkok",
});

// "14:30"
const timeFmt = new Intl.DateTimeFormat("th-TH", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: "Asia/Bangkok",
});

// "23" กับ "ต.ค." แยกกัน (กล่องวันที่ใน Sidebar / popup เลือก Event)
const dayFmt = new Intl.DateTimeFormat("th-TH", { day: "numeric", timeZone: "Asia/Bangkok" });
const monthFmt = new Intl.DateTimeFormat("th-TH", { month: "short", timeZone: "Asia/Bangkok" });

// แปลง string → Date
// มีแค่วันที่ ("2026-10-25" แบบใน mock) → เติมเวลา + โซนไทย กันวันเลื่อนไป 1 วันเวลาแปลงโซน
function toDate(date: string): Date {
  return new Date(date.length === 10 ? `${date}T00:00:00+07:00` : date);
}

// รับ "2026-10-25" หรือ ISO เต็ม → "25 ต.ค. 2569" · ค่าว่าง → "ยังไม่กำหนด"
export function formatThaiDate(date: string): string {
  if (!date) return "ยังไม่กำหนด";
  return dateFmt.format(toDate(date));
}

// "2026-10-23" → { day: "23", month: "ต.ค." } · ค่าว่าง → null (ยังไม่กำหนดวัน)
export function formatDayMonth(date: string): { day: string; month: string } | null {
  if (!date) return null;
  const d = toDate(date);
  return { day: dayFmt.format(d), month: monthFmt.format(d) };
}

// "11 พ.ย. 2569 · 18:45 น." (ท้ายตาราง "ข้อมูล ณ ...")
export function formatThaiDateTime(d: Date): string {
  return `${dateFmt.format(d)} · ${timeFmt.format(d)} น.`;
}


// ============ เวลา / ช่วงเวลางาน (หน้า ③) ============

// "14:30" (แกนกราฟแท่ง, "คนล่าสุด 12:38 น.")
export function formatTime(d: Date): string {
  return timeFmt.format(d);
}

// วันที่ "2026-10-23" ตรงกับวันนี้ (เวลาไทย) ไหม — sv-SE ให้รูปแบบ ปี-เดือน-วัน เหมือนใน mock
const keyFmt = new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Bangkok" });
export function isToday(date: string, now: Date): boolean {
  return !!date && keyFmt.format(now) === date;
}

// เวลาคนลงทะเบียนล่าสุด: วันนี้ → "12:38 น." · วันอื่น → "23 ต.ค. 12:38 น."
export function formatRecent(iso: string, now: Date): string {
  const d = new Date(iso);
  if (keyFmt.format(d) === keyFmt.format(now)) return `${timeFmt.format(d)} น.`;
  return `${dayFmt.format(d)} ${monthFmt.format(d)} ${timeFmt.format(d)} น.`;
}

// เวลาเริ่ม–จบงานเป็น Date · ยังไม่กำหนดวันหรือเวลา → null
export function eventRange(event: { date: string; startTime: string; endTime: string }) {
  if (!event.date || !event.startTime || !event.endTime) return null;
  return {
    start: new Date(`${event.date}T${event.startTime}:00+07:00`),
    end: new Date(`${event.date}T${event.endTime}:00+07:00`),
  };
}

// ระยะเวลาเป็นข้อความ: ≥ 1 วัน → "3 วัน" · น้อยกว่า → "2 ชม. 20 น." / "45 น."
export function formatDuration(ms: number): string {
  const minutes = Math.floor(ms / 60000);
  if (minutes >= 24 * 60) return `${Math.floor(minutes / (24 * 60))} วัน`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h} ชม. ${m} น.` : `${m} น.`;
}

// การ์ด "เหลือเวลา" — ข้อความเปลี่ยนตามช่วง: ก่อนงาน / ระหว่างงาน / หลังงาน / ยังไม่กำหนด
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
