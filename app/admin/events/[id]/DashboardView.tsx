// app/admin/events/[id]/DashboardView.tsx
// Dashboard ของ Event หนึ่งงาน (ต้นแบบ: docs/figma/dashboard.png)
// ขั้น a2: ด่านสิทธิ์ + ส่วนหัว + ทางลัด 3 ใบ + แถบ KPI 4 ช่อง
// (กราฟ ตาราง และการ์ดที่เหลือ จะเพิ่มในขั้น b / c)
// - ตัวเลขมาจาก getReportData ชุดเดียวกับหน้า Report (ผ่าน useEventAccess)
// - ภาษามาจาก currentUser.lang (อ่านอย่างเดียว) เหมือน Sidebar
"use client";
import { use, useSyncExternalStore } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Download, QrCode, ShieldAlert, Smartphone, BarChart3, type LucideIcon } from "lucide-react";
import { useStore } from "@/lib/store";
import { STATUS_LABEL } from "@/lib/utils/status";
import { Event, EventStatus, Lang } from "@/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useEventAccess } from "./eventAccess";
import { ReportData } from "./report/mockData";
import { pct, tr } from "./report/summary";

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

// ============ ช่อง "เหลือเวลา" (นับถอยหลังจากนาฬิกาจริง) ============
// นาฬิกา: useSyncExternalStore + setInterval ทุก 1 วินาที
// - ฝั่ง server ได้ null → ตอน hydrate ตรงกันเสมอ แล้วค่อยได้เวลาจริง (ไม่มี hydration warning)
// - แยกเป็นคอมโพเนนต์เล็ก เพื่อให้ "ช่องนี้ช่องเดียว" วาดใหม่ทุกวินาที ไม่ใช่ทั้งหน้า
function subscribeClock(onTick: () => void) {
  const timer = setInterval(onTick, 1000);
  return () => clearInterval(timer);
}

function RemainingCell({ event, t }: { event: Event; t: Text }) {
  // วินาทีปัจจุบัน (ปัดเป็นวินาที → ค่าเดิมตลอด 1 วินาที React จึงไม่วาดซ้ำโดยไม่จำเป็น)
  const nowSec = useSyncExternalStore(subscribeClock, () => Math.floor(Date.now() / 1000), () => null);
  const r = remainingOf(event, nowSec === null ? null : nowSec * 1000);

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
