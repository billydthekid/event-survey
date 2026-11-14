// lib/utils/wizard-rules.ts
// กติกาของ Wizard / Survey Builder รวมไว้ที่เดียว (ใช้ร่วมกันทั้งหน้า edit, survey และ step ต่าง ๆ)
// - ล็อกตาม "สถานะใน store หลัก" ไม่ใช่วันเวลา: Draft / Scheduled แก้ได้เสมอ, Active / Ended ล็อก
// - ตรวจวันเวลาที่ผ่านไปแล้ว + ลำดับเวลา (ใช้แสดงข้อความใต้ช่อง และกันปุ่มเผยแพร่)
// - แปลง EventDraft (wizard store) → patch ของ Event (store หลัก) เพื่อให้ My Events / Sidebar / Dashboard เห็นค่าล่าสุด
import { format } from "date-fns";
import type { Event } from "@/types";
import type { EventPatch } from "@/lib/store";
import type { EventDraft } from "@/types/event";

// ============ ล็อก ============
// สถานะที่ Organizer ยังแก้ได้ (ตรงกับ EDITABLE ใน EventSidebar)
const EDITABLE: Event["status"][] = ["draft", "scheduled"];

export function isWizardLocked(status: Event["status"]): boolean { // ถ้าเป็น Active / Ended → ล็อก Wizard ทั้งหมด (แก้ได้เฉพาะใน store หลัก)
  return !EDITABLE.includes(status);
}

// ============ ตรวจวันเวลา ============
// key = ช่องที่ผิด → ข้อความ (ช่องที่ถูกต้องจะไม่มี key)
export type DateErrors = Partial<
  Record<"date" | "startTime" | "endTime" | "regOpen" | "regClose" | "surveyOpen" | "surveyClose", string>
>;

/** วันนี้แบบ yyyy-MM-dd และเวลาตอนนี้แบบ yyyy-MM-ddTHH:mm (ใช้เป็น min ของ input ด้วย) */
export function nowParts(now = new Date()) {
  return { today: format(now, "yyyy-MM-dd"), nowLocal: format(now, "yyyy-MM-dd'T'HH:mm") };
}

// datetime-local ("yyyy-MM-ddTHH:mm") เทียบกันแบบข้อความได้เลยเพราะรูปแบบเดียวกัน
// แต่ค่าจาก store หลักอาจเป็น ISO ยาว → ตัดให้เหลือ 16 ตัวก่อน
const dt = (v: string) => v.slice(0, 16);

export function validateDates(d: EventDraft, now = new Date()): DateErrors {
  const { today, nowLocal } = nowParts(now);
  const g = d.general;
  const s = d.schedule;
  const e: DateErrors = {};

  if (g.date && g.date < today) e.date = "เลือกวันที่ผ่านไปแล้วไม่ได้";
  if (g.date && g.startTime && !e.date && `${g.date}T${g.startTime}` <= nowLocal) {
    e.startTime = "เวลาเริ่มผ่านไปแล้ว";
  }
  if (g.startTime && g.endTime && g.endTime <= g.startTime) e.endTime = "ต้องหลังเวลาเริ่ม";

  if (s.regClose && s.regOpen && dt(s.regClose) <= dt(s.regOpen)) e.regClose = "ต้องหลังเวลาเปิดรับ";
  if (s.regClose && !e.regClose && dt(s.regClose) <= nowLocal) e.regClose = "เวลาปิดรับผ่านไปแล้ว";
  if (s.surveyClose && s.surveyOpen && dt(s.surveyClose) <= dt(s.surveyOpen)) e.surveyClose = "ต้องหลังเวลาเปิดให้ตอบ";
  if (s.surveyClose && !e.surveyClose && dt(s.surveyClose) <= nowLocal) e.surveyClose = "เวลาปิดรับคำตอบผ่านไปแล้ว";

  return e;
}

// ============ Wizard → store หลัก ============
// ส่งเฉพาะข้อมูลที่ store หลักมีช่องรองรับ (ฟอร์ม/คำถาม Survey โครงสร้างต่างกัน หน้า public อ่านจาก wizard store อยู่แล้ว)
// ไม่ส่ง status — เปลี่ยนสถานะเฉพาะตอนกดเผยแพร่
export function toEventPatch(d: EventDraft): EventPatch {
  const g = d.general;
  const s = d.schedule;
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

// ============ ช่องบังคับ (*) ของขั้นที่ 1 ============
/** ชื่อช่องบังคับที่ยังไม่กรอก (ว่าง = ครบ) — ใช้ทั้งหน้าตรวจขั้นที่ 6 และกันปุ่มเผยแพร่ */
export function missingGeneral(d: EventDraft): string[] {
  const g = d.general;
  return [
    !g.nameTh.trim() && "ชื่อ Event",
    !g.descTh.trim() && "รายละเอียด",
    g.type === "other" && !g.typeOther?.trim() && "ประเภทงาน",
    !g.organizer.trim() && "ผู้จัด",
    !g.date && "วันที่จัด",
    (!g.startTime || !g.endTime) && "เวลา",
    !g.venue.trim() && (g.mode === "onsite" ? "สถานที่" : "ลิงก์เข้าร่วม"),
  ].filter((x): x is string => !!x);
}
