// components/events/EventDetailCards.tsx
// การ์ดของหน้า Event (ข้อมูล + QR) — /super/events/<id>/event · Figma 318:5683
// ทุกการ์ดรับ Event เข้ามาแล้วแสดงอย่างเดียว (แก้ไขไม่ได้) · ข้อมูลที่ Event ยังไม่มี → "ยังไม่กำหนด"
"use client";
import { useState } from "react";
import Image from "next/image";
import { Event, User } from "@/types";
import { formatThaiDate, formatWindow } from "@/lib/utils/date";
import { fileName, KIOSK_OPTIONS, surveyDaysAfterEnd, TYPE_LABEL } from "@/lib/utils/eventInfo";
import { adminNames } from "@/components/dashboard/EventTable";

const NOT_SET = "ยังไม่กำหนด";

// ---------- ส่วนประกอบย่อย ----------

// แถว "หัวข้อ ........ ค่า" มีเส้นคั่นด้านบน
function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-t border-slate-100 py-3 text-sm">
      <span className="shrink-0 text-slate-500">{label}</span>
      <span className="text-right">{children}</span>
    </div>
  );
}

// ค่าที่ยังไม่กรอก → ตัวหนังสือสีเทา
function Value({ text }: { text: string }) {
  return <span className={text === NOT_SET ? "text-slate-400" : ""}>{text}</span>;
}

// ---------- ข้อความที่คิดจาก Event ----------

// "ส. 17 ต.ค. 2569 · 10:00 – 15:00"
export function dateTimeText(event: Event): string {
  if (!event.date) return NOT_SET;
  const time = event.startTime && event.endTime ? ` · ${event.startTime} – ${event.endTime}` : "";
  return formatThaiDate(event.date) + time;
}

// "ห้อง Lab 4 อาคาร 11 · ชั้น 2" / "ออนไลน์"
export function placeText(event: Event): string {
  if (event.mode === "online") return "ออนไลน์";
  return [event.venue, event.meetingPoint].filter(Boolean).join(" · ") || NOT_SET;
}

// ============ ข้อมูล Event ============
export function EventInfoCard({ event, users }: { event: Event; users: User[] }) {
  const [showDesc, setShowDesc] = useState(false);
  const max = event.registration.maxAttendees;
  const admins = adminNames(event, users);

  return (
    <div className="h-full rounded-xl bg-white p-5 shadow-sm">
      <h2 className="mb-3 text-lg font-bold">ข้อมูล Event</h2>

      <div className="grid gap-x-8 md:grid-cols-2">
        {/* ---------- คอลัมน์ซ้าย ---------- */}
        <div>
          <InfoRow label="ประเภทงาน"><Value text={TYPE_LABEL[event.type]} /></InfoRow>
          <InfoRow label="วันและเวลา"><Value text={dateTimeText(event)} /></InfoRow>
          <InfoRow label="สถานที่"><Value text={placeText(event)} /></InfoRow>
          <InfoRow label="จำนวนรับสูงสุด"><Value text={max ? `${max.toLocaleString("th-TH")} คน` : NOT_SET} /></InfoRow>
        </div>

        {/* ---------- คอลัมน์ขวา ---------- */}
        <div>
          <InfoRow label="ผู้จัด"><Value text={event.organizerName || NOT_SET} /></InfoRow>
          <InfoRow label="ติดต่อ"><Value text={event.phone || event.email || NOT_SET} /></InfoRow>
          <InfoRow label="Event Admin">
            <span className={admins === "-" ? "text-slate-400" : ""}>{admins === "-" ? "ยังไม่มีผู้ดูแล" : admins}</span>
          </InfoRow>
          <InfoRow label="รายละเอียด">
            <button onClick={() => setShowDesc(!showDesc)} className="text-blue-600 hover:underline">
              {showDesc ? "ซ่อน" : "ดู TH / EN"}
            </button>
          </InfoRow>
        </div>
      </div>

      {/* ---------- รายละเอียด 2 ภาษา (กด "ดู TH / EN") ---------- */}
      {showDesc && (
        <div className="mt-2 grid gap-3 rounded-lg bg-slate-50 p-4 text-sm md:grid-cols-2">
          <div>
            <p className="text-xs font-semibold text-slate-500">TH</p>
            <p className={`mt-1 whitespace-pre-line ${event.description.th ? "" : "text-slate-400"}`}>
              {event.description.th || NOT_SET}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">EN</p>
            <p className={`mt-1 whitespace-pre-line ${event.description.en ? "" : "text-slate-400"}`}>
              {event.description.en || NOT_SET}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ============ ช่วงเวลาเปิด-ปิด ============
export function WindowCard({ event }: { event: Event }) {
  const extraDays = surveyDaysAfterEnd(event);
  return (
    <div className="h-full rounded-xl bg-white p-5 shadow-sm">
      <h2 className="mb-3 text-lg font-bold">ช่วงเวลาเปิด-ปิด</h2>
      <InfoRow label="รับลงทะเบียน">
        <Value text={formatWindow(event.registration.opensAt, event.registration.closesAt)} />
      </InfoRow>
      <InfoRow label="Survey">
        <Value text={formatWindow(event.surveyWindow.opensAt, event.surveyWindow.closesAt)} />
      </InfoRow>
      {extraDays !== null && (
        <p className="border-t border-slate-100 pt-3 text-xs text-slate-500">
          Survey ยังเปิดต่อ {extraDays} วันหลังจบงาน
        </p>
      )}
    </div>
  );
}

// ============ Theme และโฆษณา ============
export function ThemeCard({ event }: { event: Event }) {
  const { primary, secondary, logo, background } = event.theme;
  // บรรทัดสรุป: "Logo · พื้นหลังสี · โฆษณา 1 รูป"
  const parts = [
    logo ? "Logo" : "ไม่มี Logo",
    background.type === "image" ? "พื้นหลังรูป" : "พื้นหลังสี",
    event.adImage ? "โฆษณา 1 รูป" : "ไม่มีโฆษณา",
  ];

  return (
    <div className="h-full rounded-xl bg-white p-5 shadow-sm">
      <h2 className="text-lg font-bold">Theme และโฆษณา</h2>
      <div className="mt-4 flex gap-4">
        {/* ---------- รูปโฆษณา (ไม่มี → กล่องเทา) ---------- */}
        <div className="relative flex h-24 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-100 text-xs text-slate-400">
          {event.adImage ? (
            <Image src={event.adImage} alt="รูปโฆษณา" fill sizes="80px" unoptimized className="object-cover" />
          ) : (
            "โฆษณา"
          )}
        </div>

        <div className="min-w-0 space-y-2 text-sm">
          <p className="flex items-center gap-2">
            <span className="h-4 w-4 rounded border border-slate-200" style={{ background: primary }} />
            สีหลัก {primary.toUpperCase()}
          </p>
          <p className="flex items-center gap-2">
            <span className="h-4 w-4 rounded border border-slate-200" style={{ background: secondary }} />
            สีรอง {secondary.toUpperCase()}
          </p>
          <p className="text-xs text-slate-500">{parts.join(" · ")}</p>
          {event.adImage && <p className="truncate text-xs text-slate-500">{fileName(event.adImage)}</p>}
        </div>
      </div>
    </div>
  );
}

// ============ ฟอร์มลงทะเบียน ============
export function FormFieldsCard({ event }: { event: Event }) {
  const fields = [...event.registration.fields].sort((a, b) => a.order - b.order);
  return (
    <div className="h-full rounded-xl bg-white p-5 shadow-sm">
      <h2 className="text-lg font-bold">ฟอร์มลงทะเบียน</h2>
      {fields.length === 0 ? (
        <p className="mt-2 text-sm text-slate-400">ยังไม่กำหนดฟอร์ม</p>
      ) : (
        <>
          <p className="mt-1 text-xs text-slate-500">{fields.length} ช่อง · * = บังคับกรอก</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {fields.map((f) => (
              <span key={f.id} className="rounded-lg bg-slate-100 px-3 py-1.5 text-sm">
                {f.label.th}
                {f.required && <span className="text-red-500"> *</span>}
              </span>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ============ หน้าจอ Kiosk ============
// แสดงค่าที่ตั้งไว้อย่างเดียว (ปุ่มกดไม่ได้) — ตั้งค่าได้ในหน้าแก้ไข Event
export function KioskScreenCard({ event, locked }: { event: Event; locked: boolean }) {
  return (
    <div className="h-full rounded-xl bg-white p-5 shadow-sm">
      <h2 className="text-lg font-bold">หน้าจอ Kiosk</h2>
      <p className="mt-1 text-xs text-slate-500">เลือกว่าจะโชว์ QR ไหนบนจอ</p>

      <div className="mt-4 grid max-w-sm grid-cols-3 rounded-lg bg-slate-100 p-1 text-sm">
        {KIOSK_OPTIONS.map((o) => (
          <span
            key={o.value}
            className={`rounded-md py-1.5 text-center ${
              event.kiosk.screen === o.value ? "bg-white font-semibold text-blue-600 shadow-sm" : "text-slate-500"
            }`}
          >
            {o.label}
          </span>
        ))}
      </div>

      <p className="mt-4 text-xs text-slate-500">
        {locked ? "ล็อกแล้วพร้อม Event · ตั้งค่าได้ตอนฉบับร่าง / ใกล้ถึง" : "ตั้งค่าได้ในหน้าแก้ไข Event"}
      </p>
    </div>
  );
}
