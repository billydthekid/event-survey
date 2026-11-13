// components/layout/EventPicker.tsx
"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, ChevronsUpDown, Search, X } from "lucide-react";
import { useStore } from "@/lib/store";
import { countByEvent, summarize, visibleEvents } from "@/lib/utils/stats";
import { STATUS_LABEL } from "@/lib/utils/status";
import { formatDayMonth } from "@/lib/utils/date";
import { EventStatus } from "@/types";
import CreateEventModal from "@/components/events/CreateEventModal";

// ช่อง "กำลังดู ..." ใน Sidebar + popup เลือก Event
// เลือก "ภาพรวมทุก Event" → /super · เลือก Event → /super/events/[id]/dashboard
// Event ที่กำลังดูอ่านจาก URL ([id]) — Sidebar ส่ง eventId เข้ามา

// ลำดับสถานะในรายการ (กำลังจัดงานขึ้นก่อน) — ใช้เป็นปุ่มกรองด้วย
const STATUS_ORDER: EventStatus[] = ["active", "scheduled", "ended", "draft"];

// ============ กล่องวันที่ (สี่เหลี่ยมเล็กหน้าชื่อ Event) ============
// all = กล่อง "All Event" ของแถวภาพรวม
function DateBox({ date, status, all }: { date?: string; status?: EventStatus; all?: boolean }) {
  // สีฟ้า = ภาพรวม / กำลังจัดงาน / ใกล้ถึง · สีเทา = จบแล้ว / ฉบับร่าง
  const bright = all || status === "active" || status === "scheduled";
  const color = bright ? "bg-blue-50 text-blue-600" : "bg-slate-100 text-slate-500";
  const dm = date ? formatDayMonth(date) : null;

  return (
    <div className={`flex h-[42px] w-10 shrink-0 flex-col items-center justify-center rounded-lg leading-tight ${color}`}>
      {all ? (
        <>
          <span className="text-[11px] font-bold">All</span>
          <span className="text-[10px]">Event</span>
        </>
      ) : dm ? (
        <>
          <span className="text-sm font-bold">{dm.day}</span>
          <span className="text-[10px]">{dm.month}</span>
        </>
      ) : (
        <span className="text-sm">—</span>
      )}
    </div>
  );
}

// ============ ช่อง "กำลังดู" ใน Sidebar (กดแล้วเปิด popup) ============
export function EventSwitcher({ eventId }: { eventId?: string }) {
  const [open, setOpen] = useState(false);
  const [showCreate, setShowCreate] = useState(false);   // modal สร้าง Event (ตัวเดียวกับปุ่มใน Sidebar)
  const event = useStore((s) => s.events.find((e) => e.id === eventId));

  // ไม่มี eventId = ดูทุก Event · มี id แต่หาไม่เจอ (ถูกลบ / พิมพ์ URL ผิด) = "ไม่พบ Event"
  const title = !eventId ? "ทุก Event" : event?.name.th ?? "ไม่พบ Event";

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="mb-3 flex w-full items-center gap-3 rounded-xl bg-white p-2 text-left shadow-sm hover:bg-slate-50"
      >
        <DateBox all={!eventId} date={event?.date} status={event?.status} />
        <span className="min-w-0 flex-1">
          <span className="block text-xs text-slate-400">กำลังดู</span>
          <span className="block truncate text-sm font-semibold">{title}</span>
        </span>
        <ChevronsUpDown size={16} className="shrink-0 text-slate-400" />
      </button>

      {open && (
        <EventPicker
          currentId={eventId}
          onClose={() => setOpen(false)}
          // ปิด popup เลือก Event ก่อน แล้วเปิด modal สร้าง Event ของ Billy
          onCreate={() => {
            setOpen(false);
            setShowCreate(true);
          }}
        />
      )}

      {showCreate && <CreateEventModal onClose={() => setShowCreate(false)} />}
    </>
  );
}

// ============ popup เลือก Event ============
function EventPicker({
  currentId,
  onClose,
  onCreate,
}: {
  currentId?: string;
  onClose: () => void;
  onCreate: () => void;
}) {
  const router = useRouter();
  const events = useStore((s) => s.events);
  const registrations = useStore((s) => s.registrations);
  const responses = useStore((s) => s.responses);

  // ---------- ค้นหา / กรอง ----------
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | EventStatus>("all");

  const summary = summarize(events, registrations, responses);  // แถวภาพรวม
  const registered = countByEvent(registrations);                // "ลงทะเบียน N คน" ต่อ Event
  const keyword = search.trim().toLowerCase();

  const list = visibleEvents(events)                                         // ไม่รวมที่ถูกลบ
    .filter((e) => statusFilter === "all" || e.status === statusFilter)     // ปุ่มกรองสถานะ
    .filter((e) => e.name.th.toLowerCase().includes(keyword))               // ช่องค้นหา
    // เรียงตามลำดับสถานะ → สถานะเดียวกันเอาวันล่าสุดขึ้นก่อน
    .sort(
      (a, b) =>
        STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status) || b.date.localeCompare(a.date)
    );

  // ---------- เลือกแล้ว: ปิด popup + ไปหน้านั้น ----------
  const go = (href: string) => {
    onClose();
    router.push(href);
  };

  return (
    // พื้นหลังทึบ — คลิกพื้นหลัง = ปิด
    <div onClick={onClose} className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40">
      {/* stopPropagation: คลิกในกล่องไม่ให้ทะลุไปปิด */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[700px] w-[520px] flex-col rounded-2xl bg-white shadow-xl"
      >
        {/* หัว */}
        <div className="flex items-center justify-between px-5 pt-5">
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-bold">เลือก Event</h3>
            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs text-blue-600">
              {summary.eventCount} Event
            </span>
          </div>
          <button onClick={onClose} className="rounded-lg bg-slate-100 p-2"><X size={16} /></button>
        </div>

        {/* ค้นหา */}
        <div className="px-5 pt-4">
          <div className="flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-2">
            <Search size={16} className="text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ค้นหาชื่อ Event"
              className="w-full bg-transparent text-sm outline-none"
              autoFocus
            />
          </div>
        </div>

        {/* ปุ่มกรองสถานะ */}
        <div className="flex flex-wrap gap-2 border-b border-slate-100 px-5 py-3">
          {(["all", ...STATUS_ORDER] as const).map((f) => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className={`rounded-full px-3 py-1 text-xs ${
                statusFilter === f ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-600"
              }`}
            >
              {f === "all" ? "ทั้งหมด" : STATUS_LABEL[f].text}
            </button>
          ))}
        </div>

        {/* รายการ (เลื่อนได้ถ้ายาว) */}
        <div className="flex-1 overflow-y-auto p-2">
          {/* แถวภาพรวมทุก Event */}
          <button
            onClick={() => go("/super")}
            className={`flex w-full items-center gap-3 rounded-lg p-3 text-left ${
              !currentId ? "bg-blue-50/60" : "hover:bg-slate-50"
            }`}
          >
            <DateBox all />
            <span className="flex-1">
              <span className="block text-sm font-semibold">ภาพรวมทุก Event</span>
              <span className="block text-xs text-slate-400">
                {summary.eventCount} Event · ลงทะเบียนรวม {summary.registered.toLocaleString("th-TH")} คน
              </span>
            </span>
            {!currentId && <Check size={18} className="text-blue-600" />}
          </button>

          <p className="px-3 pt-3 pb-1 text-xs text-slate-400">Event ทั้งหมด</p>

          {list.map((e) => {
            const s = STATUS_LABEL[e.status];
            const selected = e.id === currentId;
            return (
              <button
                key={e.id}
                onClick={() => go(`/super/events/${e.id}/dashboard`)}
                className={`flex w-full items-center gap-3 rounded-lg p-3 text-left ${
                  selected ? "bg-blue-50/60" : "hover:bg-slate-50"
                }`}
              >
                <DateBox date={e.date} status={e.status} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">{e.name.th}</span>
                  <span className="mt-1 flex items-center gap-2 text-xs text-slate-400">
                    <span className={`rounded-full px-2 py-0.5 ${s.color}`}>{s.text}</span>
                    {/* ฉบับร่างยังไม่มีวัน → บอกแทนจำนวนคน */}
                    {e.date ? `ลงทะเบียน ${(registered[e.id] ?? 0).toLocaleString("th-TH")} คน` : "ยังไม่กำหนดวัน"}
                  </span>
                </span>
                {selected && <Check size={18} className="text-blue-600" />}
              </button>
            );
          })}

          {list.length === 0 && <p className="py-8 text-center text-sm text-slate-400">ไม่พบ Event</p>}
        </div>

        {/* ท้าย */}
        <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3">
          <Link href="/super/events" onClick={onClose} className="text-sm text-blue-600 hover:underline">
            ดูแบบเต็มหน้า →
          </Link>
          <button
            onClick={onCreate}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            + สร้าง Event
          </button>
        </div>
      </div>
    </div>
  );
}
