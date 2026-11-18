// app/admin/events/[id]/report/people.ts
// ตัวช่วยเรื่อง "ผู้ลงทะเบียนรายคน" (ไม่มี React / ไม่มี UI)
// ใช้ร่วมกันระหว่าง Dashboard และแท็บ Report (ผู้เข้าร่วม / คำตอบรายคน)
import { BiText, Lang } from "@/types";
import { ReportData } from "./mockData";
import type { ReportQuestion } from "./reportData";
import { scaleMaxOf, tr } from "./summary";

// ============ เวลา "12:38" จาก ISO (รูปแบบเดียวกับ Dashboard) ============
// ตัวอย่าง: formatTime("2026-10-23T12:38:00+07:00", "th") → "12:38"
export function formatTime(iso: string, lang: Lang): string {
  return new Date(iso).toLocaleTimeString(lang === "th" ? "th-TH" : "en-GB", { hour: "2-digit", minute: "2-digit", hour12: false });
}

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
// คำตอบที่ไม่มี registrationId (ส่งจากหน้า /s) ถูกกรองออกก่อน → Set มีแต่ id จริง
export function respondedRegistrationIds(data: ReportData): Set<string> {
  const ids = data.responses.map((r) => r.registrationId).filter((id): id is string => id !== undefined);
  return new Set(ids);
}

// ============ ตัวเลขผู้ตอบ (ใช้ทุกที่ที่แสดง Response rate) ============
// นับ "คน" ไม่ใช่ "คำตอบ" → ตรงกับแท็บผู้เข้าร่วมเสมอ และ Response rate ไม่มีทางเกิน 100%
// - responded : ผู้ลงทะเบียนที่มีคำตอบอย่างน้อย 1 ชุด (นับจากรายชื่อผู้ลงทะเบียนจริงของงานนี้)
// - notYet    : ผู้ลงทะเบียนที่ยังไม่ตอบ = registered − responded (ไม่ติดลบ เพราะ responded ≤ registered)
// - anonymous : คำตอบที่ไม่รู้ว่าเป็นของใคร (ไม่มี registrationId หรือ id ไม่ตรงกับผู้ลงทะเบียนคนไหน)
// ตัวอย่าง (Workshop + คำตอบจากหน้า /s 1 ชุด):
//   { registered: 46, responded: 31, notYet: 15, anonymous: 1 } → Response rate = 31 ÷ 46 = 67%
export interface ResponseCounts {
  registered: number;
  responded: number;
  notYet: number;
  anonymous: number;
}

export function responseCounts(data: ReportData): ResponseCounts {
  const answered = respondedRegistrationIds(data);
  const regIds = new Set(data.registrations.map((r) => r.id));
  const responded = data.registrations.filter((r) => answered.has(r.id)).length;
  const anonymous = data.responses.filter((r) => !r.registrationId || !regIds.has(r.registrationId)).length;
  const registered = data.registrations.length;
  return { registered, responded, notYet: registered - responded, anonymous };
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

// ชื่อที่แสดงแทน เมื่อคำตอบไม่ได้โยงกับผู้ลงทะเบียน (เช่น ตอบจากหน้า /s โดยตรง)
const ANONYMOUS = { th: "ไม่ระบุชื่อ", en: "Anonymous" };

// ============ คำตอบ 1 ชุด (1 รายการในแท็บ "คำตอบรายคน") ============
export interface AnswerEntry {
  id: string;            // response id เช่น "e-workshop-res-31"
  name: string;          // ชื่อผู้ตอบ (จากการลงทะเบียน)
  faculty: string;
  registeredAt: string;  // ISO เวลาลงทะเบียน
  answeredAt: string;    // ISO เวลาตอบ
  answers: Record<string, string | string[] | number>;
  stars: number | null;  // คะแนนข้อ rating ข้อแรก (ข้าม / ไม่มีข้อ rating → null = ไม่แสดงดาว)
}

// รับ: ข้อมูลรายงาน
// คืน: คำตอบทุกชุด + ข้อมูลผู้ตอบ เรียงตอบใหม่สุดก่อน
// ตัวอย่าง (Workshop): ตัวแรก = { id: "e-workshop-res-31", name: "นภัสวรรณ ฟ้าใสสะอาด",
//                      registeredAt: …12:38, answeredAt: …15:00, stars: 5 หรือค่าที่ข้อ 1 ได้ } ยาว 31
// lang: ใช้กับชื่อของผู้ตอบที่ไม่รู้ว่าเป็นใคร ("ไม่ระบุชื่อ" / "Anonymous")
export function buildAnswerEntries(data: ReportData, lang: Lang): AnswerEntry[] {
  const regById = new Map(data.registrations.map((r) => [r.id, r]));

  // ข้อ rating ข้อแรกตามลำดับ order (Workshop = ข้อ 1 "ความพึงพอใจต่อ Workshop")
  const firstRating = [...data.survey.questions].sort((a, b) => a.order - b.order).find((q) => q.type === "rating");

  return [...data.responses]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((r) => {
      // ไม่มี registrationId (ตอบจากหน้า /s) → reg = undefined → ชื่อ "ไม่ระบุชื่อ" (ดู name ด้านล่าง)
      const reg = r.registrationId ? regById.get(r.registrationId) : undefined;
      const score = firstRating ? r.answers[firstRating.id] : undefined;
      return {
        id: r.id,
        // ไม่พบผู้ลงทะเบียน หรือผู้ลงทะเบียนไม่ได้กรอกชื่อ → "ไม่ระบุชื่อ"
        name: text(reg?.answers.name) || tr(ANONYMOUS, lang),
        faculty: text(reg?.answers.faculty),
        registeredAt: reg?.createdAt ?? "",
        answeredAt: r.createdAt,
        answers: r.answers,
        stars: typeof score === "number" ? score : null,
      };
    });
}

// ============ แปลงคำตอบ 1 ข้อเป็นข้อความบนจอ ============
// รับ: คำถาม, ค่าคำตอบ (ข้ามข้อ = undefined), ภาษา
// คืน: ข้อความ หรือ null = "ไม่ได้ตอบ" (หน้าจอแสดงคำนี้เอง)
// คำตอบตัวเลือกเก็บเป็น "ชื่อไทย" → หาชื่อตามภาษาจาก question.options (ไม่เจอ → แสดงค่าเดิม)
// ตัวอย่าง:
//   rating 4 (คะแนนเต็ม 5)                   → "4 / 5"
//   linear 9 (ratingMax 10)                  → "9 / 10"
//   single "พอดี" (EN)                      → "Just right"   (opinion / yesno ใช้วิธีเดียวกัน)
//   multi ["Auto layout", "Prototype"]      → "Auto layout, Prototype" (ทุกตัวที่เลือก คั่นด้วยจุลภาค)
//   mcgrid ["ดี", "พอใช้"]                  → "หัวข้อ 1: ดี · หัวข้อ 2: พอใช้"
//   cbgrid ["หัวข้อ 1::ดี", "หัวข้อ 1::พอใช้"] → "หัวข้อ 1: ดี, พอใช้"
//   long "อธิบายเข้าใจง่าย …"                → ข้อความเดิม
//   undefined หรือ []                       → null
export function formatAnswer(question: ReportQuestion, value: string | string[] | number | undefined, lang: Lang): string | null {
  if (value === undefined || value === "" || (Array.isArray(value) && value.length === 0)) return null;

  // ชื่อตามภาษา จากรายการ BiText (ไม่เจอ → แสดงค่าเดิม)
  const labelIn = (list: BiText[] | undefined, th: string) => {
    const item = list?.find((o) => o.th === th);
    return item ? tr(item, lang) : th;
  };
  const optionLabel = (th: string) => labelIn(question.options, th);

  switch (question.type) {
    case "rating":
    case "linear":
      return `${value} / ${scaleMaxOf(question)}`;
    case "single":
    case "dropdown":
    case "opinion":
    case "yesno":
    case "multi":
      return (Array.isArray(value) ? value : [String(value)]).map(optionLabel).join(", ");
    case "mcgrid":
    case "cbgrid":
      return formatGridAnswer(question, value, labelIn) ?? null;
    default:
      return String(value);
  }
}

// ตารางเป็นข้อความ "แถว: คอลัมน์" คั่นแต่ละแถวด้วย " · " (แถวที่ไม่ได้ตอบไม่แสดง)
// ค่าที่ไม่รู้จัก / รูปแบบผิด → ข้าม · ไม่เหลืออะไรเลย → null ("ไม่ได้ตอบ")
function formatGridAnswer(
  question: ReportQuestion,
  value: string | string[] | number,
  labelIn: (list: BiText[] | undefined, th: string) => string
): string | null {
  if (!Array.isArray(value)) return null;
  const rows = question.rows ?? [];
  const parts: string[] = [];
  // คอลัมน์ที่ไม่มีในคำถาม → ข้าม (กติกาเดียวกับ summarize() ตัวเลขกับข้อความจึงตรงกัน)
  const isColumn = (th: string) => (question.options ?? []).some((o) => o.th === th);

  if (question.type === "mcgrid") {
    // ช่องที่ i = คำตอบของแถว i
    rows.forEach((row, i) => {
      const picked = value[i];
      if (picked && isColumn(picked)) parts.push(`${labelIn(rows, row.th)}: ${labelIn(question.options, picked)}`);
    });
  } else {
    // "แถว::คอลัมน์" → รวมคอลัมน์ของแถวเดียวกัน เรียงตามลำดับแถวในคำถาม
    rows.forEach((row) => {
      const cols = value
        .filter((cell) => typeof cell === "string" && cell.startsWith(`${row.th}::`))
        .map((cell) => cell.slice(row.th.length + 2))
        .filter(isColumn)
        .map((col) => labelIn(question.options, col));
      if (cols.length > 0) parts.push(`${labelIn(rows, row.th)}: ${cols.join(", ")}`);
    });
  }
  return parts.length > 0 ? parts.join(" · ") : null;
}
