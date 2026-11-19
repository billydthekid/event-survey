// lib/utils/live-status.ts
// สถานะ Event ตาม "เวลาจริง" สำหรับป้ายสถานะฝั่ง Super Admin
// สถานะที่เก็บไว้ (event.status) ไม่เปลี่ยนเองตามเวลา เช่น งานจบไปแล้วก็ยังเป็น "scheduled"
// → คิดใหม่ด้วย getEventPhase() ตัวเดียวกับหน้าลงทะเบียน / แบบประเมิน / Kiosk ทุกหน้าจะขึ้นตรงกัน
import { Event, EventStatus } from "@/types";
import type { EventDraft } from "@/types/event";
import { buildPublicEvent, getEventPhase } from "@/lib/public-event";
import { useWizardStore } from "@/lib/wizard-store";

// draft = ข้อมูลจาก Wizard (วัน-เวลาที่ Event Admin ตั้งล่าสุด) · ไม่มีก็ใช้ข้อมูลใน Event
export function liveStatus(event: Event, draft?: EventDraft, now = new Date()): EventStatus {
  // ฉบับร่าง / ถูกลบ ไม่ขึ้นกับเวลา
  if (event.status === "draft" || event.status === "deleted") return event.status;
  const phase = getEventPhase(buildPublicEvent(event, draft), now);
  return phase === "live" ? "active" : phase === "ended" ? "ended" : "scheduled";
}

// ใช้ในหน้า: const statusOf = useLiveStatus(); แล้ว statusOf(event)
export function useLiveStatus() {
  const drafts = useWizardStore((s) => s.drafts);
  return (event: Event) => liveStatus(event, drafts[event.id]);
}
