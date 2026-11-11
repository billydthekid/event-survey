// app/admin/events/page.tsx
// หน้า "Event ของฉัน" ของ Event Admin
// - เห็นเฉพาะ Event ที่ได้รับมอบหมาย (adminIds มี id ของฉัน) และยังไม่ถูกลบ
// - กรองตามสถานะด้วยแท็บ + ค้นหาด้วยชื่อ/รหัส
// - ไม่มีปุ่มสร้าง/ลบ Event (เป็นสิทธิ์ของ Super Admin)
"use client";
import { useState } from "react";
import Link from "next/link";
import { Info, Search } from "lucide-react";
import { useStore } from "@/lib/store";
import { STATUS_LABEL } from "@/lib/utils/status";
import { Event, EventStatus, Lang, User } from "@/types";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

// ============ พจนานุกรมข้อความ 2 ภาษา (ใช้เฉพาะหน้านี้) ============
const TEXT = {
  th: {
    title: "Event ของฉัน",
    subtitle: (n: number) => `Event ที่ Super Admin มอบหมายให้คุณดูแล · ${n} Event`,
    info: "คุณเห็นเฉพาะ Event ที่ได้รับมอบหมาย · การสร้าง Event ใหม่หรือเพิ่มผู้ดูแล ทำได้โดย Super Admin เท่านั้น",
    tabs: { all: "ทั้งหมด", draft: "Draft", scheduled: "Scheduled", active: "Active", ended: "Ended" },
    search: "ค้นหาชื่อ Event หรือรหัส",
    noDate: "ยังไม่กำหนดวัน",
    noVenue: "ยังไม่ระบุสถานที่",
    createdBy: (name: string) => `สร้างโดย ${name} (Super Admin)`,
    edit: "แก้ไข",
    report: "Report",
    qr: "QR",
    kiosk: "Kiosk",
    emptyNone: "ยังไม่มี Event ที่ได้รับมอบหมาย",
    emptyNoneHint: "เมื่อ Super Admin มอบหมาย Event ให้คุณ รายการจะแสดงที่นี่",
    emptyFilter: "ไม่พบ Event ที่ตรงกับเงื่อนไข",
    emptyFilterHint: "ลองเปลี่ยนแท็บสถานะ หรือแก้คำค้นหา",
  },
  en: {
    title: "My Events",
    subtitle: (n: number) => `Events assigned to you by Super Admin · ${n} event${n === 1 ? "" : "s"}`,
    info: "You only see events assigned to you · Only Super Admin can create events or add admins",
    tabs: { all: "All", draft: "Draft", scheduled: "Scheduled", active: "Active", ended: "Ended" },
    search: "Search by event name or code",
    noDate: "Date not set",
    noVenue: "Venue not set",
    createdBy: (name: string) => `Created by ${name} (Super Admin)`,
    edit: "Edit",
    report: "Report",
    qr: "QR",
    kiosk: "Kiosk",
    emptyNone: "No events assigned yet",
    emptyNoneHint: "Events assigned to you by Super Admin will appear here",
    emptyFilter: "No events match your filters",
    emptyFilterHint: "Try another status tab or change your search",
  },
};
type Text = (typeof TEXT)["th"];

// ค่าของแท็บ = "all" หรือสถานะที่ไม่ใช่ deleted
type Filter = "all" | Exclude<EventStatus, "deleted">;
const FILTERS: Filter[] = ["all", "draft", "scheduled", "active", "ended"];

// สถานะที่ Event Admin ยังแก้ไขได้ (ก่อน Active เท่านั้น)
const EDITABLE: EventStatus[] = ["draft", "scheduled"];

// ============ หน้าหลัก ============
export default function MyEventsPage() {
  const user = useStore((s) => s.currentUser);
  const events = useStore((s) => s.events);
  const users = useStore((s) => s.users);

  const [lang, setLang] = useState<Lang>("th");
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const t = TEXT[lang];

  // ชั้นที่ 1: Event ที่ฉันได้รับมอบหมาย และยังไม่ถูกลบ
  const myEvents = events.filter(
    (e) => user !== null && e.adminIds.includes(user.id) && e.status !== "deleted"
  );

  // ชั้นที่ 2: นับจำนวนต่อแท็บ (นับจาก myEvents ตัวเลขจึงไม่เปลี่ยนตามคำค้น)
  const countOf = (f: Filter) =>
    f === "all" ? myEvents.length : myEvents.filter((e) => e.status === f).length;

  // ชั้นที่ 3: กรองตามแท็บ แล้วกรองตามคำค้น (ไม่สนตัวพิมพ์เล็ก/ใหญ่)
  const q = query.trim().toLowerCase();
  const visible = myEvents
    .filter((e) => filter === "all" || e.status === filter)
    .filter(
      (e) =>
        q === "" ||
        e.name.th.toLowerCase().includes(q) ||
        (e.name.en ?? "").toLowerCase().includes(q) ||
        e.code.toLowerCase().includes(q)
    );

  return (
    <div>
      {/* หัวข้อ + ปุ่มสลับภาษา */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t.title}</h1>
          <p className="mt-1 text-sm text-slate-500">{t.subtitle(myEvents.length)}</p>
        </div>
        <div className="flex overflow-hidden rounded-full bg-white shadow-sm">
          {(["th", "en"] as Lang[]).map((l) => (
            <button
              key={l}
              onClick={() => setLang(l)}
              className={`px-3 py-1 text-sm ${lang === l ? "bg-slate-100 font-semibold" : ""}`}
            >
              {l.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* แถบข้อมูลสีฟ้า */}
      <div className="mt-5 flex items-center gap-2 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
        <Info size={16} className="shrink-0" />
        {t.info}
      </div>

      {/* แท็บสถานะ + ช่องค้นหา */}
      <div className="mt-5 flex flex-wrap items-center gap-4">
        <Tabs value={filter} onValueChange={(v) => setFilter(v as Filter)}>
          <TabsList className="h-auto bg-slate-200/70 p-1">
            {FILTERS.map((f) => (
              <TabsTrigger key={f} value={f} className="px-3 py-1.5">
                {t.tabs[f]} ({countOf(f)})
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="relative w-80">
          <Search size={16} className="absolute top-1/2 left-3 -translate-y-1/2 text-slate-400" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.search}
            className="h-10 rounded-xl bg-white pl-9"
          />
        </div>
      </div>

      {/* รายการ Event */}
      <div className="mt-4 grid gap-3">
        {myEvents.length === 0 ? (
          // กรณี 1: ไม่ได้รับมอบหมายเลย
          <EmptyState title={t.emptyNone} hint={t.emptyNoneHint} />
        ) : visible.length === 0 ? (
          // กรณี 2: มี Event แต่กรอง/ค้นหาแล้วไม่เจอ
          <EmptyState title={t.emptyFilter} hint={t.emptyFilterHint} />
        ) : (
          visible.map((e) => <EventCard key={e.id} event={e} users={users} t={t} />)
        )}
      </div>
    </div>
  );
}

// ============ การ์ด Event 1 ใบ ============
function EventCard({ event, users, t }: { event: Event; users: User[]; t: Text }) {
  const status = STATUS_LABEL[event.status];

  // ตัวย่อในกล่องซ้าย: เอาส่วนหน้า "-" ของรหัส เช่น "FIG-1017" → "FIG"
  const short = event.code.split("-")[0].slice(0, 3);

  // วันที่-เวลา เช่น "2026-10-23 · 10:00 – 15:00"
  const time = event.startTime ? ` · ${event.startTime} – ${event.endTime}` : "";
  const when = event.date ? event.date + time : t.noDate;

  // ชื่อคนสร้าง: หา user จาก createdBy เช่น "u-super-1" → "ธนพัฒน์ โสภารัตน์"
  const creator = users.find((u) => u.id === event.createdBy)?.name;

  return (
    <Card className="flex-row items-center gap-5 rounded-2xl px-6 py-5 ring-slate-200">
      <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-blue-50 text-sm font-bold text-blue-900">
        {short}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <Badge className={status.color}>{status.text}</Badge>
          <span className="text-sm">{when}</span>
        </div>
        <p className="mt-1 text-lg font-semibold">{event.name.th}</p>
        <p className="text-xs text-slate-500">
          {event.code} · {event.venue || t.noVenue}
          {creator && ` · ${t.createdBy(creator)}`}
        </p>
      </div>

      <EventActions event={event} t={t} />
    </Card>
  );
}

// ============ ปุ่มตามสถานะ ============
// draft / scheduled → "แก้ไข" | active / ended → ดูอย่างเดียว: Report, QR, Kiosk
function EventActions({ event, t }: { event: Event; t: Text }) {
  const base = `/admin/events/${event.id}`;

  const links = EDITABLE.includes(event.status)
    ? [{ href: `${base}/edit`, label: t.edit }]
    : [
        { href: `${base}/report`, label: t.report },
        { href: `${base}/qr`, label: t.qr },
        { href: `${base}/kiosk`, label: t.kiosk },
      ];

  return (
    <div className="flex shrink-0 items-center gap-1">
      {links.map((l) => (
        // Button ของ Base UI ใช้ render แทน asChild; nativeButton={false} เพราะข้างในเป็นลิงก์ <a>
        <Button
          key={l.href}
          variant="link"
          nativeButton={false}
          render={<Link href={l.href} />}
          className="font-semibold text-blue-600"
        >
          {l.label}
        </Button>
      ))}
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
