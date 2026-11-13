// lib/mock/responses.ts
import { Registration, SurveyResponse } from "@/types";

// ข้อมูลคนลงทะเบียน + คำตอบ Survey ตัวอย่าง — store โหลดไปเป็นค่าเริ่มต้น แล้วเก็บลง localStorage
// ตัวเลขตั้งให้ตรงกับ Figma: ลงทะเบียนรวม 642 · ตอบ Survey 247 (38.5%)
// ⚠️ แก้ไฟล์นี้แล้วต้องล้าง localStorage (key "esp.session") ไม่งั้นเว็บยังใช้ข้อมูลชุดเก่าที่เก็บไว้

// ============ จำนวนต่อ Event ============
// key = id ของ Event ใน lib/mock/events.ts
// walkIn = คนที่มาลงทะเบียนหน้างาน นับทีละช่วง 30 นาที เริ่มที่ walkInFrom (กราฟแท่งหน้า ③)
// ที่เหลือ (registered − walk-in) = ลงทะเบียนล่วงหน้า กระจายช่วง 14 วันก่อนงาน
const PLAN: Record<
  string,
  { date: string; registered: number; responded: number; walkInFrom?: string; walkIn?: number[] }
> = {
  "e-career":    { date: "2026-10-25", registered: 320, responded: 0 },   // ใกล้ถึง → ยังไม่มีใครตอบ
  "e-openhouse": { date: "2026-10-20", registered: 180, responded: 144 },
  "e-comm":      { date: "2026-10-18", registered: 96,  responded: 72 },
  // กำลังจัดงาน — ทั้ง 46 คนลงทะเบียนหน้างาน ตัวเลขต่อช่วงตาม Figma (10:00 = 12 คน, 10:30 = 14 คน, …)
  "e-workshop":  {
    date: "2026-10-23", registered: 46, responded: 31,
    walkInFrom: "10:00", walkIn: [12, 14, 8, 6, 4, 2],
  },
};

// ============ ตัวสุ่มแบบกำหนด seed ============
// seed เดิม → ได้ข้อมูลชุดเดิมทุกครั้ง (ถ้าใช้ Math.random ข้อมูลจะเปลี่ยนทุกครั้งที่เปิดเว็บ)
function makeRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;   // เลข 0 ถึง <1
  };
}

const FIRST_NAMES = ["สมชาย", "สมหญิง", "กิตติ", "ปิยะ", "อรอุมา", "ธนา", "วรรณา", "ภูมิ", "ณิชา", "ศุภชัย"];
const LAST_NAMES = ["ใจดี", "สุขใจ", "แสงทอง", "มีสุข", "รุ่งเรือง", "ศรีสุข", "บุญมา", "ทองดี"];
const GENDERS = ["male", "female", "female", "other"];  // female 2 ช่อง = ออกบ่อยกว่า

// คะแนนความพึงพอใจ 1–5: ใส่ซ้ำตามสัดส่วนใน Figma (5★ 14 · 4★ 11 · 3★ 4 · 2★ 2 · 1★ 0) แล้วสุ่มหยิบ
const SATISFACTION = [
  ...Array<number>(14).fill(5),
  ...Array<number>(11).fill(4),
  ...Array<number>(4).fill(3),
  ...Array<number>(2).fill(2),
];

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

// ============ สร้างข้อมูล ============
const rand = makeRandom(2569);
const pick = <T,>(list: T[]) => list[Math.floor(rand() * list.length)];

export const mockRegistrations: Registration[] = [];
export const mockResponses: SurveyResponse[] = [];

Object.entries(PLAN).forEach(([eventId, plan]) => {
  const start = new Date(`${plan.date}T09:00:00+07:00`).getTime();
  let n = 0;   // เลขลำดับคนลงทะเบียนของ Event นี้ (ใช้ทำ id)

  const addRegistration = (createdAt: number) => {
    n++;
    mockRegistrations.push({
      id: `reg-${eventId}-${n}`,
      eventId,
      createdAt: new Date(createdAt).toISOString(),
      answers: {
        name: `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`,
        gender: pick(GENDERS),
        age: String(18 + Math.floor(rand() * 23)),   // 18–40 ปี
      },
    });
  };

  // ลงทะเบียนหน้างาน: ช่วงที่ i เริ่ม walkInFrom + i × 30 นาที → สุ่มเวลาในช่วง 30 นาทีนั้น
  const walkIn = plan.walkIn ?? [];
  if (plan.walkInFrom) {
    const from = new Date(`${plan.date}T${plan.walkInFrom}:00+07:00`).getTime();
    walkIn.forEach((count, i) => {
      for (let k = 0; k < count; k++) {
        addRegistration(from + i * 30 * MINUTE + rand() * 30 * MINUTE);
      }
    });
  }

  // ลงทะเบียนล่วงหน้า (ส่วนที่เหลือ): กระจายช่วง 14 วันก่อนงาน
  const walkInTotal = walkIn.reduce((sum, c) => sum + c, 0);
  for (let i = 0; i < plan.registered - walkInTotal; i++) {
    addRegistration(start - rand() * 14 * DAY);
  }

  // ตอบ Survey: บ่ายวันงาน ถึง 2 วันหลังงาน
  for (let i = 1; i <= plan.responded; i++) {
    mockResponses.push({
      id: `res-${eventId}-${i}`,
      eventId,
      createdAt: new Date(start + 5 * HOUR + rand() * 2 * DAY).toISOString(),
      answers: {
        satisfaction: pick(SATISFACTION),   // คะแนน 1–5
      },
    });
  }
});
