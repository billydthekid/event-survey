// app/super/events/[id]/dashboard/page.tsx
"use client";
import { Suspense } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ClipboardCheck, Clock, Download, QrCode, TabletSmartphone, UserPlus } from "lucide-react";
import { useStore } from "@/lib/store";
import { useNow } from "@/lib/hooks/useNow";
import { STATUS_LABEL } from "@/lib/utils/status";
import { countdown, eventRange, formatRecent, formatTime } from "@/lib/utils/date";
import { latestAt, registrationSlots, satisfactionSummary } from "@/lib/utils/stats";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { DonutCard } from "@/components/dashboard/DonutCard";
import { SlotBarChart } from "@/components/dashboard/SlotBarChart";
import { SatisfactionCard } from "@/components/dashboard/SatisfactionCard";
import { EventStatusCard } from "@/components/dashboard/EventStatusCard";
import { WhenWhereCard } from "@/components/dashboard/WhenWhereCard";

// Dashboard เจาะ Event (ส่วน ③) — /super/events/<id>/dashboard
// [id] ในชื่อโฟลเดอร์ = dynamic route → /super/events/e-workshop/dashboard ได้ id = "e-workshop"

function EventDashboard() {
  const { id } = useParams<{ id: string }>();
  // ไม่นับ Event ที่ถูกลบ (เปิด URL ค้างไว้แล้ว Event โดนลบ → "ไม่พบ")
  const event = useStore((s) => s.events.find((e) => e.id === id && e.status !== "deleted"));
  // ดึงทั้งก้อนแล้วค่อยกรอง — ถ้า .filter() ใน useStore จะได้ array ใหม่ทุกครั้ง → render วนไม่จบ
  const allRegistrations = useStore((s) => s.registrations);
  const allResponses = useStore((s) => s.responses);
  const now = useNow();   // อัปเดตทุก 1 นาที → เหลือเวลา / ข้อมูลถึง / ช่องประ ขยับเอง

  if (!event) {
    return (
      <div className="mt-10 rounded-xl bg-white p-10 text-center shadow-sm">
        <p className="font-semibold">ไม่พบ Event นี้</p>
        <p className="mt-1 text-sm text-slate-500">อาจถูกลบไปแล้ว หรือลิงก์ไม่ถูกต้อง</p>
        <Link href="/super" className="mt-4 inline-block text-sm text-blue-600 hover:underline">
          ← กลับภาพรวมทุก Event
        </Link>
      </div>
    );
  }

  // ---------- คิดตัวเลข ----------
  const registrations = allRegistrations.filter((r) => r.eventId === event.id);
  const responses = allResponses.filter((r) => r.eventId === event.id);
  const latest = latestAt(registrations);
  const range = eventRange(event);
  const slots = range ? registrationSlots(range, registrations, now) : null;
  // ความพึงพอใจ = ข้อ Rating ข้อแรกของ Survey (Workshop = q1 "ความพึงพอใจต่อ Workshop")
  const ratingId = event.survey?.questions.find((q) => q.type === "rating")?.id;
  const satisfaction = satisfactionSummary(responses, ratingId);
  const timeLeft = countdown(event, now);

  const s = STATUS_LABEL[event.status];
  const eventPage = `/super/events/${event.id}/event`;   // หน้า Event (ข้อมูล + QR) — ทำใน ④

  return (
    <div>
      {/* ---------- หัวข้อ ---------- */}
      <p className="text-sm text-slate-400">ผู้ดูแลระบบ / {event.name.th}</p>
      <h1 className="mt-1 text-3xl font-bold">{event.name.th}</h1>
      <p className="mt-2 flex items-center gap-2 text-sm text-slate-500">
        <span className={`rounded-full px-3 py-1 text-xs ${s.color}`}>{s.text}</span>
        {event.code} · คุณดูในฐานะ Super Admin
      </p>

      {/* ---------- ปุ่มลัด ---------- */}
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <Link href={eventPage} className="flex items-center gap-3 rounded-xl bg-white p-3 shadow-sm hover:bg-slate-50">
          <span className="rounded-lg bg-blue-50 p-2 text-blue-600"><QrCode size={18} /></span>
          <span className="text-sm font-semibold">QR ลงทะเบียน / Survey</span>
        </Link>
        <Link href={eventPage} className="flex items-center gap-3 rounded-xl bg-white p-3 shadow-sm hover:bg-slate-50">
          <span className="rounded-lg bg-purple-50 p-2 text-purple-600"><TabletSmartphone size={18} /></span>
          <span className="text-sm font-semibold">เปิดหน้า Kiosk</span>
        </Link>
        {/* ยังไม่ได้ตกลงว่า Export (CSV / PDF) เป็นงานใคร → ปิดไว้ก่อน */}
        <button
          disabled
          title="ยังไม่เปิดใช้"
          className="flex cursor-not-allowed items-center gap-3 rounded-xl bg-white p-3 text-left opacity-50 shadow-sm"
        >
          <span className="rounded-lg bg-pink-50 p-2 text-pink-600"><Download size={18} /></span>
          <span className="text-sm font-semibold">Export CSV / PDF</span>
        </button>
      </div>

      {/* ---------- KPI 3 ใบ ---------- */}
      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <KpiCard
          icon={UserPlus}
          label="ลงทะเบียนแล้ว"
          value={registrations.length}
          unit="คน"
          sub={
            latest
              ? `คนล่าสุด ${formatRecent(latest, now)} · ข้อมูลถึง ${formatTime(now)} น.`
              : "ยังไม่มีคนลงทะเบียน"
          }
        />
        <KpiCard icon={ClipboardCheck} tone="green" label="ตอบ Survey" value={responses.length} unit="คน" />
        <KpiCard icon={Clock} tone="orange" label={timeLeft.label} value={timeLeft.value} />
      </div>

      {/* ---------- กราฟแท่ง + โดนัท + ความพึงพอใจ (สัดส่วนตาม Figma 716 : 400 : 460) ---------- */}
      <div className="mt-4 grid gap-4 xl:grid-cols-[716fr_400fr_460fr]">
        <SlotBarChart slots={slots} />
        <DonutCard done={responses.length} total={registrations.length} title="ตอบ Survey แล้ว" />
        <SatisfactionCard {...satisfaction} />
      </div>

      {/* ---------- สถานะ Event + เมื่อไหร่และที่ไหน (Figma 1136 : 460) ---------- */}
      <div className="mt-4 grid gap-4 xl:grid-cols-[1136fr_460fr]">
        <EventStatusCard event={event} now={now} />
        <WhenWhereCard event={event} now={now} />
      </div>
    </div>
  );
}

// ครอบ <Suspense>: useParams กับ useNow (อ่านเวลาปัจจุบัน) ต้องรอตอนเปิดหน้าจริง (cacheComponents) ไม่ครอบ build ไม่ผ่าน
export default function EventDashboardPage() {
  return (
    <Suspense fallback={null}>
      <EventDashboard />
    </Suspense>
  );
}
