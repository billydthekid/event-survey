// ฟ้าใส: lib/utils/wizard-rules.ts
// ฟ้าใส: กติกาของ Wizard / Survey Builder รวมไว้ที่เดียว (ใช้ร่วมกันทั้งหน้า edit, survey และ step ต่าง ๆ)
// ฟ้าใส: - ล็อกตาม "สถานะใน store หลัก" ไม่ใช่วันเวลา: Draft / Scheduled แก้ได้เสมอ, Active / Ended ล็อก
// ฟ้าใส: - ตรวจวันเวลาที่ผ่านไปแล้ว + ลำดับเวลา (ใช้แสดงข้อความใต้ช่อง และกันปุ่มเผยแพร่)
// ฟ้าใส: - แปลง EventDraft (wizard store) → patch ของ Event (store หลัก) เพื่อให้ My Events / Sidebar / Dashboard เห็นค่าล่าสุด
import { format } from "date-fns";
import type { Event } from "@/types";
import type { EventPatch } from "@/lib/store";
import type { EventDraft } from "@/types/event";
import { allowListProblem } from "@/lib/allow-list";
import { makeTr } from "@/lib/wizard-lang";
import type { Lang } from "@/types";

// ฟ้าใส: ============ ล็อก ============
// ฟ้าใส: สถานะที่ Organizer ยังแก้ได้ (ตรงกับ EDITABLE ใน EventSidebar)
const EDITABLE: Event["status"][] = ["draft", "scheduled"];

export function isWizardLocked(status: Event["status"]): boolean { // ฟ้าใส: ถ้าเป็น Active / Ended → ล็อก Wizard ทั้งหมด (แก้ได้เฉพาะใน store หลัก)
  return !EDITABLE.includes(status);
}

// ฟ้าใส: ============ ตรวจวันเวลา ============
// ฟ้าใส: key = ช่องที่ผิด → ข้อความ (ช่องที่ถูกต้องจะไม่มี key)
export type DateErrors = Partial<
  Record<"date" | "startTime" | "endTime" | "regOpen" | "regClose" | "surveyOpen" | "surveyClose", string>
>;

/** ฟ้าใส: วันนี้แบบ yyyy-MM-dd และเวลาตอนนี้แบบ yyyy-MM-ddTHH:mm (ใช้เป็น min ของ input ด้วย) */
export function nowParts(now = new Date()) {
  return { today: format(now, "yyyy-MM-dd"), nowLocal: format(now, "yyyy-MM-dd'T'HH:mm") };
}

// ฟ้าใส: datetime-local ("yyyy-MM-ddTHH:mm") เทียบกันแบบข้อความได้เลยเพราะรูปแบบเดียวกัน
// ฟ้าใส: แต่ค่าจาก store หลักอาจเป็น ISO ยาว → ตัดให้เหลือ 16 ตัวก่อน
const dt = (v: string) => v.slice(0, 16);

/** ฟ้าใส: Event นี้มีการลงทะเบียน / Survey ไหม (ฟอร์มกับ Survey ไม่บังคับ · ไม่มีช่อง / ไม่มีคำถาม = ไม่มี) */
export const hasRegistration = (d: EventDraft) => d.form.fields.length > 0;
// ฟ้าใส: มี Survey ไหม = มีคำถามอย่างน้อย 1 ข้อ
export const hasSurvey = (d: EventDraft) => d.survey.questions.length > 0;

/** ฟ้าใส: วันจบของงาน (ไม่ได้ตั้ง = วันเดียวกับวันเริ่ม) */
export function eventEndDate(d: EventDraft): string {
  return d.general.endDate || d.general.date;
}

// ฟ้าใส: ตรวจวันเวลาทุกช่อง คืน error ของช่องที่ผิด
export function validateDates(d: EventDraft, now = new Date(), lang: Lang = "th"): DateErrors {
  // ฟ้าใส: ตัวเลือกข้อความตามภาษา
  const tr = makeTr(lang);
  const { today, nowLocal } = nowParts(now);
  // ฟ้าใส: ข้อมูลทั่วไป (วันที่ เวลา)
  const g = d.general;
  // ฟ้าใส: ช่วงเวลาเปิด–ปิด ลงทะเบียน / Survey
  const s = d.schedule;
  // ฟ้าใส: เก็บ error ของแต่ละช่อง
  const e: DateErrors = {};

  // ฟ้าใส: วันจัดงานต้องไม่ใช่วันที่ผ่านไปแล้ว
  if (g.date && g.date < today) e.date = tr("เลือกวันที่ผ่านไปแล้วไม่ได้", "This date has already passed");
  // ฟ้าใส: เวลาเริ่มต้องยังไม่ผ่าน (ถ้าเป็นวันนี้)
  if (g.date && g.startTime && !e.date && `${g.date}T${g.startTime}` <= nowLocal) {
    e.startTime = tr("เวลาเริ่มผ่านไปแล้ว", "The start time has already passed");
  }
  // ฟ้าใส: วันจบว่าง = วันเดียวกับวันเริ่ม · เทียบทั้งวัน + เวลา (งานข้ามวันได้)
  const endDate = eventEndDate(d);
  // ฟ้าใส: วันจบต้องไม่ก่อนวันเริ่ม · ถ้าวันถูก เวลาจบต้องหลังเวลาเริ่ม
  if (g.date && endDate < g.date) e.endTime = tr("วันจบต้องไม่ก่อนวันเริ่ม", "The end date can't be before the start date");
  else if (g.startTime && g.endTime && `${endDate}T${g.endTime}` <= `${g.date}T${g.startTime}`) e.endTime = tr("ต้องหลังเวลาเริ่ม", "Must be after the start time");

  // ฟ้าใส: ปิดรับลงทะเบียนต้องหลังเปิดรับ
  if (s.regClose && s.regOpen && dt(s.regClose) <= dt(s.regOpen)) e.regClose = tr("ต้องหลังเวลาเปิดรับ", "Must be after the opening time");
  // ฟ้าใส: ปิดรับลงทะเบียนต้องยังไม่ผ่าน
  if (s.regClose && !e.regClose && dt(s.regClose) <= nowLocal) e.regClose = tr("เวลาปิดรับผ่านไปแล้ว", "The closing time has already passed");
  // ฟ้าใส: ปิดรับคำตอบต้องหลังเปิดให้ตอบ
  if (s.surveyClose && s.surveyOpen && dt(s.surveyClose) <= dt(s.surveyOpen)) e.surveyClose = tr("ต้องหลังเวลาเปิดให้ตอบ", "Must be after the opening time");
  // ฟ้าใส: ปิดรับคำตอบต้องยังไม่ผ่าน
  if (s.surveyClose && !e.surveyClose && dt(s.surveyClose) <= nowLocal) e.surveyClose = tr("เวลาปิดรับคำตอบผ่านไปแล้ว", "The closing time has already passed");

  return e;
}

// ฟ้าใส: ============ Wizard → store หลัก ============
// ฟ้าใส: ส่งเฉพาะข้อมูลที่ store หลักมีช่องรองรับ (ฟอร์ม/คำถาม Survey โครงสร้างต่างกัน หน้า public อ่านจาก wizard store อยู่แล้ว)
// ฟ้าใส: ไม่ส่ง status — เปลี่ยนสถานะเฉพาะตอนกดเผยแพร่
export function toEventPatch(d: EventDraft): EventPatch {
  // ฟ้าใส: ข้อมูลทั่วไป
  const g = d.general;
  // ฟ้าใส: ช่วงเวลา
  const s = d.schedule;
  // ฟ้าใส: จำนวนรับสูงสุด (เลิกใช้แล้ว ค่าว่าง = ไม่จำกัด)
  const max = Number(s.maxAttendees);
  return {
    name: { th: g.nameTh, en: g.nameEn || undefined },
    description: { th: g.descTh, en: g.descEn || undefined },
    type: g.type,
    mode: g.mode,
    date: g.date,
    startTime: g.startTime,
    endTime: g.endTime,
    venue: g.venue,
    meetingPoint: g.spot,
    mapUrl: g.mapUrl,
    organizerName: g.organizer,
    phone: g.phone,
    email: g.email,
    showContact: g.showContact,
    theme: { primary: d.theme.primary, secondary: d.theme.secondary, kind: d.theme.mode },
    registration: {
      opensAt: s.regOpen,
      closesAt: s.regClose,
      maxAttendees: max > 0 ? max : undefined,
    },
    surveyWindow: { opensAt: s.surveyOpen, closesAt: s.surveyClose },
  };
}

// ฟ้าใส: ============ ช่องบังคับ (*) ของขั้นที่ 1 ============
/** ฟ้าใส: ชื่อช่องบังคับที่ยังไม่กรอก (ว่าง = ครบ) — ใช้กันปุ่ม "ถัดไป" ของขั้นที่ 1 และปุ่มเผยแพร่ */
export function missingGeneral(d: EventDraft, lang: Lang = "th"): string[] {
  // ฟ้าใส: ข้อมูลทั่วไป
  const g = d.general;
  // ฟ้าใส: ตัวเลือกข้อความตามภาษา
  const tr = makeTr(lang);
  return [
    !g.nameTh.trim() && tr("ชื่อ Event", "Event name"),
    !g.descTh.trim() && tr("รายละเอียด", "Description"),
    g.type === "other" && !g.typeOther?.trim() && tr("ประเภทงาน", "Event type"),
    !g.organizer.trim() && tr("ผู้จัด", "Organizer"),
    !g.date && tr("วันที่จัด", "Date"),
    (!g.startTime || !g.endTime) && tr("เวลา", "Time"),
    !g.venue.trim() && (g.mode === "onsite" ? tr("สถานที่", "Venue") : tr("ลิงก์เข้าร่วม", "Joining link")),
  ].filter((x): x is string => !!x);
}

// ฟ้าใส: ============ ด่านของแต่ละขั้น (ไม่มีเมนูขั้นตอนด้านบนแล้ว → ต้องผ่านทีละขั้น) ============
// ฟ้าใส: คืน "เหตุผลที่ยังไปขั้นถัดไปไม่ได้" (ไม่มี = ผ่าน) · ขั้นที่ 2 Branding และ 5 Preview ไม่มีช่องบังคับ
// ฟ้าใส: 1 ข้อมูลทั่วไป: ช่อง (*) + วันเวลางาน + รายชื่อ Event ปิด
// ฟ้าใส: 3 ฟอร์มลงทะเบียน: ไม่บังคับ (ไม่มีช่อง = Event นี้ไม่รับลงทะเบียน) · ถ้ามีช่องต้องกำหนดเวลาเปิด–ปิดรับลงทะเบียน
// ฟ้าใส: 4 Survey: ไม่บังคับ · ถ้ามีคำถามต้องกำหนดเวลาเปิด–ปิดรับคำตอบ
export function stepBlock(d: EventDraft, step: number, now = new Date(), lang: Lang = "th"): string | undefined {
  // ฟ้าใส: ตัวเลือกข้อความตามภาษา
  const tr = makeTr(lang);
  // ฟ้าใส: error วันเวลาของทุกช่อง
  const e = validateDates(d, now, lang);
  // ฟ้าใส: ช่วงเวลาเปิด–ปิด
  const s = d.schedule;
  // ฟ้าใส: ขั้นที่ 1 ข้อมูลทั่วไป
  if (step === 1) {
    // ฟ้าใส: ช่อง (*) ที่ยังว่าง
    const missing = missingGeneral(d, lang);
    // ฟ้าใส: มีช่องว่าง → บอกว่าขาดช่องไหน
    if (missing.length) return tr(`กรอกช่องบังคับ (*) ให้ครบ: ${missing.join(", ")}`, `Fill in the required fields (*): ${missing.join(", ")}`);
    // ฟ้าใส: วันเวลางานผิด → ให้แก้ก่อน
    if (e.date || e.startTime || e.endTime) return tr("แก้วันเวลาจัดงานที่ไม่ถูกต้อง", "Fix the event date and time");
    return allowListProblem(d, lang);
  }
  // ฟ้าใส: ขั้นที่ 3 ฟอร์มลงทะเบียน
  if (step === 3) {
    if (d.form.fields.length === 0) return undefined; // ฟ้าใส: ไม่มีฟอร์ม = ไม่รับลงทะเบียน → ผ่านได้เลย
    // ฟ้าใส: มีฟอร์มแล้วต้องกำหนดเวลาเปิด–ปิดรับ
    if (!s.regOpen || !s.regClose) return tr("กำหนดเวลาเปิด–ปิดรับลงทะเบียน", "Set the registration open and close times");
    // ฟ้าใส: เวลาปิดรับผิด → บอกเหตุผล
    if (e.regClose) return tr(`เวลาปิดรับลงทะเบียน: ${e.regClose}`, `Registration close: ${e.regClose}`);
  }
  // ฟ้าใส: ขั้นที่ 4 Survey
  if (step === 4) {
    // ฟ้าใส: Survey ไม่บังคับ: ไม่มีคำถาม = ไม่มี Survey → ผ่านได้เลย · มีคำถามแล้วต้องกำหนดเวลาเปิด–ปิดด้วย
    if (d.survey.questions.length === 0) return undefined;
    // ฟ้าใส: มีคำถามแล้วต้องกำหนดเวลาเปิด–ปิดตอบ
    if (!s.surveyOpen || !s.surveyClose) return tr("กำหนดเวลาเปิด–ปิดรับคำตอบ Survey", "Set the survey open and close times");
    // ฟ้าใส: เวลาปิดรับคำตอบผิด → บอกเหตุผล
    if (e.surveyClose) return tr(`เวลาปิดรับคำตอบ: ${e.surveyClose}`, `Survey close: ${e.surveyClose}`);
  }
  return undefined;
}

/** ฟ้าใส: ขั้นแรกที่ยังไม่ผ่าน (ทุกขั้นผ่าน = lastStep) — ใช้กันการข้ามขั้นจากค่าที่บันทึกไว้ และกันปุ่มเผยแพร่ */
export function firstBlockedStep(d: EventDraft, lastStep: number, now = new Date()): number {
  for (let n = 1; n < lastStep; n++) if (stepBlock(d, n, now)) return n;
  return lastStep;
}
