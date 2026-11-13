// app/admin/events/[id]/report/people.ts
// ตัวช่วยเรื่อง "ผู้ลงทะเบียนรายคน" (ไม่มี React / ไม่มี UI)
// ใช้ร่วมกันระหว่าง Dashboard และแท็บ Report (ผู้เข้าร่วม / คำตอบรายคน)
import { ReportData } from "./mockData";

// ============ ปิดบังเบอร์โทร ============
// ทุกที่ที่แสดงเบอร์โทรบนจอต้องผ่านฟังก์ชันนี้ (เบอร์เต็มเก็บอยู่ใน answers.phone)
// รับ: เบอร์ในรูปแบบใดก็ได้ เช่น "0812344521" หรือ "081-234-4521"
// คืน: เห็นแค่ 2 ตัวแรก + 4 ตัวท้าย เช่น "08X-XXX-4521"
//      ตัวเลขน้อยกว่า 6 หลัก (เปิดเผยไม่ได้อย่างปลอดภัย) → "XXX-XXX-XXXX" | ไม่มีค่า → "—"
export function maskPhone(phone: string | string[] | undefined): string {
  if (phone === undefined || Array.isArray(phone)) return "—";
  const digits = phone.replace(/\D/g, ""); // ตัดทุกอย่างที่ไม่ใช่ตัวเลข เช่น "081-234-4521" → "0812344521"
  if (digits.length === 0) return "—";
  if (digits.length < 6) return "XXX-XXX-XXXX";
  return `${digits.slice(0, 2)}X-XXX-${digits.slice(-4)}`;
}

// ============ ผู้ลงทะเบียนที่ตอบ Survey แล้ว ============
// รับ: ข้อมูลรายงาน
// คืน: Set ของ registrationId ที่มีคำตอบ → เช็คทีละคนด้วย .has(id) ได้เร็ว
// ตัวอย่าง (Workshop): ขนาด 31 จาก 46 คน, มี "e-workshop-reg-46" แต่ไม่มี "e-workshop-reg-44"
export function respondedRegistrationIds(data: ReportData): Set<string> {
  return new Set(data.responses.map((r) => r.registrationId));
}
