// app/admin/events/[id]/report/mockData.ts
// ⚠️ ข้อมูลจำลองชั่วคราว สำหรับหน้า Report เท่านั้น
// - store ยังไม่มีรายการ Registration / SurveyResponse และ event.survey ยังว่าง
// - เมื่อมีข้อมูลจริง (store หรือ API) ให้ลบไฟล์นี้ แล้วเปลี่ยน getReportData() ไปอ่านจากแหล่งจริง
// - ชื่อทั้งหมดเป็นชื่อสมมติ เบอร์โทรปิดบางส่วน
// - สร้างแบบคงที่: ไม่ใช้ Math.random ตัวเลขจึงเท่าเดิมทุกครั้งที่เปิด
import { BiText, Question, Registration, Survey, SurveyResponse } from "@/types";

// ============ ข้อมูลที่หน้า Report ใช้ ============
export interface ReportData {
  survey: Survey;
  registrations: Registration[];
  responses: SurveyResponse[];
  // คำกำกับปลายสเกล Rating ต่อคำถาม (type Question ยังไม่มีช่องนี้) ไม่มี → แสดงแค่ตัวเลข
  // เช่น { q1: { max: "ดีมาก", min: "ควรปรับปรุง" } } → แถว "5 ดีมาก" และ "1 ควรปรับปรุง"
  ratingLabels?: Record<string, RatingLabel>;
}

export interface RatingLabel {
  max: BiText;   // คำกำกับคะแนน 5
  min: BiText;   // คำกำกับคะแนน 1
  hint?: BiText; // คำอธิบายสเกลในบรรทัดสรุป เช่น "1 = ง่าย, 5 = ยาก"
}

// ค่าเพศที่เก็บใน answers.gender (หน้าจอแปลงเป็นข้อความ TH/EN เอง)
export type Gender = "male" | "female" | "unspecified";

// ============ เครื่องมือสร้างข้อมูลแบบคงที่ ============

// หา ห.ร.ม.
function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

// หา "ก้าวกระโดด" ที่ไม่มีตัวหารร่วมกับ n (เช่น n=46 → 7) ใช้สลับลำดับแบบไม่ซ้ำ
function stepFor(n: number): number {
  let p = 7;
  while (gcd(p, n) !== 1) p += 2;
  return p;
}

// spread: รับ [ค่า, จำนวน] แล้วคืน array ยาว n ที่มีค่าครบตามจำนวน แต่กระจายลำดับ (ไม่เรียงเป็นก้อน)
// ตัวอย่าง: spread([["male",2],["female",1]]) → เรียงก่อน ["male","male","female"]
//           แล้วหยิบตำแหน่ง (k × step) % n → ลำดับสลับกันแต่จำนวนแต่ละค่ายังเท่าเดิม
function spread<T>(counts: [T, number][]): T[] {
  const ordered: T[] = counts.flatMap(([value, count]) => Array<T>(count).fill(value));
  const n = ordered.length;
  const step = stepFor(n);
  return ordered.map((_, k) => ordered[(k * step) % n]);
}

// วันเวลาแบบ ISO เวลาไทย เช่น at("2026-10-23", 515) → "2026-10-23T08:35:00+07:00"
function at(date: string, minutesFrom0: number): string {
  const h = String(Math.floor(minutesFrom0 / 60) % 24).padStart(2, "0");
  const m = String(minutesFrom0 % 60).padStart(2, "0");
  return `${date}T${h}:${m}:00+07:00`;
}

// ============ ชื่อสมมติ (ประกอบจากชื่อต้น + นามสกุลที่แต่งขึ้น) ============
const FIRST = ["ภูมิรพี", "ชลธิชา", "ณภัทร", "กานต์ธิดา", "ปุณณวิช", "วริศรา", "ธีรภัทร", "พิมพ์ลภัส", "อชิรวิทย์", "นภัสวรรณ", "ศุภกร", "ไอริณ"];
const LAST = ["ดาวประกาย", "ทองนพเก้า", "ฟ้าใสสะอาด", "แสงเรืองรอง", "ศรีสายลม", "ใบไม้เขียว", "จันทร์ทอแสง"];
const FACULTIES = ["คณะ IT", "คณะวิศวกรรมศาสตร์", "คณะบริหารธุรกิจ", "คณะนิเทศศาสตร์", "คณะศิลปกรรม"];

// ช่วงอายุ → อายุจริงที่ใช้สร้าง (วนตามลำดับ)
const AGE_POOL: Record<string, number[]> = {
  u18: [17, 18],
  a19: [19, 20, 21, 22],
  a23: [23, 24, 26, 28, 30],
  a31: [31, 35, 42],
};

// ============ เวลาลงทะเบียนตามช่วง 30 นาที ============
// slots: [นาทีเริ่มช่วง, จำนวนคนในช่วง] เช่น [[600, 12], [630, 14]] (600 = 10:00)
// คนที่ k ในช่วง = เริ่มช่วง + (k + 1) × ระยะห่าง, ระยะห่าง = min(4, floor(29 ÷ จำนวน))
// → ทุกคนอยู่ในช่วง 30 นาทีของตัวเองเสมอ
// ตัวอย่าง: [750, 2] → ระยะห่าง 4 → 12:34, 12:38 | [630, 14] → ระยะห่าง 2 → 10:32 … 10:58
function slotMinutes(slots: [number, number][]): number[] {
  return slots.flatMap(([start, count]) => {
    const step = Math.min(4, Math.floor(29 / count));
    return Array.from({ length: count }, (_, k) => start + (k + 1) * step);
  });
}

// ============ สร้างผู้ลงทะเบียน ============
// slots (ไม่บังคับ): กำหนดเวลาลงทะเบียนตามช่วง — ไม่ส่ง หรือยอดรวมไม่เท่าจำนวนคน
// → ใช้กฎเดิม: เริ่ม startMinute แล้วห่างกันคนละ 3 นาที
function makeRegistrations(
  eventId: string,
  date: string,
  startMinute: number,
  genders: [Gender, number][],
  ages: [keyof typeof AGE_POOL, number][],
  slots?: [number, number][]
): Registration[] {
  const g = spread(genders);
  const a = spread(ages);
  const minutes = slots ? slotMinutes(slots) : [];
  // ⚠️ ยอดรวมใน slots ต้องเท่ากับจำนวนผู้ลงทะเบียน ไม่งั้นจะกลับไปใช้กฎเดิมทั้งชุด
  const useSlots = minutes.length === g.length;
  return g.map((gender, i) => {
    const pool = AGE_POOL[a[i]];
    return {
      id: `${eventId}-reg-${i + 1}`,
      eventId,
      createdAt: at(date, useSlots ? minutes[i] : startMinute + i * 3),
      answers: {
        name: `${FIRST[i % FIRST.length]} ${LAST[(i * 3) % LAST.length]}`,
        gender,
        age: String(pool[i % pool.length]),
        phone: `0${[8, 9, 6][i % 3]}X-XXX-${String(1000 + ((i * 7919) % 9000))}`, // ปิดบางส่วน
        faculty: FACULTIES[(i * 2) % FACULTIES.length],
      },
    };
  });
}

// ============ สร้างคำตอบ Survey ============
// plan: สำหรับแต่ละคำถาม กำหนดคำตอบแบบคงที่
// - rating/single: [ค่า, จำนวน] → กระจายด้วย spread (ถ้าจำนวนรวม < ผู้ตอบ = บางคนข้ามข้อนี้)
// - multi: ตัวเลือกละ "จำนวนคนที่เลือก"
// - short/long: ข้อความตัวอย่าง + จำนวนคนที่ตอบ
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

  // เตรียมคำตอบของแต่ละข้อไว้ล่วงหน้า (ยาว total ช่อง, undefined = ไม่ตอบ)
  const perQuestion: Record<string, (string | string[] | number | undefined)[]> = {};
  for (const [qid, plan] of Object.entries(plans)) {
    if (plan.kind === "pick") {
      const values = spread<string | number | undefined>(plan.counts);
      while (values.length < total) values.push(undefined);
      perQuestion[qid] = values;
    } else if (plan.kind === "multi") {
      // คนที่ r เลือกตัวเลือก j ถ้า ตำแหน่งสลับ (r×step + j×5) % total น้อยกว่าจำนวนที่กำหนด
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

// ============ ตัวช่วยสร้างคำถาม ============
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

// ============ งานที่ 1: Workshop Figma (active) — ตัวเลขตรงกับ design ============
const workshopSurvey: Survey = {
  id: "sv-workshop",
  title: { th: "แบบประเมิน Workshop", en: "Workshop feedback" },
  enabled: true,
  questions: [
    q("q1", 1, "rating", "ความพึงพอใจต่อ Workshop", "Workshop satisfaction"),
    q("q2", 2, "single", "ทราบข่าวจากช่องทางใด", "How did you hear about us?", [
      ["Facebook คณะ", "Faculty Facebook"], ["อาจารย์ / เพื่อน", "Teacher / friend"], ["โปสเตอร์", "Poster"], ["อื่นๆ", "Other"],
    ]),
    q("q3", 3, "rating", "ความยากของเนื้อหา", "Content difficulty"),
    q("q4", 4, "multi", "หัวข้อที่ได้ประโยชน์มากที่สุด", "Most useful topics", [
      ["Auto layout", "Auto layout"], ["Component", "Component"], ["Prototype", "Prototype"], ["Frame & Grid", "Frame & Grid"],
    ]),
    // ข้อนี้ไม่บังคับตอบ (ตาม design: 26 จาก 31 คนตอบ) — ทับค่า required ที่ตัวช่วย q() ตั้งให้
    {
      ...q("q5", 5, "single", "ความเหมาะสมของระยะเวลา", "Session length", [
        ["สั้นไป", "Too short"], ["พอดี", "Just right"], ["ยาวไป", "Too long"],
      ]),
      required: false,
    },
    q("q6", 6, "short", "อยากให้จัดหัวข้ออะไรต่อ", "Topics for next time"),
    q("q7", 7, "long", "ข้อเสนอแนะเพิ่มเติม", "Other suggestions"),
  ],
};

const workshop: ReportData = {
  survey: workshopSurvey,
  // คำกำกับปลายสเกลของข้อ Rating (ตาม design)
  ratingLabels: {
    q1: { max: { th: "ดีมาก", en: "Excellent" }, min: { th: "ควรปรับปรุง", en: "Needs work" } },
    q3: {
      max: { th: "ยากมาก", en: "Very hard" },
      min: { th: "ง่ายมาก", en: "Very easy" },
      hint: { th: "1 = ง่าย, 5 = ยาก", en: "1 = easy, 5 = hard" },
    },
  },
  registrations: makeRegistrations(
    "e-workshop", "2026-10-23", 8 * 60,
    [["male", 24], ["female", 19], ["unspecified", 3]],
    [["u18", 3], ["a19", 31], ["a23", 8], ["a31", 4]],
    // ช่วง 30 นาทีตาม design Dashboard: 12/14/8/6/4/2 = 46 คน (10:02 – 12:38)
    [[600, 12], [630, 14], [660, 8], [690, 6], [720, 4], [750, 2]]
  ),
  responses: makeResponses("e-workshop", "2026-10-23", 13 * 60, 31, {
    q1: { kind: "pick", counts: [[5, 14], [4, 11], [3, 4], [2, 2], [1, 0]] },
    q2: { kind: "pick", counts: [["Facebook คณะ", 13], ["อาจารย์ / เพื่อน", 11], ["โปสเตอร์", 5], ["อื่นๆ", 2]] },
    q3: { kind: "pick", counts: [[5, 2], [4, 8], [3, 14], [2, 6], [1, 1]] },
    q4: { kind: "multi", counts: [["Auto layout", 22], ["Component", 18], ["Prototype", 15], ["Frame & Grid", 9]] },
    q5: { kind: "pick", counts: [["สั้นไป", 6], ["พอดี", 17], ["ยาวไป", 3]] },
    q6: { kind: "text", count: 24, samples: ["Design system เบื้องต้น", "การใช้ Variables กับหลายธีม", "ทำ Prototype ให้ดูเหมือนแอปจริง"] },
    q7: { kind: "text", count: 18, samples: ["อยากให้มีเวลาฝึกทำเองมากกว่านี้", "อธิบายเข้าใจง่าย ไฟล์ตัวอย่างช่วยได้เยอะ", "ห้องเย็นไป แนะนำให้แจ้งล่วงหน้า"] },
  }),
};

// ============ งานที่ 2: วันเปิดบ้าน 2569 (ended) ============
const openhouse: ReportData = {
  survey: {
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
  registrations: makeRegistrations(
    "e-openhouse", "2026-10-20", 7 * 60 + 30,
    [["male", 52], ["female", 61], ["unspecified", 7]],
    [["u18", 68], ["a19", 40], ["a23", 8], ["a31", 4]]
  ),
  responses: makeResponses("e-openhouse", "2026-10-20", 12 * 60, 74, {
    q1: { kind: "pick", counts: [[5, 30], [4, 28], [3, 12], [2, 3], [1, 1]] },
    q2: { kind: "pick", counts: [["คณะ IT", 25], ["คณะวิศวกรรมศาสตร์", 20], ["คณะบริหารธุรกิจ", 17], ["อื่นๆ", 12]] },
    q3: { kind: "text", count: 40, samples: ["ห้อง Lab ทันสมัย", "รุ่นพี่แนะนำดีมาก", "กิจกรรมสนุก"] },
  }),
};

// ============ งานที่ 3: การสื่อสารยุคดิจิทัล (ended) ============
const comm: ReportData = {
  survey: {
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
  registrations: makeRegistrations(
    "e-comm", "2026-10-18", 8 * 60,
    [["male", 15], ["female", 21], ["unspecified", 2]],
    [["u18", 2], ["a19", 24], ["a23", 9], ["a31", 3]]
  ),
  responses: makeResponses("e-comm", "2026-10-18", 15 * 60, 29, {
    q1: { kind: "pick", counts: [[5, 12], [4, 11], [3, 5], [2, 1], [1, 0]] },
    q2: { kind: "pick", counts: [["Facebook คณะ", 10], ["LINE กลุ่ม", 9], ["อาจารย์", 7], ["อื่นๆ", 3]] },
    q3: { kind: "text", count: 15, samples: ["อยากให้มีตัวอย่างเคสจริงมากขึ้น", "เนื้อหาใช้ได้จริง"] },
  }),
};

// สร้างครั้งเดียวตอนโหลดไฟล์ (คงที่ ไม่เปลี่ยน)
const MOCK: Record<string, ReportData> = {
  "e-workshop": workshop,
  "e-openhouse": openhouse,
  "e-comm": comm,
};

// อ่านข้อมูลรายงานของ Event (ไม่มี → null) — จุดเดียวที่ต้องเปลี่ยนเมื่อมีข้อมูลจริง
export function getReportData(eventId: string): ReportData | null {
  return MOCK[eventId] ?? null;
}
