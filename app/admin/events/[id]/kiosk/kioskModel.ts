// app/admin/events/[id]/kiosk/kioskModel.ts
// รวมข้อมูลที่จอ Kiosk ต้องใช้ให้อยู่ในก้อนเดียว + ตัดสินว่าต้องแสดงหน้าจอแบบไหน
//
// แหล่งข้อมูล 2 ที่:
// - store หลัก (Event)      → สถานะ, kiosk.screen, รูปโฆษณา (adImage), สิทธิ์
// - wizard store (EventDraft) → ข้อมูลที่ Event Admin กรอกใน Wizard (ชื่อ/รายละเอียด TH-EN, วันจบ, Theme,
//   โลโก้, พื้นหลัง, ช่วงเวลา, Survey, Event ปิด) · ถ้ามี draft ของ id นี้ ใช้ draft ก่อน ไม่มีใช้ค่าจาก Event
import type { Event } from "@/types";
import type { EventDraft } from "@/types/event";
import {
  buildPublicEvent,
  getEventPhase,
  getRegisterPhase,
  getSurveyPhase,
  type RegisterPhase,
  type ScheduleInfo,
  type SurveyPhase,
  type ThemeBackground,
} from "@/lib/public-event";

export type KioskThemeMode = "light" | "dark" | "bold";

// ช่วงเวลาเปิด-ปิด (ScheduleInfo) ใช้ค่าเดียวกับหน้า /r และ /s → จอ Kiosk กับหน้ามือถือไม่ขัดกัน
export interface KioskModel extends ScheduleInfo {
  code: string;
  name: { th: string; en: string };
  desc: { th: string; en: string };
  organizer: string;
  contactEmail: string; // "" = ไม่แสดง
  date: string; // yyyy-MM-dd
  startTime: string; // HH:mm
  endTime: string;
  venue: string;
  theme: { primary: string; secondary: string; mode: KioskThemeMode; background: ThemeBackground };
  logo?: string; // URL รูปโลโก้ (ไม่มี = โลโก้ระบบ)
  closed: boolean; // Event ปิด → แบบประเมินสำหรับผู้ที่ลงทะเบียนแล้วเท่านั้น
  ads: string[]; // URL รูปโฆษณา (หลายรูป = เลื่อนอัตโนมัติ)
  adSeconds: number; // เปลี่ยนรูปทุกกี่วินาที (ตั้งใน Wizard ขั้น Branding)
  screen: Event["kiosk"]["screen"];
}

// รูปจาก Wizard ที่มีไฟล์จริง · ไม่มีเลย = undefined (ใช้รูปของ store หลักแทน)
function draftAds(draft?: EventDraft): string[] | undefined {
  const srcs = draft?.ads?.items.map((a) => a.dataUrl).filter((s): s is string => !!s) ?? [];
  return srcs.length > 0 ? srcs : undefined;
}

export function buildKioskModel(event: Event, draft?: EventDraft): KioskModel {
  const g = draft?.general;
  const th = draft?.theme;
  const pub = buildPublicEvent(event, draft); // ช่วงเวลา + Survey เปิดอยู่ไหม (ชุดเดียวกับหน้า /r, /s)
  return {
    code: event.code,
    name: { th: g?.nameTh || event.name.th, en: g?.nameEn || event.name.en || "" },
    desc: { th: g?.descTh || event.description.th, en: g?.descEn || event.description.en || "" },
    organizer: g?.organizer || event.organizerName,
    contactEmail: (g ? g.showContact : event.showContact) ? g?.email || event.email || "" : "",
    date: pub.date,
    endDate: pub.endDate,
    startTime: pub.startTime,
    endTime: pub.endTime,
    venue: pub.venue,
    theme: {
      primary: pub.theme.primary,
      secondary: th?.secondary || event.theme.secondary,
      mode: pub.theme.mode,
      background: pub.theme.background,
    },
    logo: pub.logo,
    closed: pub.closed,
    // รูปโฆษณา: Wizard (รูปที่ crop 16:9 แล้ว) → รูปเดิมใน store หลัก → ไม่มีโฆษณาเลย ใช้รูปปกแทน
    // (เหมือนตัวอย่างจอ Kiosk ใน Wizard) · ไม่มีทั้งโฆษณาและรูปปก = ไม่แสดงกรอบรูป
    ads: draftAds(draft) ?? (event.adImage ? [event.adImage] : pub.cover ? [pub.cover] : []),
    adSeconds: draft?.ads?.seconds || 6,
    screen: event.kiosk.screen,
    status: event.status,
    regOpen: pub.regOpen,
    regClose: pub.regClose,
    maxAttendees: pub.maxAttendees,
    surveyOpen: pub.surveyOpen,
    surveyClose: pub.surveyClose,
    survey: { enabled: pub.survey.enabled },
  };
}

// ============ หน้าจอที่ต้องแสดง (ตรงกับ frame ใน Figma) ============
// upcoming  = K1 ยังไม่เริ่ม (นับถอยหลัง · QR ลงทะเบียนโผล่เมื่อถึงเวลาเปิดรับ)
// live      = K2/K3 กำลังจัดงาน (QR ตาม kiosk.screen)
// thanks    = K4 จบงานแล้ว แต่ Survey ยังเปิด (QR แบบประเมินอย่างเดียว)
// closed    = K5 ปิดแล้ว (ไม่มี QR)
export type KioskScene = "upcoming" | "live" | "thanks" | "closed";

export interface KioskSceneResult {
  scene: KioskScene;
  showRegister: boolean;
  showSurvey: boolean;
  reg: RegisterPhase; // ใช้บอกเหตุผลเมื่อไม่มี QR (ยังไม่เปิด / ปิดแล้ว / เต็ม)
  survey: SurveyPhase;
}

export function getKioskScene(m: KioskModel, now: Date, registeredCount: number): KioskSceneResult {
  // QR โผล่ก็ต่อเมื่อหน้ามือถือที่ QR พาไป "เปิดรับอยู่จริง" (กฎเดียวกับ /r และ /s)
  const reg = getRegisterPhase(m, now, registeredCount);
  const survey = getSurveyPhase(m, now);

  const wantsRegister = m.screen === "register" || m.screen === "both";
  const wantsSurvey = m.screen === "survey" || m.screen === "both";
  const showRegister = wantsRegister && reg === "open";
  const showSurvey = wantsSurvey && survey === "open";

  // หน้าจอหลักตามช่วงของงาน (ดูวัน-เวลาจริง แบบเดียวกับ Event Admin · ไม่มีวันเวลา → ใช้สถานะ)
  const phase = getEventPhase(m, now);
  let scene: KioskScene;
  if (phase === "ended") scene = showSurvey ? "thanks" : "closed";
  else if (phase === "upcoming") scene = "upcoming";
  else scene = "live";

  return { scene, showRegister, showSurvey, reg, survey };
}

// ตัวย่อจากคำภาษาอังกฤษในข้อความ: 2 คำขึ้นไป → อักษรแรกของ 2 คำแรก / 1 คำ → 2 ตัวแรก
// เช่น "Figma Basics Workshop" → "FB", "คณะ IT" → "IT", "ฝ่ายกิจการนักศึกษา" → ""
function latinAbbr(text: string) {
  const [first = "", second = ""] = text.match(/[A-Za-z]+/g) ?? [];
  if (second) return first.charAt(0) + second.charAt(0);
  return first.slice(0, 2);
}

// ตัวอักษรในกล่องโลโก้ (ใช้เมื่อไม่มีรูปโลโก้) — เลือกจากข้อมูลที่มีตามลำดับ:
// ชื่องาน EN → ชื่อผู้จัด → อักษรแรกของชื่อผู้จัด (ไทย) → รหัสงาน
export function initials(m: KioskModel) {
  const organizer = m.organizer ?? "";
  const abbr = latinAbbr(m.name.en) || latinAbbr(organizer);
  if (abbr) return abbr.toUpperCase();
  if (organizer.trim()) return organizer.trim().charAt(0);
  return m.code.replace(/[^A-Za-z]/g, "").slice(0, 2).toUpperCase() || "EV";
}
