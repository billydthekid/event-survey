// lib/mock/responses.ts
import { Question, Registration, Survey, SurveyResponse } from "@/types";

// ข้อมูลตัวอย่าง: คำถาม Survey + คนลงทะเบียน + คำตอบ — store โหลดไปเป็นค่าเริ่มต้น แล้วเก็บลง localStorage
// 13 พ.ย. เปลี่ยนมาใช้ชุดเดียวกับหน้า Report ของธณัฐจักร (app/admin/events/[id]/report/mockData.ts)
//   → ทั้งทีมเห็นตัวเลขเดียวกัน · ก๊อปวิธีสร้างข้อมูลมาทั้งชุด (ตัวเลขทุกตัวเท่าของเพื่อน)
//   workshop 46 / 31 · openhouse 120 / 74 · comm 38 / 29 · e-career (ของ Jin) 320 / 0 → รวม 524 / 134
// ⚠️ แก้ไฟล์นี้แล้ว store จะยังใช้ข้อมูลเก่าใน localStorage (key "esp.session") — ล้าง หรือเพิ่ม version ใน migrate ของ store

// ============ คำตอบ Survey ที่รู้ว่าเป็นของผู้ลงทะเบียนคนไหน ============
// types/ ยังไม่มีช่องนี้ → เติมเฉพาะในข้อมูลตัวอย่าง (store เก็บไปด้วย) แบบเดียวกับ ReportResponse ของเพื่อน
export interface MockResponse extends SurveyResponse {
  registrationId: string;   // เช่น "e-workshop-reg-46"
}

// ค่าเพศที่เก็บใน answers.gender
type Gender = "male" | "female" | "unspecified";

// ============ เครื่องมือสร้างข้อมูลแบบคงที่ (ไม่ใช้ Math.random → ตัวเลขเท่าเดิมทุกครั้ง) ============

// หา ห.ร.ม.
function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

// หา "ก้าวกระโดด" ที่ไม่มีตัวหารร่วมกับ n (เช่น n = 46 → 7) ใช้สลับลำดับแบบไม่ซ้ำ
function stepFor(n: number): number {
  let p = 7;
  while (gcd(p, n) !== 1) p += 2;
  return p;
}

// spread: [ค่า, จำนวน] → array ที่มีค่าครบตามจำนวน แต่สลับลำดับ (ไม่เรียงเป็นก้อน)
// เช่น [["male", 2], ["female", 1]] → เรียง ["male","male","female"] แล้วหยิบตำแหน่ง (k × step) % n
function spread<T>(counts: [T, number][]): T[] {
  const ordered: T[] = counts.flatMap(([value, count]) => Array<T>(count).fill(value));
  const n = ordered.length;
  const step = stepFor(n);
  return ordered.map((_, k) => ordered[(k * step) % n]);
}

// วันเวลา ISO เวลาไทย เช่น at("2026-10-23", 515) → "2026-10-23T08:35:00+07:00"
function at(date: string, minutesFrom0: number): string {
  const h = String(Math.floor(minutesFrom0 / 60) % 24).padStart(2, "0");
  const m = String(minutesFrom0 % 60).padStart(2, "0");
  return `${date}T${h}:${m}:00+07:00`;
}

// ย้อนวันที่ไป n วัน เช่น daysBefore("2026-10-25", 3) → "2026-10-22"
function daysBefore(date: string, n: number): string {
  const d = new Date(new Date(`${date}T00:00:00+07:00`).getTime() - n * 24 * 60 * 60 * 1000);
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Bangkok" }).format(d);
}

// ============ ชื่อสมมติ ============
const FIRST = ["ภูมิรพี", "ชลธิชา", "ณภัทร", "กานต์ธิดา", "ปุณณวิช", "วริศรา", "ธีรภัทร", "พิมพ์ลภัส", "อชิรวิทย์", "นภัสวรรณ", "ศุภกร", "ไอริณ"];
const LAST = ["ดาวประกาย", "ทองนพเก้า", "ฟ้าใสสะอาด", "แสงเรืองรอง", "ศรีสายลม", "ใบไม้เขียว", "จันทร์ทอแสง"];
const FACULTIES = ["คณะ IT", "คณะวิศวกรรมศาสตร์", "คณะบริหารธุรกิจ", "คณะนิเทศศาสตร์", "คณะศิลปกรรม"];

// ช่วงอายุ → อายุจริง (วนตามลำดับ)
const AGE_POOL: Record<string, number[]> = {
  u18: [17, 18],
  a19: [19, 20, 21, 22],
  a23: [23, 24, 26, 28, 30],
  a31: [31, 35, 42],
};

// ============ เวลาลงทะเบียน ============
// slots: [นาทีเริ่มช่วง, จำนวนคน] เช่น [[600, 12], [630, 14]] (600 = 10:00)
// คนที่ k ในช่วง = เริ่มช่วง + (k + 1) × ระยะห่าง, ระยะห่าง = min(4, floor(29 ÷ จำนวน)) → อยู่ในช่วง 30 นาทีเสมอ
function slotMinutes(slots: [number, number][]): number[] {
  return slots.flatMap(([start, count]) => {
    const step = Math.min(4, Math.floor(29 / count));
    return Array.from({ length: count }, (_, k) => start + (k + 1) * step);
  });
}

// เวลาลงทะเบียนของคนที่ i — 3 แบบ:
// - slots: ตามช่วง 30 นาที (ลงทะเบียนหน้างาน)
// - advanceDays: ล่วงหน้า กระจาย N วันก่อนงาน เวลา 09:00–18:59 (ของ Jin: e-career)
// - ไม่ส่ง: เริ่ม startMinute วันงาน ห่างกันคนละ 3 นาที (กฎเดิมของเพื่อน)
interface TimeRule {
  startMinute: number;
  slots?: [number, number][];
  advanceDays?: number;
}

// ============ สร้างผู้ลงทะเบียน ============
function makeRegistrations(
  eventId: string,
  date: string,
  genders: [Gender, number][],
  ages: [keyof typeof AGE_POOL, number][],
  time: TimeRule
): Registration[] {
  const g = spread(genders);
  const a = spread(ages);
  const minutes = time.slots ? slotMinutes(time.slots) : [];
  // ⚠️ ยอดรวมใน slots ต้องเท่าจำนวนผู้ลงทะเบียน ไม่งั้นกลับไปใช้กฎ startMinute ทั้งชุด
  const useSlots = minutes.length === g.length;

  const createdAt = (i: number): string => {
    if (useSlots) return at(date, minutes[i]);
    if (time.advanceDays) {
      return at(daysBefore(date, 1 + (i % time.advanceDays)), 9 * 60 + ((i * 37) % 600));
    }
    return at(date, time.startMinute + i * 3);
  };

  return g.map((gender, i) => {
    const pool = AGE_POOL[a[i]];
    return {
      id: `${eventId}-reg-${i + 1}`,
      eventId,
      createdAt: createdAt(i),
      answers: {
        name: `${FIRST[i % FIRST.length]} ${LAST[(i * 3) % LAST.length]}`,
        gender,
        age: String(pool[i % pool.length]),
        // เบอร์ปลอมเต็ม 10 หลัก (หน้าจอต้องปิดบางส่วนก่อนแสดง)
        phone: `0${[8, 9, 6][i % 3]}${String((i * 4271) % 10000).padStart(4, "0")}${String(1000 + ((i * 7919) % 9000))}`,
        faculty: FACULTIES[(i * 2) % FACULTIES.length],
      },
    };
  });
}

// ============ สร้างคำตอบ Survey ============
// แต่ละข้อกำหนดคำตอบแบบคงที่:
// - pick  (rating / single / dropdown): [ค่า, จำนวน] (รวมน้อยกว่าผู้ตอบ = บางคนข้ามข้อนี้)
// - multi: ตัวเลือกละ "จำนวนคนที่เลือก"
// - text  (short / long): ข้อความตัวอย่าง + จำนวนคนที่ตอบ
type Plan =
  | { kind: "pick"; counts: [string | number, number][] }
  | { kind: "multi"; counts: [string, number][] }
  | { kind: "text"; samples: string[]; count: number };

function makeResponses(
  eventId: string,
  date: string,
  startMinute: number,
  total: number,
  plans: Record<string, Plan>
): SurveyResponse[] {
  const step = stepFor(total);

  // คำตอบของแต่ละข้อ (ยาว total ช่อง, undefined = ไม่ตอบ)
  const perQuestion: Record<string, (string | string[] | number | undefined)[]> = {};
  for (const [qid, plan] of Object.entries(plans)) {
    if (plan.kind === "pick") {
      const values = spread<string | number | undefined>(plan.counts);
      while (values.length < total) values.push(undefined);
      perQuestion[qid] = values;
    } else if (plan.kind === "multi") {
      // คนที่ r เลือกตัวเลือก j ถ้า (r × step + j × 5) % total น้อยกว่าจำนวนที่กำหนด
      perQuestion[qid] = Array.from({ length: total }, (_, r) =>
        plan.counts.filter(([, count], j) => (r * step + j * 5) % total < count).map(([v]) => v)
      );
    } else {
      perQuestion[qid] = Array.from({ length: total }, (_, r) =>
        r < plan.count ? plan.samples[r % plan.samples.length] : undefined
      );
    }
  }

  return Array.from({ length: total }, (_, r) => {
    const answers: Record<string, string | string[] | number> = {};
    for (const qid of Object.keys(plans)) {
      const v = perQuestion[qid][r];
      if (v !== undefined && !(Array.isArray(v) && v.length === 0)) answers[qid] = v;
    }
    return { id: `${eventId}-res-${r + 1}`, eventId, createdAt: at(date, startMinute + r * 4), answers };
  });
}

// ============ จับคู่คำตอบ ↔ ผู้ลงทะเบียน ============
// เลือกคนที่ตอบ: ลำดับที่ (k × step) % n (ไม่ซ้ำกัน) → เรียงทั้งคนและคำตอบตามเวลา แล้วจับคู่ตามลำดับ
// (ลงทะเบียนเร็วสุด ↔ ตอบเร็วสุด) → เวลาตอบอยู่หลังเวลาลงทะเบียนเสมอ
function linkResponses(registrations: Registration[], responses: SurveyResponse[]): MockResponse[] {
  const n = registrations.length;
  const step = stepFor(n);
  const byTime = (a: { createdAt: string }, b: { createdAt: string }) => a.createdAt.localeCompare(b.createdAt);

  const regsByTime = [...registrations].sort(byTime);
  const chosen = responses
    .map((_, k) => (k * step) % n)
    .sort((a, b) => a - b)
    .map((i) => regsByTime[i]);

  const linkOf = new Map<string, string>();
  [...responses].sort(byTime).forEach((r, k) => linkOf.set(r.id, chosen[k].id));

  return responses.map((r) => ({ ...r, registrationId: linkOf.get(r.id)! }));
}

// ============ ตัวช่วยสร้างคำถาม ============
// rating / single = บังคับตอบ (ข้ออื่นทับเองได้)
const q = (
  id: string,
  order: number,
  type: Question["type"],
  th: string,
  en: string,
  options?: [string, string][]
): Question => ({
  id,
  order,
  type,
  title: { th, en },
  required: type === "rating" || type === "single",
  options: options?.map(([oth, oen]) => ({ th: oth, en: oen })),
});

// ============ คำถาม Survey ของแต่ละ Event (store ใส่ลง event.survey) ============
// e-career ยังไม่มี Survey (ใกล้ถึง)
export const mockSurveys: Record<string, Survey> = {
  "e-workshop": {
    id: "sv-workshop",
    title: { th: "แบบประเมิน Workshop", en: "Workshop feedback" },
    enabled: true,
    questions: [
      q("q1", 1, "rating", "ความพึงพอใจต่อ Workshop", "Workshop satisfaction"),
      q("q2", 2, "single", "ทราบข่าวจากช่องทางใด", "How did you hear about us?", [
        ["Facebook คณะ", "Faculty Facebook"], ["อาจารย์ / เพื่อน", "Teacher / friend"], ["โปสเตอร์", "Poster"], ["อื่นๆ", "Other"],
      ]),
      q("q3", 3, "rating", "ความยากของเนื้อหา", "Content difficulty"),
      {
        ...q("q4", 4, "multi", "หัวข้อที่ได้ประโยชน์มากที่สุด", "Most useful topics", [
          ["Auto layout", "Auto layout"], ["Component", "Component"], ["Prototype", "Prototype"], ["Frame & Grid", "Frame & Grid"],
        ]),
        required: true,    // ทุกคนตอบ (31 คน)
      },
      {
        ...q("q5", 5, "single", "ความเหมาะสมของระยะเวลา", "Session length", [
          ["สั้นไป", "Too short"], ["พอดี", "Just right"], ["ยาวไป", "Too long"],
        ]),
        required: false,   // ไม่บังคับ (ตอบ 26 จาก 31)
      },
      q("q6", 6, "short", "อยากให้จัดหัวข้ออะไรต่อ", "Topics for next time"),
      q("q7", 7, "long", "ข้อเสนอแนะเพิ่มเติม", "Other suggestions"),
    ],
  },
  "e-openhouse": {
    id: "sv-openhouse",
    title: { th: "แบบสอบถามวันเปิดบ้าน", en: "Open house survey" },
    enabled: true,
    questions: [
      q("q1", 1, "rating", "ความพึงพอใจโดยรวม", "Overall satisfaction"),
      q("q2", 2, "single", "สนใจศึกษาต่อคณะใด", "Which faculty interests you?", [
        ["คณะ IT", "IT"], ["คณะวิศวกรรมศาสตร์", "Engineering"], ["คณะบริหารธุรกิจ", "Business"], ["อื่นๆ", "Other"],
      ]),
      q("q3", 3, "short", "สิ่งที่ประทับใจที่สุด", "What impressed you most?"),
    ],
  },
  "e-comm": {
    id: "sv-comm",
    title: { th: "แบบประเมินการบรรยาย", en: "Talk feedback" },
    enabled: true,
    questions: [
      q("q1", 1, "rating", "ความพึงพอใจต่อการบรรยาย", "Talk satisfaction"),
      q("q2", 2, "single", "ทราบข่าวจากช่องทางใด", "How did you hear about us?", [
        ["Facebook คณะ", "Faculty Facebook"], ["LINE กลุ่ม", "LINE group"], ["อาจารย์", "Teacher"], ["อื่นๆ", "Other"],
      ]),
      q("q3", 3, "long", "ข้อเสนอแนะ", "Suggestions"),
    ],
  },
};

// ============ ผู้ลงทะเบียนแต่ละ Event ============
const REGISTRATIONS: Record<string, Registration[]> = {
  // ช่วง 30 นาทีตาม Figma Dashboard: 12 / 14 / 8 / 6 / 4 / 2 = 46 คน (10:02 – 12:38)
  "e-workshop": makeRegistrations(
    "e-workshop", "2026-10-23",
    [["male", 24], ["female", 19], ["unspecified", 3]],
    [["u18", 3], ["a19", 31], ["a23", 8], ["a31", 4]],
    { startMinute: 8 * 60, slots: [[600, 12], [630, 14], [660, 8], [690, 6], [720, 4], [750, 2]] }
  ),
  "e-openhouse": makeRegistrations(
    "e-openhouse", "2026-10-20",
    [["male", 52], ["female", 61], ["unspecified", 7]],
    [["u18", 68], ["a19", 40], ["a23", 8], ["a31", 4]],
    { startMinute: 7 * 60 + 30 }
  ),
  "e-comm": makeRegistrations(
    "e-comm", "2026-10-18",
    [["male", 15], ["female", 21], ["unspecified", 2]],
    [["u18", 2], ["a19", 24], ["a23", 9], ["a31", 3]],
    { startMinute: 8 * 60 }
  ),
  // ของ Jin: ใกล้ถึง ลงทะเบียนล่วงหน้า 320 คน กระจาย 14 วันก่อนงาน · ยังไม่มีใครตอบ
  "e-career": makeRegistrations(
    "e-career", "2026-10-25",
    [["male", 140], ["female", 165], ["unspecified", 15]],
    [["u18", 10], ["a19", 230], ["a23", 60], ["a31", 20]],
    { startMinute: 9 * 60, advanceDays: 14 }
  ),
};

// ============ คำตอบแต่ละ Event ============
const RESPONSES: Record<string, SurveyResponse[]> = {
  "e-workshop": makeResponses("e-workshop", "2026-10-23", 13 * 60, 31, {
    q1: { kind: "pick", counts: [[5, 14], [4, 11], [3, 4], [2, 2], [1, 0]] },
    q2: { kind: "pick", counts: [["Facebook คณะ", 13], ["อาจารย์ / เพื่อน", 11], ["โปสเตอร์", 5], ["อื่นๆ", 2]] },
    q3: { kind: "pick", counts: [[5, 2], [4, 8], [3, 14], [2, 6], [1, 1]] },
    q4: { kind: "multi", counts: [["Auto layout", 22], ["Component", 18], ["Prototype", 15], ["Frame & Grid", 9]] },
    q5: { kind: "pick", counts: [["สั้นไป", 6], ["พอดี", 17], ["ยาวไป", 3]] },
    q6: { kind: "text", count: 24, samples: ["Design system เบื้องต้น", "การใช้ Variables กับหลายธีม", "ทำ Prototype ให้ดูเหมือนแอปจริง"] },
    q7: { kind: "text", count: 18, samples: ["อยากให้มีเวลาฝึกทำเองมากกว่านี้", "อธิบายเข้าใจง่าย ไฟล์ตัวอย่างช่วยได้เยอะ", "ห้องเย็นไป แนะนำให้แจ้งล่วงหน้า"] },
  }),
  "e-openhouse": makeResponses("e-openhouse", "2026-10-20", 12 * 60, 74, {
    q1: { kind: "pick", counts: [[5, 30], [4, 28], [3, 12], [2, 3], [1, 1]] },
    q2: { kind: "pick", counts: [["คณะ IT", 25], ["คณะวิศวกรรมศาสตร์", 20], ["คณะบริหารธุรกิจ", 17], ["อื่นๆ", 12]] },
    q3: { kind: "text", count: 40, samples: ["ห้อง Lab ทันสมัย", "รุ่นพี่แนะนำดีมาก", "กิจกรรมสนุก"] },
  }),
  "e-comm": makeResponses("e-comm", "2026-10-18", 15 * 60, 29, {
    q1: { kind: "pick", counts: [[5, 12], [4, 11], [3, 5], [2, 1], [1, 0]] },
    q2: { kind: "pick", counts: [["Facebook คณะ", 10], ["LINE กลุ่ม", 9], ["อาจารย์", 7], ["อื่นๆ", 3]] },
    q3: { kind: "text", count: 15, samples: ["อยากให้มีตัวอย่างเคสจริงมากขึ้น", "เนื้อหาใช้ได้จริง"] },
  }),
};

// ============ ส่งออกให้ store ============
export const mockRegistrations: Registration[] = Object.values(REGISTRATIONS).flat();
export const mockResponses: MockResponse[] = Object.entries(RESPONSES).flatMap(([eventId, list]) =>
  linkResponses(REGISTRATIONS[eventId], list)
);

// ใส่คำถาม Survey ตัวอย่างให้ Event ที่ยังไม่มี (ใช้ตอนเริ่ม store และตอน migrate ข้อมูลเก่า)
export function withMockSurvey<T extends { id: string; survey?: Survey }>(event: T): T {
  return !event.survey && mockSurveys[event.id] ? { ...event, survey: mockSurveys[event.id] } : event;
}
