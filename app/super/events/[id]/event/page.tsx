// app/super/events/[id]/event/page.tsx
"use client";
import { Suspense, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Lock, Pencil } from "lucide-react";
import { useStore } from "@/lib/store";
import { STATUS_LABEL } from "@/lib/utils/status";
import { formatDayMonth } from "@/lib/utils/date";
import { isEditLocked } from "@/lib/utils/eventInfo";
import { QrCard } from "@/components/events/QrCard";
import {
  dateTimeText, placeText, EventInfoCard, WindowCard, ThemeCard, FormFieldsCard, KioskScreenCard,
} from "@/components/events/EventDetailCards";

// หน้า Event (ข้อมูล + QR) เจาะ Event (ส่วน ④) — /super/events/<id>/event · Figma 318:5683
// ตกลงกับ Jin 13 พ.ย.:
// - ข้อมูลที่ Event ยังไม่มี → "ยังไม่กำหนด" (ไม่แตะ lib/mock/events.ts ของ Billy)
// - ปุ่ม "แก้ไข" / "เปิดหน้า Kiosk" แสดงไว้แต่กดไม่ได้ — หน้า Wizard / Kiosk อยู่ฝั่งผู้จัดงาน (/admin) Admin เข้าไม่ได้
// - ล็อกการแก้ไขเมื่อสถานะ กำลังจัดงาน / จบแล้ว (isEditLocked)

// ---------- origin ของเว็บ (เช่น "http://localhost:3000") ----------
// ฝั่ง server ไม่มี window → "" ไปก่อน · ฝั่งเบราว์เซอร์ → window.location.origin (แบบเดียวกับหน้า QR ของผู้จัดงาน)
const noopSubscribe = () => () => {};
function useOrigin() {
  return useSyncExternalStore(noopSubscribe, () => window.location.origin, () => "");
}

function EventDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const event = useStore((s) => s.events.find((e) => e.id === id && e.status !== "deleted"));
  const users = useStore((s) => s.users);
  const deleteEvent = useStore((s) => s.deleteEvent);
  const origin = useOrigin();
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!event) {
    return (
      <div className="mt-10 rounded-xl bg-white p-10 text-center shadow-sm">
        <p className="font-semibold">ไม่พบ Event นี้</p>
        <p className="mt-1 text-sm text-slate-500">อาจถูกลบไปแล้ว หรือลิงก์ไม่ถูกต้อง</p>
        <Link href="/super/events" className="mt-4 inline-block text-sm text-blue-600 hover:underline">
          ← กลับไปหน้า Event ทั้งหมด
        </Link>
      </div>
    );
  }

  const s = STATUS_LABEL[event.status];
  const locked = isEditLocked(event);
  const day = formatDayMonth(event.date);
  // บรรทัดใต้ชื่อ: วันเวลา · สถานที่ (ส่วนที่ยังไม่กำหนดไม่ต้องโชว์)
  const subline = [dateTimeText(event), placeText(event)].filter((t) => t !== "ยังไม่กำหนด").join(" · ");
  // ฉบับร่างยังไม่มีลิงก์ลงทะเบียน / Survey (กติกาเดียวกับหน้า QR ของผู้จัดงาน)
  const noQr = event.status === "draft" ? "ยังไม่มี QR · ต้องเผยแพร่ก่อน" : undefined;

  const handleDelete = () => {
    deleteEvent(event.id);
    router.push("/super/events");
  };

  return (
    <div>
      {/* ---------- หัวข้อ + ปุ่ม ---------- */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-20 w-20 shrink-0 flex-col items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
            {day ? (
              <>
                <span className="text-sm font-semibold">{day.month}</span>
                <span className="text-3xl font-bold leading-none">{day.day}</span>
              </>
            ) : (
              <span className="text-2xl font-bold">—</span>
            )}
          </div>
          <div>
            <span className={`rounded-full px-3 py-1 text-xs ${s.color}`}>{s.text}</span>
            <h1 className="mt-2 text-3xl font-bold">{event.name.th}</h1>
            <p className="mt-1 text-sm text-slate-500">
              {subline || "ยังไม่กำหนดวัน เวลา และสถานที่"} · {event.code}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            disabled
            title={locked ? "Event เริ่มแล้ว แก้ไขไม่ได้" : "รอเชื่อมกับหน้าแก้ไข Event (Wizard)"}
            className="flex cursor-not-allowed items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm text-slate-400 shadow-sm"
          >
            {locked ? <Lock size={16} /> : <Pencil size={16} />} แก้ไข
          </button>
          <button
            disabled
            title="ยังเปิดไม่ได้ · หน้า Kiosk ตอนนี้เปิดได้เฉพาะผู้จัดงานของ Event"
            className="cursor-not-allowed rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-400 shadow-sm"
          >
            เปิดหน้า Kiosk
          </button>
          <Link
            href={`/super/events/${event.id}/report`}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            ดู Report
          </Link>
        </div>
      </div>

      {/* ---------- แถบแจ้งล็อก ---------- */}
      {locked && (
        <div className="mt-6 flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50/60 px-5 py-3 text-sm text-slate-600">
          <Lock size={16} className="mt-0.5 shrink-0 text-blue-600" />
          <p>
            <span className="font-semibold text-slate-800">Event นี้เริ่มแล้ว จึงถูกล็อก</span> — แก้ข้อมูล Theme
            ฟอร์ม และ Survey ไม่ได้ เพื่อให้ข้อมูลที่เก็บไปแล้วตรงกันทั้งหมด ยังดู Report ดาวน์โหลด QR และ Export
            ได้ตามปกติ
          </p>
        </div>
      )}

      {/* ---------- ข้อมูล Event + ช่วงเวลา (Figma 866 : 466) ---------- */}
      <div className="mt-4 grid gap-4 xl:grid-cols-[866fr_466fr]">
        <EventInfoCard event={event} users={users} />
        <WindowCard event={event} />
      </div>

      {/* ---------- QR 2 ใบ + Theme ---------- */}
      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <QrCard
          title="QR ลงทะเบียน"
          url={origin && `${origin}/r/${event.code}`}
          fileBase={`QR-ลงทะเบียน-${event.code}`}
          disabledText={noQr}
        />
        <QrCard
          title="QR แบบสอบถาม"
          url={origin && `${origin}/s/${event.code}`}
          fileBase={`QR-Survey-${event.code}`}
          disabledText={noQr}
        />
        <ThemeCard event={event} />
      </div>

      {/* ---------- ฟอร์มลงทะเบียน + หน้าจอ Kiosk ---------- */}
      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <FormFieldsCard event={event} />
        <KioskScreenCard event={event} locked={locked} />
      </div>

      {/* ---------- ลบ Event ---------- */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-4 rounded-xl bg-white p-5 shadow-sm">
        <div>
          <h2 className="text-lg font-bold">ลบ Event</h2>
          <p className="mt-1 text-sm text-slate-500">
            เฉพาะ Admin · ย้ายไปรายการที่ถูกลบ เก็บไว้ 30 วัน กู้คืนได้ระหว่างนั้น
          </p>
        </div>
        <button
          onClick={() => setConfirmDelete(true)}
          className="rounded-lg bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-100"
        >
          ลบ Event
        </button>
      </div>

      {/* ---------- popup ยืนยันการลบ ---------- */}
      {confirmDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40"
          onClick={() => setConfirmDelete(false)}
        >
          <div className="w-[440px] rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold">ลบ Event นี้?</h2>
            <p className="mt-2 text-sm text-slate-600">
              &ldquo;{event.name.th}&rdquo; จะย้ายไปรายการที่ถูกลบ เก็บข้อมูลไว้ 30 วัน กู้คืนได้ระหว่างนั้น
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setConfirmDelete(false)}
                className="rounded-lg bg-slate-100 px-4 py-2 text-sm hover:bg-slate-200"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleDelete}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
              >
                ลบ Event
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ครอบ <Suspense>: useParams ต้องรอตอนเปิดหน้าจริง (cacheComponents) ไม่ครอบ build ไม่ผ่าน
export default function EventDetailPage() {
  return (
    <Suspense fallback={null}>
      <EventDetail />
    </Suspense>
  );
}
