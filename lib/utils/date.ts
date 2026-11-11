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

// รับ "2026-10-25" (แบบใน mock) หรือ ISO เต็ม → "25 ต.ค. 2569" · ค่าว่าง → "ยังไม่กำหนด"
export function formatThaiDate(date: string): string {
  if (!date) return "ยังไม่กำหนด";
  // มีแค่วันที่ → เติมเวลา + โซนไทย กันวันเลื่อนไป 1 วันเวลาแปลงโซน
  const d = new Date(date.length === 10 ? `${date}T00:00:00+07:00` : date);
  return dateFmt.format(d);
}

// "11 พ.ย. 2569 · 18:45 น." (ท้ายตาราง "ข้อมูล ณ ...")
export function formatThaiDateTime(d: Date): string {
  return `${dateFmt.format(d)} · ${timeFmt.format(d)} น.`;
}
