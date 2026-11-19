// lib/mock/dates.ts
// วันที่ของข้อมูลตัวอย่าง คิดจาก "วันนี้" (เวลาไทย) แทนการเขียนวันที่ตายตัว
// เดิมลงวันที่ ต.ค. 2569 ไว้ → พอเลยเดือนนั้น ทุกงานขึ้นว่าจบแล้ว เดโม่ไม่ได้
// ตอนนี้: เปิดแอปวันไหนก็มีครบ กำลังจัด / ใกล้ถึง / จบแล้ว

// วันที่แบบ "2026-11-19" ของวันนี้ + n วัน (n ติดลบ = ย้อนหลัง)
export function dayFromToday(n: number): string {
  const d = new Date(Date.now() + n * 24 * 60 * 60 * 1000);
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Bangkok" }).format(d);
}

// ระยะห่างเท่าข้อมูลเดิม (23 / 20 / 18 / 25 ต.ค.) → วันนี้ / -3 / -5 / +2
export const MOCK_DATES = {
  workshop: dayFromToday(0),   // กำลังจัดงาน (วันนี้)
  openhouse: dayFromToday(-3), // จบแล้ว
  comm: dayFromToday(-5),      // จบแล้ว
  career: dayFromToday(2),     // ใกล้ถึง
};
