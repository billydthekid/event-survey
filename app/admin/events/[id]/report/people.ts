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

// ============ ผู้เข้าร่วม 1 คน (1 แถวในตารางแท็บ "ผู้เข้าร่วม") ============
// ⚠️ คอลัมน์คงที่ (name, age, gender, phone, faculty) ตามช่องใน mock
// ของจริง: ช่องลงทะเบียนเป็น dynamic → ควรสร้างคอลัมน์จาก event.registration.fields แทน
export interface Participant {
  id: string;            // registration id เช่น "e-workshop-reg-46"
  registeredAt: string;  // ISO เวลาลงทะเบียน
  name: string;
  age: string;
  gender: string;        // "male" | "female" | "unspecified" (หน้าจอแปลงเป็นคำ TH/EN เอง)
  phone: string;         // เบอร์เต็ม — ห้ามแสดงตรงๆ ต้องผ่าน maskPhone
  faculty: string;
  answered: boolean;     // ตอบ Survey แล้วหรือยัง
}

// answers เก็บเป็น string | string[] → แปลงเป็น string เดียว (ไม่มีค่า → "")
const text = (v: string | string[] | undefined) => (Array.isArray(v) ? v.join(", ") : (v ?? ""));

// รับ: ข้อมูลรายงาน
// คืน: ผู้เข้าร่วมทุกคน เรียงลงทะเบียนใหม่สุดก่อน
// ตัวอย่าง (Workshop): [ { id: "e-workshop-reg-46", name: "นภัสวรรณ ฟ้าใสสะอาด", answered: true, … }, … ] ยาว 46
export function buildParticipants(data: ReportData): Participant[] {
  const answered = respondedRegistrationIds(data);
  return [...data.registrations]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((r) => ({
      id: r.id,
      registeredAt: r.createdAt,
      name: text(r.answers.name),
      age: text(r.answers.age),
      gender: text(r.answers.gender),
      phone: text(r.answers.phone),
      faculty: text(r.answers.faculty),
      answered: answered.has(r.id),
    }));
}

// ============ กรองตามแท็บย่อย + คำค้น ============
export type ParticipantFilter = "all" | "answered" | "notAnswered";

// รับ: รายชื่อ, แท็บย่อย, คำค้น
// คืน: เฉพาะคนที่ตรงทั้งแท็บย่อยและคำค้น (คำค้นว่าง = ไม่กรอง)
// คำค้นเทียบกับ: ชื่อ, คณะ/หน่วยงาน, และ "เบอร์ที่ปิดบังแล้ว" เท่านั้น
//   → ค้นได้เฉพาะตัวเลขที่เห็นบนจอ กันการไล่เดาเลขที่ถูกปิด
// ตัวอย่าง (เบอร์จริง 0812344521 → บนจอ "08X-XXX-4521"):
//   "4521" → เจอ | "08X-XXX-4521" → เจอ | "081234" → ไม่เจอ (เลข 1234 ถูกปิดอยู่)
//   "คณะ it" → เจอทุกคนที่อยู่ "คณะ IT" (ไม่สนตัวพิมพ์เล็ก/ใหญ่)
export function filterParticipants(list: Participant[], filter: ParticipantFilter, query: string): Participant[] {
  const q = query.trim().toLowerCase();
  const hasDigit = /\d/.test(q); // เทียบเบอร์เฉพาะเมื่อคำค้นมีตัวเลข (ไม่งั้นพิมพ์ "x" จะเจอทุกเบอร์)

  return list.filter((p) => {
    if (filter === "answered" && !p.answered) return false;
    if (filter === "notAnswered" && p.answered) return false;
    if (q === "") return true;
    return (
      p.name.toLowerCase().includes(q) ||
      p.faculty.toLowerCase().includes(q) ||
      (hasDigit && maskPhone(p.phone).toLowerCase().includes(q))
    );
  });
}

// ============ เลขหน้าที่จะแสดงในแถบแบ่งหน้า ============
// แสดง: หน้าแรก, หน้าสุดท้าย, หน้าปัจจุบัน ±1 ช่วงที่ขาดหาย → "…"
// ตัวอย่าง (ทั้งหมด 5 หน้า):
//   หน้า 1 → [1, 2, "…", 5]   (ตามรูป)
//   หน้า 3 → [1, 2, 3, 4, 5]
//   หน้า 5 → [1, "…", 4, 5]
export function pageNumbers(current: number, totalPages: number): (number | "…")[] {
  const result: (number | "…")[] = [];
  for (let p = 1; p <= totalPages; p++) {
    const show = p === 1 || p === totalPages || Math.abs(p - current) <= 1;
    if (show) result.push(p);
    else if (result.at(-1) !== "…") result.push("…"); // ใส่ "…" ครั้งเดียวต่อช่วงที่ขาด
  }
  return result;
}
