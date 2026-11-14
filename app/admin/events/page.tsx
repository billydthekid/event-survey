// app/admin/events/page.tsx
// หน้า "Event ของฉัน" ของ Event Admin (ต้นแบบ: docs/figma/myevent.png)
// - เห็นเฉพาะ Event ที่ได้รับมอบหมาย (adminIds มี id ของฉัน) และยังไม่ถูกลบ
// - กรองตามสถานะด้วยแท็บ: ทั้งหมด / Draft / Active / Ended
// - กติกาสถานะใหม่: Draft → เผยแพร่ → Active → Ended (ไม่มี Scheduled)
//   ข้อมูล mock ที่ยังเป็น "scheduled" → หน้านี้แสดงเป็น Draft (ไม่แก้ข้อมูลและ type)
// - ภาษามาจาก currentUser.lang เหมือน Sidebar และ Dashboard
// - ไม่มีปุ่มสร้าง/ลบ Event (เป็นสิทธิ์ของ Super Admin)
"use client";
import { useState } from "react";
import Link from "next/link";
import { Info } from "lucide-react";
import { useStore } from "@/lib/store";
import { STATUS_LABEL } from "@/lib/utils/status";
import { Event, Lang, User } from "@/types";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getReportData } from "./[id]/report/mockData";
import { formatEventWhen } from "./dateFormat";
import { EventQrButton } from "@/components/event/event-qr-button";

// ============ พจนานุกรมข้อความ 2 ภาษา (ใช้เฉพาะหน้านี้) ============
const TEXT = {
  th: {
    title: "Event ของฉัน",
    subtitle: (n: number) => `Event ที่ Super Admin มอบหมายให้คุณดูแล · ${n} Event`,
    info: "คุณเห็นเฉพาะ Event ที่ได้รับมอบหมาย · การสร้าง Event ใหม่หรือเพิ่มผู้ดูแล ทำได้โดย Super Admin เท่านั้น",
    // ใช้ทั้งเป็นชื่อแท็บและข้อความบนป้ายสถานะ (ตามต้นแบบ ป้ายเป็นคำอังกฤษ)
    tabs: { all: "ทั้งหมด", draft: "Draft", active: "Active", ended: "Ended" },
    noDate: "ยังไม่กำหนดวัน",
    noVenue: "ยังไม่ระบุสถานที่",
    createdBy: (name: string) => `สร้างโดย ${name} (Super Admin)`,
    registered: "ลงทะเบียน",
    responded: "ตอบ Survey",
    openDashboard: "เปิด Dashboard",
    continueSetup: "ตั้งค่าต่อ",
    soon: "เร็วๆ นี้",
    emptyNone: "ยังไม่มี Event ที่ได้รับมอบหมาย",
    emptyNoneHint: "เมื่อ Super Admin มอบหมาย Event ให้คุณ รายการจะแสดงที่นี่",
    emptyFilter: "ไม่พบ Event ในสถานะนี้",
    emptyFilterHint: "ลองเปลี่ยนแท็บสถานะ",
  },
  en: {
    title: "My Events",
    subtitle: (n: number) => `Events assigned to you by Super Admin · ${n} event${n === 1 ? "" : "s"}`,
    info: "You only see events assigned to you · Only Super Admin can create events or add admins",
    tabs: { all: "All", draft: "Draft", active: "Active", ended: "Ended" },
    noDate: "Date not set",
    noVenue: "Venue not set",
    createdBy: (name: string) => `Created by ${name} (Super Admin)`,
    registered: "Registered",
    responded: "Survey responses",
    openDashboard: "Open Dashboard",
    continueSetup: "Continue setup",
    soon: "Soon",
    emptyNone: "No events assigned yet",
    emptyNoneHint: "Events assigned to you by Super Admin will appear here",
    emptyFilter: "No events in this status",
    emptyFilterHint: "Try another status tab",
  },
};
type Text = (typeof TEXT)["th"];

// ============ สถานะที่ "หน้านี้" ใช้แสดง ============
// มีแค่ 3 แบบ (ไม่มี scheduled) — ไม่แก้ข้อมูลจริง แค่แปลงตอนแสดงผล
type ViewStatus = "draft" | "active" | "ended";

// viewStatus: รับ Event → คืนสถานะสำหรับแสดงในหน้านี้
// ตัวอย่าง: e-career (status "scheduled") → "draft" | e-workshop ("active") → "active"
function viewStatus(e: Event): ViewStatus {
  if (e.status === "active" || e.status === "ended") return e.status;
  return "draft"; // draft และ scheduled (deleted ถูกกรองออกตั้งแต่ชั้นแรกแล้ว)
}

// ค่าของแท็บ เรียงตามที่ทีมตัดสินใจ
type Filter = "all" | ViewStatus;
const FILTERS: Filter[] = ["all", "draft", "active", "ended"];

// ============ ตัวเลขบนการ์ด ============
// statsOf: รับ Event → คืนจำนวนผู้ลงทะเบียน / ผู้ตอบ Survey หรือ null (= แสดง "–")
// - Draft (รวม scheduled) → null เสมอ (ยังไม่เปิดงาน)
// - Active / Ended → ดึงจาก getReportData ถ้าไม่มีข้อมูล mock → null
// ตัวอย่าง: e-workshop → { registered: 46, responded: 31 } | e-career → null
function statsOf(e: Event): { registered: number; responded: number } | null {
  if (viewStatus(e) === "draft") return null;
  const data = getReportData(e.id);
  if (!data) return null;
  return { registered: data.registrations.length, responded: data.responses.length };
}

// ============ หน้าหลัก ============
export default function MyEventsPage() {
  const user = useStore((s) => s.currentUser);
  const events = useStore((s) => s.events);
  const users = useStore((s) => s.users);

  // ภาษา: ก่อน store โหลดเสร็จ user = null → "th" ทั้งฝั่ง server และ client (ไม่เกิด hydration mismatch)
  const lang: Lang = user?.lang ?? "th";
  const t = TEXT[lang];

  const [filter, setFilter] = useState<Filter>("all");

  // ชั้นที่ 1: Event ที่ฉันได้รับมอบหมาย และยังไม่ถูกลบ
  const myEvents = events.filter(
    (e) => user !== null && e.adminIds.includes(user.id) && e.status !== "deleted"
  );

  // ชั้นที่ 2: นับจำนวนต่อแท็บ (นับตาม viewStatus → scheduled ถูกนับในแท็บ Draft)
  const countOf = (f: Filter) =>
    f === "all" ? myEvents.length : myEvents.filter((e) => viewStatus(e) === f).length;

  // ชั้นที่ 3: กรองตามแท็บที่เลือก
  const visible = myEvents.filter((e) => filter === "all" || viewStatus(e) === filter);

  return (
    <div>
      {/* หัวข้อ */}
      <h1 className="text-3xl font-bold">{t.title}</h1>
      <p className="mt-1 text-sm text-slate-500">{t.subtitle(myEvents.length)}</p>

      {/* แถบข้อมูลสีฟ้า */}
      <div className="mt-5 flex items-center gap-2 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
        <Info size={16} className="shrink-0" />
        {t.info}
      </div>

      {/* แท็บสถานะ */}
      <Tabs value={filter} onValueChange={(v) => setFilter(v as Filter)} className="mt-5">
        <TabsList className="h-auto bg-slate-200/70 p-1">
          {FILTERS.map((f) => (
            <TabsTrigger key={f} value={f} className="px-3 py-1.5">
              {t.tabs[f]} ({countOf(f)})
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* รายการ Event */}
      <div className="mt-4 grid gap-3">
        {myEvents.length === 0 ? (
          // กรณี 1: ไม่ได้รับมอบหมายเลย
          <EmptyState title={t.emptyNone} hint={t.emptyNoneHint} />
        ) : visible.length === 0 ? (
          // กรณี 2: มี Event แต่แท็บที่เลือกไม่มี
          <EmptyState title={t.emptyFilter} hint={t.emptyFilterHint} />
        ) : (
          visible.map((e) => <EventCard key={e.id} event={e} users={users} lang={lang} t={t} />)
        )}
      </div>
    </div>
  );
}

// ============ การ์ด Event 1 ใบ ============
// ซ้าย: ตัวย่อ | กลาง: ป้ายสถานะ + วันเวลา, ชื่อ, รหัส·สถานที่·คนสร้าง | ขวา: ตัวเลข 2 ช่อง + ปุ่ม 1 ปุ่ม
function EventCard({ event, users, lang, t }: { event: Event; users: User[]; lang: Lang; t: Text }) {
  const view = viewStatus(event);
  const stats = statsOf(event);

  // ตัวย่อในกล่องซ้าย: เอาส่วนหน้า "-" ของรหัส เช่น "FIG-1017" → "FIG"
  const short = event.code.split("-")[0].slice(0, 3);

  // วันที่-เวลา เช่น "ศ. 23 ต.ค. 2569 · 10:00 – 15:00" (ตัวช่วยเดียวกับ Dashboard)
  const when = formatEventWhen(event, lang) ?? t.noDate;

  // ชื่อ Event: EN และมีชื่ออังกฤษ → ใช้ชื่ออังกฤษ ไม่งั้นใช้ชื่อไทย (แบบเดียวกับ Sidebar)
  const name = lang === "en" && event.name.en ? event.name.en : event.name.th;

  // ชื่อคนสร้าง: หา user จาก createdBy เช่น "u-super-1" → "ธนพัฒน์ โสภารัตน์"
  const creator = users.find((u) => u.id === event.createdBy)?.name;

  return (
    <Card className="flex-row items-center gap-5 rounded-2xl px-6 py-5 ring-slate-200">
      <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-blue-50 text-sm font-bold text-blue-900">
        {short}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          {/* สี: ของสถานะที่แสดง (scheduled → ใช้สีของ draft) | ข้อความ: คำเดียวกับแท็บ */}
          <Badge className={STATUS_LABEL[view].color}>{t.tabs[view]}</Badge>
          <span className="text-sm">{when}</span>
        </div>
        <p className="mt-1 text-lg font-semibold">{name}</p>
        <p className="text-xs text-slate-500">
          {event.code} · {event.venue || t.noVenue}
          {creator && ` · ${t.createdBy(creator)}`}
        </p>
      </div>

      {/* ตัวเลข: ไม่มีข้อมูล / Draft → "–" */}
      <Stat value={stats?.registered} label={t.registered} />
      <Stat value={stats?.responded} label={t.responded} />

      <EventAction event={event} view={view} t={t} />
    </Card>
  );
}

// ============ ตัวเลข 1 ช่อง ============
// value = undefined → แสดง "–"
function Stat({ value, label }: { value: number | undefined; label: string }) {
  return (
    <div className="w-24 shrink-0 text-center">
      <p className="text-xl font-bold">{value ?? "–"}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  );
}

// ============ ปุ่มเดียวต่อการ์ด ============
// Active / Ended → "เปิด Dashboard" ไปหน้า Dashboard ของ Event
// Draft (รวม scheduled) → "ตั้งค่าต่อ" ลิงก์ไปหน้า Wizard /admin/events/<id>/edit (ของเพื่อน)
//   (แสดงเฉพาะก่อน Active ตามกติกา: Event Admin แก้ได้เฉพาะก่อน Active — ตรงกับเมนูใน EventSidebar)
function EventAction({ event, view, t }: { event: Event; view: ViewStatus; t: Text }) {
  if (view === "draft") {
    // ไปหน้า Wizard 7 ขั้นของเพื่อน (feature/create-event)
    return (
      <div className="flex w-56 shrink-0 justify-end">
        <Button
          variant="link"
          nativeButton={false}
          render={<Link href={`/admin/events/${event.id}/edit`} />}
          className="px-0 font-semibold text-blue-600"
        >
          {t.continueSetup}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex w-56 shrink-0 items-center justify-end gap-3">
      {/* QR ลงทะเบียน / Survey (popup เดียวกับหลังกดเผยแพร่ · components/event/event-qr-button.tsx) */}
      <EventQrButton event={event} />
      {/* Button ของ Base UI ใช้ render แทน asChild; nativeButton={false} เพราะข้างในเป็นลิงก์ <a> */}
      <Button
        variant="link"
        nativeButton={false}
        render={<Link href={`/admin/events/${event.id}`} />}
        className="px-0 font-semibold text-blue-600"
      >
        {t.openDashboard}
      </Button>
    </div>
  );
}

// ============ ข้อความตอนไม่มีรายการ ============
function EmptyState({ title, hint }: { title: string; hint: string }) {
  return (
    <Card className="items-center rounded-2xl py-12 text-center ring-slate-200">
      <p className="font-semibold">{title}</p>
      <p className="text-sm text-slate-500">{hint}</p>
    </Card>
  );
}
