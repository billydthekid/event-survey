// app/admin/events/[id]/report/reportData.ts
// ประกอบ "ข้อมูลรายงาน" (ReportData) ของ Event หนึ่งงาน จากข้อมูลจริงใน store
// - ฟังก์ชันล้วน ไม่มี React / ไม่อ่าน store เอง → ผู้เรียก (useEventAccess) ส่งข้อมูลเข้ามา
// - รูปผลลัพธ์เหมือน getReportData() เดิมใน mockData.ts ทุกช่อง → Dashboard / Report ไม่ต้องแก้
import { BiText, Event, Question, Registration, SurveyResponse } from "@/types";
import { EventDraft, SurveyQuestion } from "@/types/event";
import { normalizeQuestion } from "@/lib/survey-types";
import { registrationIdOf } from "@/lib/utils/surveyStats";
import { RatingLabel, ReportData, ReportSurvey } from "./mockData";

// ============ คำถามที่หน้า Report ใช้ ============
// Question ใน types/ ไม่มีช่องของตาราง / คะแนนเต็ม → ต่อขยายเฉพาะในหน้า Report (ไม่แก้ types/)
// คำถามจาก event.survey (ข้อมูลตัวอย่าง) ไม่มีสองช่องนี้ → rating ได้คะแนนเต็ม 5 เหมือนเดิม
export interface ReportQuestion extends Question {
  rows?: BiText[];    // mcgrid / cbgrid: หัวข้อแถว (options = คอลัมน์) เช่น [{ th: "หัวข้อ 1" }]
  ratingMax?: number; // rating / linear: คะแนนเต็ม 5 หรือ 10 (ไม่มี = 5)
}

// ============ คำถามจาก Wizard → Question (รูปแบบที่หน้า Report ใช้) ============
// วิธี map เดียวกับ lib/public-event.ts (buildPublicEvent) → ผู้ตอบเห็นข้อไหน รายงานก็สรุปข้อนั้น
// ตัวอย่าง: { id: "q2", type: "single", titleTh: "รู้จักงานจากไหน", titleEn: "", options: ["เพื่อน", " "] }
//        → { id: "q2", type: "single", title: { th: "รู้จักงานจากไหน", en: undefined },
//            options: [{ th: "เพื่อน" }], order: 2 }   (ตัวเลือกที่ว่างถูกตัดออก)
// ข้อมูลเก่า: rating ที่ไม่ใช่ดาว → normalizeQuestion แปลงเป็น "linear"
// ตาราง: rows ตัดแถวว่างออก เช่น ["หัวข้อ 1", ""] → [{ th: "หัวข้อ 1" }] (แบบเดียวกับหน้า /s)
export function questionsFromWizard(questions: SurveyQuestion[]): ReportQuestion[] {
  return questions.map(normalizeQuestion).map((q, i) => ({
    id: q.id,
    type: q.type,
    title: { th: q.titleTh, en: q.titleEn || undefined },
    required: q.required,
    options: q.options.filter((o) => o.trim()).map((o) => ({ th: o })),
    order: i + 1, // Wizard เรียงตามตำแหน่งใน array อยู่แล้ว
    rows: q.rows?.filter((r) => r.trim()).map((r) => ({ th: r })),
    ratingMax: q.ratingMax,
  }));
}

// ============ คำกำกับปลายสเกล (เฉพาะ linear ที่ตั้ง scaleLabels ไว้) ============
// ตัวอย่าง: q1 linear scaleLabels { min: "ควรปรับปรุง", max: "ดีมาก" }
//        → { q1: { min: { th: "ควรปรับปรุง" }, max: { th: "ดีมาก" } } }
// ไม่มีข้อไหนตั้งไว้ → undefined (หน้าจอแสดงแค่ตัวเลข)
export function ratingLabelsFromWizard(questions: SurveyQuestion[]): Record<string, RatingLabel> | undefined {
  const labels: Record<string, RatingLabel> = {};
  for (const q of questions.map(normalizeQuestion)) {
    if (q.type === "linear" && (q.scaleLabels?.min || q.scaleLabels?.max)) {
      labels[q.id] = { min: { th: q.scaleLabels.min }, max: { th: q.scaleLabels.max } };
    }
  }
  return Object.keys(labels).length > 0 ? labels : undefined;
}

// Survey ว่าง (ใช้เมื่อทั้ง Wizard และ event.survey ไม่มีคำถาม) → แท็บ Survey แสดง "ยังไม่มีคำถาม"
const emptySurvey = (eventId: string): ReportSurvey => ({
  id: `sv-${eventId}`,
  title: { th: "แบบประเมิน", en: "Survey" },
  enabled: false,
  questions: [],
});

// ============ ประกอบ ReportData ============
// รับ: Event, ร่างจาก Wizard (ไม่มีก็ได้), ผู้ลงทะเบียน "ทั้งหมด" และคำตอบ "ทั้งหมด" จาก store
// คืน: ReportData ของ Event นี้
// ลำดับเลือก Survey: คำถามจาก Wizard (ถ้ามี) → event.survey → Survey ว่าง (ไม่ใช้ mock แล้ว)
// ตัวอย่าง (e-workshop): Wizard ไม่มีคำถาม → ใช้ event.survey (7 ข้อ)
//   registrations 46 รายการ, responses 31 รายการ (แต่ละรายการมี registrationId เช่น "e-workshop-reg-46")
//   คำตอบที่ส่งจากหน้า /s จะไม่มี registrationId → registrationId: undefined (หน้าจอขึ้น "ไม่ระบุชื่อ")
export function buildReportData(
  event: Event,
  draft: EventDraft | undefined,
  allRegistrations: Registration[],
  allResponses: SurveyResponse[]
): ReportData {
  const registrations = allRegistrations.filter((r) => r.eventId === event.id);
  const responses = allResponses
    .filter((r) => r.eventId === event.id)
    .map((r) => ({ ...r, registrationId: registrationIdOf(r) }));

  const wizardQuestions = draft?.survey.questions ?? [];
  if (wizardQuestions.length > 0) {
    return {
      survey: {
        id: event.survey?.id ?? `sv-${event.id}`,
        title: event.survey?.title ?? { th: "แบบประเมิน", en: "Survey" },
        enabled: draft?.survey.enabled ?? true,
        questions: questionsFromWizard(wizardQuestions),
      },
      registrations,
      responses,
      ratingLabels: ratingLabelsFromWizard(wizardQuestions),
    };
  }

  return {
    survey: event.survey ?? emptySurvey(event.id),
    registrations,
    responses,
  };
}
