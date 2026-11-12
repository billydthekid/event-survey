// app/admin/events/[id]/DashboardView.tsx
// Dashboard ของ Event หนึ่งงาน (ต้นแบบ: docs/figma/dashboard.png)
// ด่านสิทธิ์ + ส่วนหัว + ทางลัด 3 ใบ + แถบ KPI 4 ช่อง + กราฟช่วง 30 นาที + โดนัท
// + ลงทะเบียนล่าสุด + สถานะ Event + เมื่อไหร่และที่ไหน + ความพึงพอใจ
// - ตัวเลขมาจาก getReportData ชุดเดียวกับหน้า Report (ผ่าน useEventAccess)
// - ภาษามาจาก currentUser.lang (อ่านอย่างเดียว) เหมือน Sidebar
"use client";
import { use, useSyncExternalStore } from "react";
import Link from "next/link";
import {
  ChevronLeft, ChevronRight, Clock, Download, MapPin, QrCode, ShieldAlert, Smartphone, BarChart3, type LucideIcon,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { STATUS_LABEL } from "@/lib/utils/status";
import { Event, EventStatus, Lang } from "@/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useEventAccess } from "./eventAccess";
import { ReportData } from "./report/mockData";
import { pct, summarize, tr } from "./report/summary";
import { Donut, HBar, VBars, type VBar } from "./report/charts";

// ============ พจนานุกรมข้อความ 2 ภาษา ============
const TEXT = {
  th: {
    myEvents: "Event ของฉัน",
    viewingAs: "คุณดูในฐานะ Event Admin · เห็นเฉพาะข้อมูลของ Event นี้",
    // STATUS_LABEL ใน lib มีแต่ภาษาไทย → ชื่อสถานะเก็บในพจนานุกรมนี้ (สีป้ายยังใช้ของ lib)
    status: { draft: "ฉบับร่าง", scheduled: "ใกล้ถึง", active: "กำลังจัดงาน", ended: "จบแล้ว", deleted: "ถูกลบ" },
    qr: "QR ลงทะเบียน / Survey",
    kiosk: "เปิดหน้า Kiosk",
    export: "Export CSV / PDF",
    registered: "ลงทะเบียนแล้ว",
    latestAt: (time: string) => `คนล่าสุด ${time} น.`,
    answered: "ตอบ Survey",
    notAnswered: (n: number) => `ยังไม่ตอบ ${n} คน`,
    rate: "Response rate",
    rateOf: (a: number, b: number) => `${a} จาก ${b} คน`,
    remaining: "เหลือเวลา",
    closesAt: (time: string) => `ปิดงาน ${time}`,
    closed: "ปิดงานแล้ว",
    inDays: (n: number) => `อีก ${n} วัน`,
    timeUnset: "ยังไม่ระบุเวลา",
    perSlot: "ลงทะเบียนต่อช่วง 30 นาที",
    peak: (slot: string, n: number) => `เยอะสุดช่วง ${slot} · ${n} คน`,
    responded: "ตอบ Survey แล้ว",
    respondedN: (n: number) => `ตอบแล้ว ${n}`,
    notRespondedN: (n: number) => `ยังไม่ตอบ ${n}`,
    latestTitle: "ลงทะเบียนล่าสุด",
    latestSub: (time: string, shown: number, total: number) => `ล่าสุด ${time} น. · ${shown} รายการล่าสุด จากทั้งหมด ${total} คน`,
    seeAll: "ดูทั้งหมด",
    noRegs: "ยังไม่มีผู้ลงทะเบียน",
    whenWhere: "เมื่อไหร่และที่ไหน",
    today: "วันนี้",
    dateUnset: "ยังไม่ระบุวันที่",
    venueUnset: "ยังไม่ระบุสถานที่",
    left: (h: number, m: number) => (h > 0 ? `เหลือ ${h} ชม. ${m} น.` : `เหลือ ${m} น.`),
    satisfaction: "ความพึงพอใจ",
    avgOf: (avg: string, n: number) => `เฉลี่ย ${avg} / 5 · ${n} คำตอบ`,
    statusTitle: "สถานะ Event",
    rows: { qr: "QR ลงทะเบียน", survey: "Survey", kiosk: "จอ Kiosk", team: "ทีมดูแล", edit: "แก้ไขข้อมูล Event" },
    regOpen: "เปิดรับอยู่",
    regClosed: "ปิดรับแล้ว",
    surveyState: (enabled: boolean, n: number, locked: boolean) =>
      `${enabled ? "เปิดใช้" : "ปิดใช้"} · ${n} ข้อ${locked ? " · ล็อกแล้ว" : ""}`,
    kioskScreen: { both: "แสดง QR ทั้งคู่", register: "แสดง QR ลงทะเบียน", survey: "แสดง QR Survey" },
    team: (n: number) => `${n} คน · จัดการโดย Super Admin`,
    editLocked: "ล็อกแล้ว (เผยแพร่แล้ว)",
    editOpen: "แก้ไขได้",
    noData: "ยังไม่มีข้อมูล Dashboard",
    noDataHint: "Dashboard จะมีข้อมูลเมื่อ Event เริ่มจัดงานแล้ว",
    notFound: "ไม่พบ Event / ไม่มีสิทธิ์",
    notFoundHint: "Event นี้ไม่มีอยู่ ถูกลบไปแล้ว หรือไม่ได้มอบหมายให้คุณดูแล",
    back: "กลับไป Event ของฉัน",
  },
  en: {
    myEvents: "My Events",
    viewingAs: "You're viewing as Event Admin · Only this event's data is shown",
    status: { draft: "Draft", scheduled: "Scheduled", active: "Active", ended: "Ended", deleted: "Deleted" },
    qr: "Registration / Survey QR",
    kiosk: "Open Kiosk",
    export: "Export CSV / PDF",
    registered: "Registered",
    latestAt: (time: string) => `Latest at ${time}`,
    answered: "Survey responses",
    notAnswered: (n: number) => `${n} not answered yet`,
    rate: "Response rate",
    rateOf: (a: number, b: number) => `${a} of ${b} people`,
    remaining: "Time left",
    closesAt: (time: string) => `Closes at ${time}`,
    closed: "Event closed",
    inDays: (n: number) => `In ${n} day${n === 1 ? "" : "s"}`,
    timeUnset: "Time not set",
    perSlot: "Registrations per 30 minutes",
    peak: (slot: string, n: number) => `Peak at ${slot} · ${n} people`,
    responded: "Survey responses",
    respondedN: (n: number) => `Answered ${n}`,
    notRespondedN: (n: number) => `Not yet ${n}`,
    latestTitle: "Latest registrations",
    latestSub: (time: string, shown: number, total: number) => `Latest at ${time} · ${shown} most recent of ${total} people`,
    seeAll: "See all",
    noRegs: "No registrations yet",
    whenWhere: "When and where",
    today: "Today",
    dateUnset: "Date not set",
    venueUnset: "Venue not set",
    left: (h: number, m: number) => (h > 0 ? `${h} h ${m} min left` : `${m} min left`),
    satisfaction: "Satisfaction",
    avgOf: (avg: string, n: number) => `avg. ${avg} / 5 · ${n} responses`,
    statusTitle: "Event status",
    rows: { qr: "Registration QR", survey: "Survey", kiosk: "Kiosk screen", team: "Team", edit: "Edit event info" },
    regOpen: "Open",
    regClosed: "Closed",
    surveyState: (enabled: boolean, n: number, locked: boolean) =>
      `${enabled ? "Enabled" : "Disabled"} · ${n} question${n === 1 ? "" : "s"}${locked ? " · Locked" : ""}`,
    kioskScreen: { both: "Shows both QR codes", register: "Shows registration QR", survey: "Shows survey QR" },
    team: (n: number) => `${n} ${n === 1 ? "person" : "people"} · Managed by Super Admin`,
    editLocked: "Locked (published)",
    editOpen: "Editable",
    noData: "No dashboard data yet",
    noDataHint: "The dashboard will have data once the event has started",
    notFound: "Event not found / No permission",
    notFoundHint: "This event doesn't exist, was deleted, or isn't assigned to you",
    back: "Back to My Events",
  },
};
type Text = (typeof TEXT)["th"];

// ============ ส่วนหลัก ============
export function DashboardView({ params }: { params: Promise<{ id: string }> }) {
  // use() รอ Promise ให้เสร็จ เช่น { id: "e-workshop" } (อยู่ภายใน <Suspense> ของ page.tsx)
  const { id } = use(params);
  const access = useEventAccess(id);

  // ภาษา: ก่อน store โหลดเสร็จ user = null → "th" (ตรงกันทั้ง server และ client)
  const user = useStore((s) => s.currentUser);
  const lang: Lang = user?.lang ?? "th";
  const t = TEXT[lang];

  if (access.status === "loading") return null;

  // ด่านที่ 1: ไม่พบ / ถูกลบ / ไม่ได้รับมอบหมาย → ไม่แสดงข้อมูล Event ใดๆ
  if (access.status === "denied") {
    return (
      <Card className="mt-4 items-center gap-2 rounded-2xl py-12 text-center ring-slate-200">
        <ShieldAlert size={32} className="text-slate-400" />
        <p className="text-lg font-semibold">{t.notFound}</p>
        <p className="text-sm text-slate-500">{t.notFoundHint}</p>
        <Button variant="ghost" nativeButton={false} render={<Link href="/admin/events" />} className="mt-3 text-blue-600">
          <ChevronLeft /> {t.back}
        </Button>
      </Card>
    );
  }

  const { event } = access;

  return (
    <div className="grid gap-4">
      <Header event={event} lang={lang} t={t} />

      {access.status === "nodata" ? (
        // ด่านที่ 2: Draft / Scheduled → ยังไม่มีข้อมูล (แสดงแค่ส่วนหัว)
        <Card className="items-center gap-2 rounded-2xl py-12 text-center ring-slate-200">
          <BarChart3 size={32} className="text-slate-400" />
          <p className="text-lg font-semibold">{t.noData}</p>
          <p className="text-sm text-slate-500">{t.noDataHint}</p>
        </Card>
      ) : (
        <>
          <Shortcuts eventId={event.id} t={t} />
          <KpiBar event={event} data={access.data} lang={lang} t={t} />
          {/* กราฟแท่ง (กว้าง 3 ส่วน) + โดนัท (กว้าง 2 ส่วน) */}
          <div className="grid gap-4 md:grid-cols-5">
            <SlotChart event={event} data={access.data} t={t} />
            <RespondedDonut data={access.data} t={t} />
          </div>
          {/* ซ้าย (3 ส่วน): ลงทะเบียนล่าสุด + สถานะ Event | ขวา (2 ส่วน): เมื่อไหร่และที่ไหน + ความพึงพอใจ */}
          <div className="grid items-start gap-4 md:grid-cols-5">
            <div className="grid gap-4 md:col-span-3">
              <LatestRegistrations eventId={event.id} data={access.data} lang={lang} t={t} />
              <StatusTable event={event} data={access.data} t={t} />
            </div>
            <div className="grid gap-4 md:col-span-2">
              <WhenWhere event={event} lang={lang} t={t} />
              <Satisfaction data={access.data} lang={lang} t={t} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ============ ส่วนหัว ============
// "Event ของฉัน ›" / ชื่อ Event / ป้ายสถานะ + ข้อความ "คุณดูในฐานะ ..."
function Header({ event, lang, t }: { event: Event; lang: Lang; t: Text }) {
  return (
    <div>
      <Link href="/admin/events" className="inline-flex items-center text-sm text-slate-500 hover:text-blue-600">
        {t.myEvents} <ChevronRight size={14} />
      </Link>
      <h1 className="mt-1 text-3xl font-bold">{tr(event.name, lang)}</h1>
      <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-500">
        <StatusBadge status={event.status} t={t} />
        <span>{t.viewingAs}</span>
      </div>
    </div>
  );
}

// ป้ายสถานะ: สีจาก STATUS_LABEL (lib) + ข้อความ TH/EN จากพจนานุกรม
function StatusBadge({ status, t }: { status: EventStatus; t: Text }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_LABEL[status].color}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {t.status[status]}
    </span>
  );
}

// ============ การ์ดทางลัด 3 ใบ ============
// QR → /qr, Kiosk → /kiosk, Export → หน้า Report (มีปุ่ม CSV / PDF อยู่แล้ว)
function Shortcuts({ eventId, t }: { eventId: string; t: Text }) {
  const base = `/admin/events/${eventId}`;
  const items: { href: string; label: string; icon: LucideIcon; tile: string }[] = [
    { href: `${base}/qr`, label: t.qr, icon: QrCode, tile: "bg-blue-50 text-blue-600" },
    { href: `${base}/kiosk`, label: t.kiosk, icon: Smartphone, tile: "bg-violet-50 text-violet-600" },
    { href: `${base}/report`, label: t.export, icon: Download, tile: "bg-rose-50 text-rose-600" },
  ];
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {items.map((it) => {
        const Icon = it.icon;
        return (
          <Link
            key={it.href}
            href={it.href}
            className="flex items-center gap-3 rounded-2xl bg-white px-5 py-4 text-sm font-semibold shadow-sm ring-1 ring-slate-200 hover:ring-blue-300"
          >
            <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${it.tile}`}>
              <Icon size={16} />
            </span>
            {it.label}
          </Link>
        );
      })}
    </div>
  );
}

// ============ แถบ KPI 4 ช่อง ============
function KpiBar({ event, data, lang, t }: { event: Event; data: ReportData; lang: Lang; t: Text }) {
  const regs = data.registrations.length;      // 46
  const responded = data.responses.length;     // 31

  // เวลาของคนลงทะเบียนล่าสุด เช่น "2026-10-23T10:15:00+07:00" → "10:15"
  const latest = data.registrations.map((r) => r.createdAt).sort().at(-1);
  const latestTime = latest ? formatTime(latest, lang) : "—";

  return (
    <div className="grid rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 md:grid-cols-4 md:divide-x md:divide-slate-100">
      <KpiCell label={t.registered} value={String(regs)} sub={t.latestAt(latestTime)} />
      {/* ยังไม่ตอบ = ผู้ลงทะเบียน − ผู้ตอบ เช่น 46 − 31 = 15 (ไม่ติดลบ) */}
      <KpiCell label={t.answered} value={String(responded)} sub={t.notAnswered(Math.max(0, regs - responded))} />
      {/* 31 ÷ 46 = 0.673… → 67% (pct ตัวเดียวกับหน้า Report) */}
      <KpiCell label={t.rate} value={`${pct(responded, regs)}%`} sub={t.rateOf(responded, regs)} />
      <RemainingCell event={event} t={t} />
    </div>
  );
}

function KpiCell({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="px-5 py-4">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-4xl font-bold">{value}</p>
      <p className="mt-1 text-xs text-slate-500">{sub}</p>
    </div>
  );
}

// ============ นาฬิกา (เวลาปัจจุบันแบบปัดเศษ) ============
// useSyncExternalStore + setInterval ทุก 1 วินาที
// - ฝั่ง server ได้ null → ตอน hydrate ตรงกันเสมอ แล้วค่อยได้เวลาจริง (ไม่มี hydration warning)
// - ปัดตาม stepMs: ค่าเดิมตลอดช่วงนั้น React จึงวาดใหม่เมื่อค่าเปลี่ยนเท่านั้น
//   useNow(1000) → วาดใหม่ทุกวินาที (นับถอยหลัง) | useNow(60_000) → ทุกนาที (กราฟ)
function subscribeClock(onTick: () => void) {
  const timer = setInterval(onTick, 1000);
  return () => clearInterval(timer);
}

function useNow(stepMs: number): number | null {
  const step = useSyncExternalStore(subscribeClock, () => Math.floor(Date.now() / stepMs), () => null);
  return step === null ? null : step * stepMs;
}

// ============ ช่อง "เหลือเวลา" (นับถอยหลังจากนาฬิกาจริง) ============
// แยกเป็นคอมโพเนนต์เล็ก เพื่อให้ "ช่องนี้ช่องเดียว" วาดใหม่ทุกวินาที ไม่ใช่ทั้งหน้า
function RemainingCell({ event, t }: { event: Event; t: Text }) {
  const r = remainingOf(event, useNow(1000));

  const closesText = event.endTime ? t.closesAt(event.endTime) : t.timeUnset;
  let value = "—";
  let sub = closesText;
  if (r.kind === "countdown") value = formatCountdown(r.ms);          // วันงาน ยังไม่ถึงเวลาปิด → "1:20:04"
  else if (r.kind === "days") value = t.inDays(r.days);                // ยังไม่ถึงวันงาน → "อีก 3 วัน"
  else if (r.kind === "closed") sub = event.endTime ? closesText : t.closed; // ปิดแล้ว → "—"
  // "unset" (ไม่มีวัน/เวลาปิด) และ "pending" (ยังไม่รู้เวลา) → "—"

  return <KpiCell label={t.remaining} value={value} sub={sub} />;
}

type Remaining =
  | { kind: "pending" }            // ยังไม่ได้อ่านนาฬิกา (ตอน render ฝั่ง server / ก่อน hydrate)
  | { kind: "unset" }              // Event ไม่มีวันที่หรือเวลาปิด
  | { kind: "closed" }             // เลยเวลาปิดแล้ว หรือสถานะ Ended
  | { kind: "countdown"; ms: number } // วันนี้คือวันงาน และยังไม่ถึงเวลาปิด
  | { kind: "days"; days: number };   // ยังไม่ถึงวันงาน

// remainingOf: รับ Event + เวลาปัจจุบัน (ms) → บอกว่าช่อง "เหลือเวลา" ควรแสดงแบบไหน
// ตัวอย่าง (Workshop: 2026-10-23 ปิด 15:00):
//   now = 2026-10-23 13:39:56 → { countdown, ms: 4_804_000 } → "1:20:04"
//   now = 2026-10-20 09:00    → { days: 3 }
//   now = 2026-11-12 (วันนี้)  → { closed }
function remainingOf(event: Event, nowMs: number | null): Remaining {
  if (nowMs === null) return { kind: "pending" };
  if (event.status === "ended") return { kind: "closed" };
  if (!event.date || !event.endTime) return { kind: "unset" };

  const end = localDateTime(event.date, event.endTime);
  if (nowMs >= end.getTime()) return { kind: "closed" };

  const today = startOfDay(new Date(nowMs));
  const eventDay = localDateTime(event.date, "00:00");
  if (eventDay.getTime() <= today.getTime()) return { kind: "countdown", ms: end.getTime() - nowMs };

  // ปัดเศษ เผื่อวันที่มีการเปลี่ยนเวลา (DST) ที่ 1 วันไม่ใช่ 24 ชม. พอดี
  const days = Math.round((eventDay.getTime() - today.getTime()) / 86_400_000);
  return { kind: "days", days };
}

// ============ กราฟ "ลงทะเบียนต่อช่วง 30 นาที" ============
// ช่วงของกราฟ: เริ่ม = ค่าที่น้อยกว่าระหว่าง "เวลาเริ่มงาน" กับ "คนแรก"
//              จบ  = ค่าที่มากกว่าระหว่าง "เวลาปิดงาน" กับ "คนสุดท้าย"
//              (Event ที่ไม่มีเวลา ใช้แค่ช่วงของข้อมูล)
// ตัวอย่าง Workshop: เริ่มงาน 10:00 / คนแรก 10:02 → 10:00 | ปิด 15:00 / คนสุดท้าย 12:38 → 15:00
//   → 10 ช่วง 10:00 … 14:30 = [12, 14, 8, 6, 4, 2, 0, 0, 0, 0]
function SlotChart({ event, data, t }: { event: Event; data: ReportData; t: Text }) {
  const nowMs = useNow(60_000); // ใช้ตัดสินว่าช่วงไหน "ยังมาไม่ถึง" (วาดใหม่ทุกนาทีพอ)

  // นาทีของวันของแต่ละคน เช่น 10:32 → 632 (เวลาตามเครื่องผู้ใช้ แบบเดียวกับ formatTime)
  const regMinutes = data.registrations.map((r) => {
    const d = new Date(r.createdAt);
    return d.getHours() * 60 + d.getMinutes();
  });
  const starts = [...regMinutes];
  const ends = regMinutes.map((m) => m + 1); // +1 = ให้นาทีของคนสุดท้ายอยู่ในช่วงเสมอ
  if (event.startTime) starts.push(toMinutes(event.startTime));
  if (event.endTime) ends.push(toMinutes(event.endTime));
  if (starts.length === 0) return null; // ไม่มีทั้งข้อมูลและเวลา → ไม่มีกราฟ

  const first = Math.floor(Math.min(...starts) / 30) * 30; // ปัดลงเป็นต้นช่วง: 602 → 600
  const last = Math.ceil(Math.max(...ends) / 30) * 30;     // ปัดขึ้นเป็นท้ายช่วง: 900 → 900 (15:00)
  const slotStarts: number[] = [];
  for (let m = first; m < last; m += 30) slotStarts.push(m);

  // นับคนในแต่ละช่วง: ช่วง 630 (10:30) นับคนที่ 630 ≤ นาที < 660
  const counts = slotStarts.map((s) => regMinutes.filter((m) => m >= s && m < s + 30).length);

  // ช่วงที่มากสุด (เท่ากันเลือกช่วงแรก) — ทุกช่วงเป็น 0 → ไม่มี peak
  const maxCount = Math.max(0, ...counts);
  const peakIndex = maxCount > 0 ? counts.indexOf(maxCount) : -1;

  // "ยังมาไม่ถึง" = ต้นช่วงอยู่หลังเวลาปัจจุบัน (ต้องรู้วันงาน) — ตอนนี้ mock เลยวันงานแล้ว จึงไม่มี
  const isFuture = (slot: number) =>
    nowMs !== null && event.date !== "" && localDateTime(event.date, toHHMM(slot)).getTime() > nowMs;

  const bars: VBar[] = slotStarts.map((s, i) => ({
    label: toHHMM(s),
    value: counts[i],
    state: isFuture(s) ? "future" : i === peakIndex ? "peak" : "normal",
  }));

  return (
    <div className="rounded-2xl bg-white px-5 py-4 shadow-sm ring-1 ring-slate-200 md:col-span-3">
      <div className="flex items-baseline justify-between gap-3">
        <p className="font-semibold">{t.perSlot}</p>
        {peakIndex >= 0 && <span className="text-xs text-slate-500">{t.peak(toHHMM(slotStarts[peakIndex]), maxCount)}</span>}
      </div>
      <div className="mt-6">
        <VBars bars={bars} />
      </div>
    </div>
  );
}

// ============ โดนัท "ตอบ Survey แล้ว" ============
// ใช้ Donut เดิมจาก charts.tsx: ส่วนน้ำเงิน = ตอบแล้ว 31, ส่วนเทา = ยังไม่ตอบ 15
function RespondedDonut({ data, t }: { data: ReportData; t: Text }) {
  const regs = data.registrations.length;
  const responded = data.responses.length;
  const notYet = Math.max(0, regs - responded);
  return (
    <div className="flex flex-col rounded-2xl bg-white px-5 py-4 shadow-sm ring-1 ring-slate-200 md:col-span-2">
      <p className="font-semibold">{t.responded}</p>
      <div className="flex flex-1 flex-col items-center justify-center gap-3 py-2">
        <Donut
          segments={[
            { value: responded, color: "#2563EB" },
            { value: notYet, color: "#E2E8F0" },
          ]}
          center={`${pct(responded, regs)}%`}
          centerSub={t.rateOf(responded, regs)}
        />
        <div className="flex gap-4 text-xs text-slate-600">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-blue-600" /> {t.respondedN(responded)}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-slate-200" /> {t.notRespondedN(notYet)}
          </span>
        </div>
      </div>
    </div>
  );
}

// ============ ตาราง "ลงทะเบียนล่าสุด" (5 รายการ) ============
// ไม่มีป้าย ตอบแล้ว/ยังไม่ตอบ: SurveyResponse ไม่มีช่องโยงกลับไปหาผู้ลงทะเบียน จึงรู้ไม่ได้ว่าใครตอบ
const LATEST_COUNT = 5;

function LatestRegistrations({ eventId, data, lang, t }: { eventId: string; data: ReportData; lang: Lang; t: Text }) {
  // เรียงจากใหม่ไปเก่า แล้วเอา 5 คนแรก เช่น 12:38, 12:34, 12:16, 12:12, 12:08
  const latest = [...data.registrations].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, LATEST_COUNT);
  const total = data.registrations.length;

  return (
    <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
      <div className="flex items-center justify-between gap-3 px-5 py-4">
        <div className="flex flex-wrap items-baseline gap-x-3">
          <p className="font-semibold">{t.latestTitle}</p>
          {latest.length > 0 && (
            <span className="text-xs text-slate-500">{t.latestSub(formatTime(latest[0].createdAt, lang), latest.length, total)}</span>
          )}
        </div>
        <Button variant="secondary" size="sm" nativeButton={false} render={<Link href={`/admin/events/${eventId}/report/participants`} />}>
          {t.seeAll}
        </Button>
      </div>
      {latest.length === 0 ? (
        <p className="border-t border-slate-100 px-5 py-6 text-center text-sm text-slate-400">{t.noRegs}</p>
      ) : (
        <ul>
          {latest.map((r) => (
            <li key={r.id} className="flex gap-6 border-t border-slate-100 px-5 py-3 text-sm">
              <span className="w-12 shrink-0 text-slate-500">{formatTime(r.createdAt, lang)}</span>
              {/* answers.name เป็นชื่อสมมติจาก mock (string) */}
              <span>{String(r.answers.name ?? "—")}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ============ ตาราง "สถานะ Event" ============
// ทุกค่าคิดจากข้อมูลจริง:
// - QR ลงทะเบียน: active → เปิดรับอยู่ | อื่นๆ → ปิดรับแล้ว (registration.opensAt/closesAt ใน mock ยังว่าง)
// - Survey: data.survey (enabled + จำนวนข้อ) และ "ล็อกแล้ว" เมื่อเลยช่วงที่แก้ได้ (Draft/Scheduled)
// - จอ Kiosk: event.kiosk.screen | ทีมดูแล: event.adminIds.length
const EDITABLE: EventStatus[] = ["draft", "scheduled"]; // Event Admin แก้ได้เฉพาะก่อน Active

function StatusTable({ event, data, t }: { event: Event; data: ReportData; t: Text }) {
  const locked = !EDITABLE.includes(event.status);
  const rows: { label: string; value: string; tone?: "green" }[] = [
    event.status === "active"
      ? { label: t.rows.qr, value: t.regOpen, tone: "green" }
      : { label: t.rows.qr, value: t.regClosed },
    { label: t.rows.survey, value: t.surveyState(data.survey.enabled, data.survey.questions.length, locked) },
    { label: t.rows.kiosk, value: t.kioskScreen[event.kiosk.screen] },
    { label: t.rows.team, value: t.team(event.adminIds.length) },
    { label: t.rows.edit, value: locked ? t.editLocked : t.editOpen },
  ];
  return (
    <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
      <p className="px-5 py-4 font-semibold">{t.statusTitle}</p>
      <ul>
        {rows.map((r) => (
          <li key={r.label} className="flex justify-between gap-4 border-t border-slate-100 px-5 py-3 text-sm">
            <span>{r.label}</span>
            <span className={r.tone === "green" ? "font-semibold text-green-600" : "text-slate-500"}>{r.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ============ การ์ด "เมื่อไหร่และที่ไหน" ============
// วันที่: วันนี้ → "วันนี้ · ศ. 23 ต.ค." | วันอื่น → "ศ. 23 ต.ค. 2569"
// เวลา: "10:00 – 15:00 · เหลือ 2 ชม. 20 น." / "· อีก 3 วัน" / "· ปิดงานแล้ว" (ใช้ remainingOf ตัวเดียวกับ KPI)
function WhenWhere({ event, lang, t }: { event: Event; lang: Lang; t: Text }) {
  const nowMs = useNow(60_000);

  let dateText = t.dateUnset;
  if (event.date) {
    const day = localDateTime(event.date, "00:00");
    const isToday = nowMs !== null && startOfDay(new Date(nowMs)).getTime() === day.getTime();
    dateText = isToday ? `${t.today} · ${formatDay(day, lang, false)}` : formatDay(day, lang, true);
  }

  const parts: string[] = [];
  if (event.startTime && event.endTime) parts.push(`${event.startTime} – ${event.endTime}`);
  const r = remainingOf(event, nowMs);
  if (r.kind === "countdown") {
    const mins = Math.floor(r.ms / 60_000); // 140 นาที → "เหลือ 2 ชม. 20 น."
    parts.push(t.left(Math.floor(mins / 60), mins % 60));
  } else if (r.kind === "days") parts.push(t.inDays(r.days));
  else if (r.kind === "closed") parts.push(t.closed);
  const timeText = parts.length ? parts.join(" · ") : t.timeUnset;

  return (
    <div className="rounded-2xl bg-white px-5 py-4 shadow-sm ring-1 ring-slate-200">
      <p className="font-semibold">{t.whenWhere}</p>
      <div className="mt-3 grid gap-3">
        <InfoRow icon={Clock} title={dateText} sub={timeText} />
        <InfoRow icon={MapPin} title={event.venue || t.venueUnset} sub={event.meetingPoint} />
      </div>
    </div>
  );
}

function InfoRow({ icon: Icon, title, sub }: { icon: LucideIcon; title: string; sub?: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ring-1 ring-slate-200">
        <Icon size={16} />
      </span>
      <div className="text-sm">
        <p className="font-semibold">{title}</p>
        {sub && <p className="text-xs text-slate-500">{sub}</p>}
      </div>
    </div>
  );
}

// ============ การ์ด "ความพึงพอใจ" ============
// ใช้คำถามแบบ Rating ข้อแรก (ตามลำดับ) + summarize() ตัวเดียวกับแท็บ Survey → ตัวเลขตรงกัน
// ไม่มีคำถาม Rating → ไม่แสดงการ์ดนี้
function Satisfaction({ data, lang, t }: { data: ReportData; lang: Lang; t: Text }) {
  const question = [...data.survey.questions].sort((a, b) => a.order - b.order).find((q) => q.type === "rating");
  if (!question) return null;

  const summary = summarize(question, data.responses, lang); // ไม่ส่งคำกำกับสเกล → ป้าย "5".."1"
  if (summary.kind !== "bars") return null;
  const max = Math.max(0, ...summary.rows.map((r) => r.count));

  return (
    <div className="rounded-2xl bg-white px-5 py-4 shadow-sm ring-1 ring-slate-200">
      <p className="font-semibold">{t.satisfaction}</p>
      {summary.avg && <p className="mt-0.5 text-xs text-slate-500">{t.avgOf(summary.avg, summary.n)}</p>}
      <div className="mt-3 space-y-2">
        {summary.rows.map((r) => (
          // ใช้ HBar เดิม: ป้าย "5 ★", แท่งยาวตามค่ามากสุด, ขวาเป็นจำนวนคน (ตามต้นแบบ ไม่มี %)
          <HBar key={r.label} label={`${r.label} ★`} value={r.count} max={max} right={String(r.count)} />
        ))}
      </div>
    </div>
  );
}

// วันที่แบบมีชื่อวันย่อ ตามต้นแบบ "ศ. 17 ต.ค."
// TH: เบราว์เซอร์ให้ weekday "short" เป็น "ศุกร์" (ยาวไป) → ใช้ "narrow" ("ศ") แล้วเติมจุดเอง
//   23 ต.ค. 2569 → "ศ. 23 ต.ค." | withYear → "ศ. 23 ต.ค. 2569"
// EN: "Fri 23 Oct" | withYear → "Fri 23 Oct 2026"
function formatDay(d: Date, lang: Lang, withYear: boolean): string {
  if (lang === "en") {
    return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", ...(withYear && { year: "numeric" }) });
  }
  const weekday = d.toLocaleDateString("th-TH", { weekday: "narrow" });
  const date = d.toLocaleDateString("th-TH", { day: "numeric", month: "short", ...(withYear && { year: "numeric" }) });
  return `${weekday}. ${date}`;
}

// "10:30" → 630 | 630 → "10:30"
function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}
function toHHMM(minutes: number): string {
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
}

// "2026-10-23" + "15:00" → Date ตามเวลาท้องถิ่น (แยกตัวเลขเอง ไม่ให้ถูกอ่านเป็น UTC)
function localDateTime(date: string, time: string): Date {
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  return new Date(y, m - 1, d, hh, mm);
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

// 4_804_000 ms → "1:20:04" (ชั่วโมง:นาที:วินาที)
function formatCountdown(ms: number): string {
  const total = Math.floor(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

// "2026-10-23T10:15:00+07:00" → "10:15" (24 ชม. ทั้งสองภาษา)
function formatTime(iso: string, lang: Lang): string {
  return new Date(iso).toLocaleTimeString(lang === "th" ? "th-TH" : "en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}
