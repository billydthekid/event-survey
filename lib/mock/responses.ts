// lib/mock/responses.ts
import { Registration, SurveyResponse } from "@/types";

// ข้อมูลคนลงทะเบียน + คำตอบ Survey ตัวอย่าง — store โหลดไปเป็นค่าเริ่มต้น แล้วเก็บลง localStorage
// ตัวเลขตั้งให้ตรงกับ Figma: ลงทะเบียนรวม 642 · ตอบ Survey 247 (38.5%)

// ============ จำนวนต่อ Event ============
// key = id ของ Event ใน lib/mock/events.ts
const PLAN: Record<string, { date: string; registered: number; responded: number }> = {
  "e-career":    { date: "2026-10-25", registered: 320, responded: 0 },   // ใกล้ถึง → ยังไม่มีใครตอบ
  "e-openhouse": { date: "2026-10-20", registered: 180, responded: 144 },
  "e-comm":      { date: "2026-10-18", registered: 96,  responded: 72 },
  "e-workshop":  { date: "2026-10-23", registered: 46,  responded: 31 },  // กำลังจัดงาน
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

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

// ============ สร้างข้อมูล ============
const rand = makeRandom(2569);
const pick = <T,>(list: T[]) => list[Math.floor(rand() * list.length)];

export const mockRegistrations: Registration[] = [];
export const mockResponses: SurveyResponse[] = [];

Object.entries(PLAN).forEach(([eventId, plan]) => {
  const start = new Date(`${plan.date}T09:00:00+07:00`).getTime();

  // ลงทะเบียน: กระจายช่วง 14 วันก่อนงาน
  for (let i = 1; i <= plan.registered; i++) {
    mockRegistrations.push({
      id: `reg-${eventId}-${i}`,
      eventId,
      createdAt: new Date(start - rand() * 14 * DAY).toISOString(),
      answers: {
        name: `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`,
        gender: pick(GENDERS),
        age: String(18 + Math.floor(rand() * 23)),   // 18–40 ปี
      },
    });
  }

  // ตอบ Survey: บ่ายวันงาน ถึง 2 วันหลังงาน
  for (let i = 1; i <= plan.responded; i++) {
    mockResponses.push({
      id: `res-${eventId}-${i}`,
      eventId,
      createdAt: new Date(start + 5 * HOUR + rand() * 2 * DAY).toISOString(),
      answers: {
        satisfaction: 3 + Math.floor(rand() * 3),   // คะแนน 3–5
      },
    });
  }
});
