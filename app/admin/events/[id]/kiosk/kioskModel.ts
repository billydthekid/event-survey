// app/admin/events/[id]/kiosk/kioskModel.ts
// รวมข้อมูลที่จอ Kiosk ต้องใช้ให้อยู่ในก้อนเดียว + ตัดสินว่าต้องแสดงหน้าจอแบบไหน
//
// แหล่งข้อมูล 2 ที่:
// - store หลัก (Event)      → สถานะ, kiosk.screen, รูปโฆษณา (adImage), โลโก้, สิทธิ์
// - wizard store (EventDraft) → ข้อมูลที่ Event Admin กรอกใน Wizard (ชื่อ/รายละเอียด TH-EN, Theme, ช่วงเวลา, Survey)
//   ถ้ามี draft ของ id นี้ ใช้ draft ก่อน (ใหม่กว่า) ถ้าไม่มีใช้ค่าจาก Event
import type { Event } from "@/types";
import type { EventDraft } from "@/types/event";
import { getReportData } from "../report/mockData";

export type KioskThemeMode = "light" | "dark" | "bold";

export interface KioskModel {
  code: string;
  name: { th: string; en: string };
  desc: { th: string; en: string };
  organizer: string;
  contactEmail: string; // "" = ไม่แสดง
  date: string; // yyyy-MM-dd
  startTime: string; // HH:mm
  endTime: string;
  venue: string;
  theme: { primary: string; secondary: string; mode: KioskThemeMode; background: string };
  logo?: string; // URL รูปโลโก้ (ไม่มี = ใช้ตัวอักษรย่อ)
  ads: string[]; // URL รูปโฆษณา (หลายรูป = เลื่อนอัตโนมัติ)
  adSeconds: number; // เปลี่ยนรูปทุกกี่วินาที (ตั้งใน Wizard ขั้นที่ 3)
  screen: Event["kiosk"]["screen"];
  status: Event["status"];
  regClose: string; // yyyy-MM-ddTHH:mm ("" = ไม่กำหนด)
  surveyEnabled: boolean;
  surveyClose: string;
}

// รูปจาก Wizard ที่มีไฟล์จริง · ไม่มีเลย = undefined (ใช้รูปของ store หลักแทน)
function draftAds(draft?: EventDraft): string[] | undefined {
  const srcs = draft?.ads?.items.map((a) => a.dataUrl).filter((s): s is string => !!s) ?? [];
  return srcs.length > 0 ? srcs : undefined;
}

export function buildKioskModel(event: Event, draft?: EventDraft): KioskModel {
  const g = draft?.general;
  const th = draft?.theme;
  return {
    code: event.code,
    name: { th: g?.nameTh || event.name.th, en: g?.nameEn || event.name.en || "" },
    desc: { th: g?.descTh || event.description.th, en: g?.descEn || event.description.en || "" },
    organizer: g?.organizer || event.organizerName,
    contactEmail: (g ? g.showContact : event.showContact) ? g?.email || event.email || "" : "",
    date: g?.date || event.date,
    startTime: g?.startTime || event.startTime,
    endTime: g?.endTime || event.endTime,
    venue: [g?.venue || event.venue, g?.spot || event.meetingPoint].filter(Boolean).join(" · "),
    theme: {
      primary: th?.primary || event.theme.primary,
      secondary: th?.secondary || event.theme.secondary,
      mode: th?.mode || event.theme.kind,
      background: event.theme.background.type === "color" ? event.theme.background.value : "#FFFFFF",
    },
    logo: event.theme.logo,
    // รูปโฆษณา: Wizard (รูปที่ crop 16:9 แล้ว) → รูปเดิมใน store หลัก
    ads: draftAds(draft) ?? (event.adImage ? [event.adImage] : []),
    adSeconds: draft?.ads?.seconds || 6,
    screen: event.kiosk.screen,
    status: event.status,
    regClose: draft?.schedule.regClose || event.registration.closesAt,
    // Survey เปิดอยู่ถ้าแหล่งใดแหล่งหนึ่งบอกว่าเปิด: Wizard / Event / ข้อมูล mock ที่ Dashboard-Report ใช้
    // (store หลักยังไม่เก็บ event.survey → ต้องดู mock ของ Report ด้วย ไม่งั้นจะไม่ตรงกับ Dashboard)
    surveyEnabled:
      !!draft?.survey.enabled || !!event.survey?.enabled || !!getReportData(event.id)?.survey.enabled,
    surveyClose: draft?.schedule.surveyClose || event.surveyWindow.closesAt,
  };
}

// ============ หน้าจอที่ต้องแสดง (ตรงกับ frame ใน Figma) ============
// upcoming  = K1 ยังไม่เริ่ม (นับถอยหลัง + QR ลงทะเบียน)
// live      = K2/K3 กำลังจัดงาน (QR ตาม kiosk.screen)
// thanks    = K4 จบงานแล้ว แต่ Survey ยังเปิด (QR แบบประเมินอย่างเดียว)
// closed    = K5 ปิดแล้ว (ไม่มี QR)
export type KioskScene = "upcoming" | "live" | "thanks" | "closed";

const passed = (iso: string, now: Date) => !!iso && now > new Date(iso);

export function getKioskScene(m: KioskModel, now: Date) {
  // สถานะหลักใช้ตามที่ระบบเก็บไว้ (ตรงกับ Dashboard/ป้ายสถานะทุกหน้า)
  // เวลาปัจจุบันใช้แค่ตัดสินว่า "ช่วงรับลงทะเบียน / ช่วงตอบ Survey" ยังเปิดอยู่ไหม
  const regOpen = !passed(m.regClose, now);
  const surveyOpen = m.surveyEnabled && !passed(m.surveyClose, now);

  const wantsRegister = m.screen === "register" || m.screen === "both";
  const wantsSurvey = m.screen === "survey" || m.screen === "both";

  if (m.status === "ended") {
    // จบงาน: ลงทะเบียนปิดเสมอ / Survey ตอบต่อได้ถ้ายังอยู่ในช่วงเวลา
    return wantsSurvey && surveyOpen
      ? { scene: "thanks" as const, showRegister: false, showSurvey: true }
      : { scene: "closed" as const, showRegister: false, showSurvey: false };
  }

  if (m.status === "scheduled") {
    // ยังไม่เริ่ม: แสดงเฉพาะ QR ลงทะเบียน (Survey ยังตอบไม่ได้)
    return { scene: "upcoming" as const, showRegister: wantsRegister && regOpen, showSurvey: false };
  }

  // active
  return {
    scene: "live" as const,
    showRegister: wantsRegister && regOpen,
    showSurvey: wantsSurvey && m.surveyEnabled,
  };
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
