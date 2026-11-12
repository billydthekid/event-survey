// app/admin/events/dateFormat.ts
// ตัวช่วยจัดรูปแบบวันที่/เวลาของ Event (ใช้ในหน้า Event ของฉัน)
// ตรรกะเดียวกับ formatDay / localDateTime ใน [id]/DashboardView.tsx (กรณี "ไม่ใช่วันนี้")
// → วันที่ในการ์ดกับใน Dashboard หน้าตาตรงกัน
// หมายเหตุ: Dashboard ยังมีสำเนาของตัวเองอยู่ ถ้าภายหลังอนุญาตให้แก้ Dashboard ให้ย้ายมาใช้ไฟล์นี้แทน
import { Event, Lang } from "@/types";

// "2026-10-23" → Date ตามเวลาท้องถิ่น
// (แยกตัวเลขเอง ไม่ใช้ new Date("2026-10-23") ที่ถูกอ่านเป็นเวลา UTC แล้ววันอาจเลื่อน)
export function parseLocalDate(date: string): Date {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(y, m - 1, d);
}

// วันที่แบบมีชื่อวันย่อ
// TH: เบราว์เซอร์ให้ weekday "short" เป็น "ศุกร์" (ยาวไป) → ใช้ "narrow" ("ศ") แล้วเติมจุดเอง
//   23 ต.ค. 2569 → "ศ. 23 ต.ค." | withYear → "ศ. 23 ต.ค. 2569"
// EN: "Fri 23 Oct" | withYear → "Fri 23 Oct 2026"
export function formatDay(d: Date, lang: Lang, withYear: boolean): string {
  if (lang === "en") {
    return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", ...(withYear && { year: "numeric" }) });
  }
  const weekday = d.toLocaleDateString("th-TH", { weekday: "narrow" });
  const date = d.toLocaleDateString("th-TH", { day: "numeric", month: "short", ...(withYear && { year: "numeric" }) });
  return `${weekday}. ${date}`;
}

// วันที่ + เวลาของ Event ในบรรทัดเดียว
// รับ: Event (ใช้แค่ date, startTime, endTime) + ภาษา
// คืน: ข้อความ หรือ null ถ้ายังไม่กำหนดวัน (ให้หน้าเรียกใช้แสดงคำว่า "ยังไม่กำหนดวัน" เอง)
// ตัวอย่าง:
//   { date: "2026-10-23", startTime: "10:00", endTime: "15:00" }, "th" → "ศ. 23 ต.ค. 2569 · 10:00 – 15:00"
//   { date: "2026-10-25", startTime: "",      endTime: ""      }, "en" → "Sun 25 Oct 2026"
//   { date: "" ... }                                                   → null
// เวลาแสดงเมื่อมีทั้งเริ่มและจบ (กติกาเดียวกับการ์ด "เมื่อไหร่และที่ไหน" ใน Dashboard)
export function formatEventWhen(
  event: Pick<Event, "date" | "startTime" | "endTime">,
  lang: Lang
): string | null {
  if (!event.date) return null;
  const day = formatDay(parseLocalDate(event.date), lang, true);
  const time = event.startTime && event.endTime ? ` · ${event.startTime} – ${event.endTime}` : "";
  return day + time;
}
