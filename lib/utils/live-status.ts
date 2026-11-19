// lib/utils/live-status.ts
// สถานะ Event ตาม "เวลาจริง" สำหรับป้ายสถานะฝั่ง Super Admin
// สถานะที่เก็บไว้ (event.status) ไม่เปลี่ยนเองตามเวลา เช่น งานจบไปแล้วก็ยังเป็น "scheduled"
// → คิดใหม่ด้วย getEventPhase() ตัวเดียวกับหน้าลงทะเบียน / แบบประเมิน / Kiosk ทุกหน้าจะขึ้นตรงกัน
"use client";
import { useSyncExternalStore } from "react";
import { Event, EventStatus } from "@/types";
import type { EventDraft } from "@/types/event";
import { buildPublicEvent, getEventPhase } from "@/lib/public-event";
import { useWizardStore } from "@/lib/wizard-store";

// now = undefined → ยังไม่รู้เวลา (ตอน prerender ฝั่ง server) → ใช้สถานะที่เก็บไว้
export function liveStatus(event: Event, draft: EventDraft | undefined, now: Date | undefined): EventStatus {
  // ฉบับร่าง / ถูกลบ ไม่ขึ้นกับเวลา
  if (!now || event.status === "draft" || event.status === "deleted") return event.status;
  const phase = getEventPhase(buildPublicEvent(event, draft), now);
  return phase === "live" ? "active" : phase === "ended" ? "ended" : "scheduled";
}

// ============ นาฬิกา (อ่านเฉพาะในเบราว์เซอร์) ============
// cacheComponents ห้ามอ่าน new Date() ตอน prerender → ใช้ useSyncExternalStore:
//   - ฝั่ง server ได้ null (ไม่อ่านเวลา) · ในเบราว์เซอร์ได้เวลาจริง ปัดเป็นนาที อัปเดตทุก 1 นาที
// จึงไม่ต้องครอบ <Suspense> ทุกหน้าที่ใช้
const MINUTE = 60 * 1000;
const subscribe = (onChange: () => void) => {
  const timer = setInterval(onChange, MINUTE);
  return () => clearInterval(timer);
};
const getMinute = () => Math.floor(Date.now() / MINUTE);
const getServerMinute = () => null;

// ใช้ในหน้า: const statusOf = useLiveStatus(); แล้ว statusOf(event)
export function useLiveStatus() {
  const drafts = useWizardStore((s) => s.drafts);
  const minute = useSyncExternalStore(subscribe, getMinute, getServerMinute);
  const now = minute === null ? undefined : new Date(minute * MINUTE);
  return (event: Event) => liveStatus(event, drafts[event.id], now);
}
