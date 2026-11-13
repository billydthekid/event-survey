// app/super/events/page.tsx
// หน้ารวม Event ทุกงาน (Admin) — Billy: ตาราง + ลบ + เลือก/เปลี่ยนผู้ดูแล + ไฮไลต์ ?new= · Jin: KPI / ค้นหา / กรอง / เรียง
// ตาม Figma "Admin · Event ทั้งหมด (รวม)" · กดแถว → Dashboard ของ Event นั้น
//
// ถ้ามี query ?new=<id> จะ highlight แถวนั้น + เปิด picker ให้เลย (เพราะเพิ่งสร้าง event จาก sidebar)
"use client";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  CalendarDays, Check, CheckCircle2, Clock, PlayCircle, Plus, Search, Trash2, UserCog, UserPlus, X,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { STATUS_LABEL } from "@/lib/utils/status";
import { countByEvent, visibleEvents } from "@/lib/utils/stats";
import { formatThaiDate } from "@/lib/utils/date";
import { matchKeyword, sortEvents, SortKey } from "@/lib/utils/eventList";
import { adminNames } from "@/components/dashboard/EventTable";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { EventFilterBar } from "@/components/events/EventFilterBar";
import { Badge, EventColumn, EventListTable } from "@/components/events/EventListTable";
import CreateEventModal from "@/components/events/CreateEventModal";
import { Event, EventStatus, User } from "@/types";

// ปุ่มกรองสถานะ (ลำดับตาม Figma)
const STATUS_CHIPS: EventStatus[] = ["active", "scheduled", "ended", "draft"];

// ครอบ <Suspense>: useSearchParams ต้องรอ URL (cacheComponents)
export default function EventsPage() {
  return (
    <Suspense fallback={null}>
      <EventsPageContent />
    </Suspense>
  );
}

function EventsPageContent() {
  const router = useRouter();
  const events = useStore((s) => s.events);
  const users = useStore((s) => s.users);
  const registrations = useStore((s) => s.registrations);
  const deleteEvent = useStore((s) => s.deleteEvent);
  const setEventAdmin = useStore((s) => s.setEventAdmin);

  const searchParams = useSearchParams();
  const newEventId = searchParams.get("new");

  const [search, setSearch] = useState("");
  const [chip, setChip] = useState("all");
  const [sort, setSort] = useState<SortKey>("date");
  const [target, setTarget] = useState<Event | null>(null);             // event ที่จะลบ
  const [assignTarget, setAssignTarget] = useState<Event | null>(null); // event ที่กดปุ่มเลือก/เปลี่ยนผู้ดูแล
  const [dismissedNewId, setDismissedNewId] = useState<string | null>(null); // ?new= ที่ปิด picker ไปแล้ว
  const [creating, setCreating] = useState(false);                      // เปิด modal สร้าง Event

  // ถ้าเพิ่งสร้างจาก sidebar และยังไม่มีผู้ดูแล → เปิด picker ให้เลย
  // คิดจากค่าที่มีตอน render (ไม่ใช้ useEffect + setState → eslint react-hooks/set-state-in-effect)
  // เก็บ id ที่ปิดไปแล้ว ไม่ใช่ true/false → สร้าง Event ใหม่อีกตัว (?new= เปลี่ยน) picker ก็ยังเปิดให้
  const newEvent = newEventId ? events.find((e) => e.id === newEventId) : undefined;
  const autoAssign = newEvent && newEvent.adminIds.length === 0 && newEventId !== dismissedNewId ? newEvent : null;
  const assigning = assignTarget ?? autoAssign;
  const closeAssign = () => {
    setAssignTarget(null);
    setDismissedNewId(newEventId);
  };

  // ---------- คิดตัวเลข ----------
  const list = visibleEvents(events);   // ไม่โชว์ตัวที่ถูกลบแล้ว (ไปดูที่หน้ารายการที่ถูกลบ)
  const registered = countByEvent(registrations);
  const count = (status: EventStatus) => list.filter((e) => e.status === status).length;
  const namesOf = (status: EventStatus) => list.filter((e) => e.status === status).map((e) => e.name.th).join(" · ");

  const shown = sortEvents(
    list.filter((e) => (chip === "all" || e.status === chip) && matchKeyword(e, search)),
    sort,
    registered
  );

  // ---------- คอลัมน์ของหน้านี้ (ชื่อ Event อยู่ใน EventListTable แล้ว) ----------
  const columns: EventColumn[] = [
    { key: "date", header: "วันที่จัด", render: (e) => formatThaiDate(e.date) },
    { key: "status", header: "สถานะ", render: (e) => <Badge {...STATUS_LABEL[e.status]} /> },
    {
      key: "admin", header: "ผู้ดูแล",
      render: (e) =>
        e.adminIds.length === 0
          ? <span className="text-xs text-amber-600">ยังไม่มีผู้ดูแล</span>
          : adminNames(e, users),
    },
    {
      key: "registered", header: "ลงทะเบียน", align: "right",
      render: (e) => `${(registered[e.id] ?? 0).toLocaleString("th-TH")} คน`,
    },
    {
      key: "manage", header: "จัดการ",
      render: (e) => {
        const noAdmin = e.adminIds.length === 0;
        return (
          <div className="flex items-center gap-4 whitespace-nowrap text-xs">
            <span className="text-blue-600">ดู →</span>
            {/* stopPropagation: กดปุ่มแล้วไม่ให้ไปเปิดหน้า Dashboard ด้วย */}
            <button
              onClick={(ev) => { ev.stopPropagation(); setAssignTarget(e); }}
              className="flex items-center gap-1 text-blue-600 hover:underline"
              title={noAdmin ? "เลือกผู้ดูแล" : "เปลี่ยนผู้ดูแล"}
            >
              {noAdmin ? <UserPlus size={14} /> : <UserCog size={14} />}
              {noAdmin ? "เลือกผู้ดูแล" : "เปลี่ยนผู้ดูแล"}
            </button>
            <button
              onClick={(ev) => { ev.stopPropagation(); setTarget(e); }}
              className="flex items-center gap-1 text-red-500 hover:underline"
            >
              <Trash2 size={14} /> ลบ
            </button>
          </div>
        );
      },
    },
  ];

  const handleConfirmDelete = () => {
    if (target) deleteEvent(target.id);
    setTarget(null);
  };

  return (
    <div>
      {/* ===== หัวข้อ ===== */}
      <div className="flex items-end justify-between">
        <div>
          <p className="text-sm text-slate-400">ผู้ดูแลระบบ / Event</p>
          <h1 className="mt-1 text-3xl font-bold">Event ทั้งหมด</h1>
          <p className="mt-1 text-slate-500">
            Admin เห็น ลบ และมอบหมายผู้ดูแล Organizer ได้ทุก Event · กดแถวเพื่อเปิด Dashboard ของ Event นั้น
          </p>
        </div>
        {/* ใช้ modal เดียวกับปุ่ม "สร้าง Event" ใน Sidebar ของ Billy */}
        <button
          onClick={() => setCreating(true)}
          className="flex shrink-0 items-center gap-2 whitespace-nowrap rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          <Plus size={16} /> สร้าง Event (Draft)
        </button>
      </div>

      {/* ===== KPI 4 ใบ ===== */}
      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard icon={CalendarDays} label="Event ทั้งหมด" value={list.length} sub="ไม่รวม Event ที่ถูกลบ" />
        <KpiCard icon={PlayCircle} label="กำลังจัดงาน" value={count("active")} sub={namesOf("active") || "-"} tone="green" />
        <KpiCard icon={Clock} label="ใกล้ถึง" value={count("scheduled")} sub={namesOf("scheduled") || "-"} tone="purple" />
        <KpiCard icon={CheckCircle2} label="จบแล้ว" value={count("ended")} sub={namesOf("ended") || "-"} tone="orange" />
      </div>

      {/* ===== ตาราง ===== */}
      <div className="mt-6">
        <EventListTable
          title="รายการ Event"
          total={list.length}
          events={shown}
          columns={columns}
          highlightId={newEventId}
          onSelect={(id) => router.push(`/super/events/${id}/dashboard`)}
          toolbar={
            <EventFilterBar
              search={search}
              onSearch={setSearch}
              chips={[
                { key: "all", label: "ทั้งหมด" },
                ...STATUS_CHIPS.map((s) => ({ key: s, label: STATUS_LABEL[s].text, count: count(s) })),
              ]}
              chip={chip}
              onChip={setChip}
              sort={sort}
              onSort={setSort}
            />
          }
        />
      </div>

      {/* Modal สร้าง Event (ของ Billy) → สร้างเสร็จพามาหน้านี้พร้อม ?new=<id> */}
      {creating && <CreateEventModal onClose={() => setCreating(false)} />}

      {/* Modal เลือก/เปลี่ยนผู้ดูแล */}
      {assigning && (
        <AssignAdminModal
          event={assigning}
          users={users}
          onConfirm={(adminId) => {
            setEventAdmin(assigning.id, adminId);
            closeAssign();
          }}
          onClose={closeAssign}
        />
      )}

      {/* Modal ยืนยันลบ */}
      {target && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40">
          <div className="w-[460px] rounded-2xl bg-white p-6">
            <div className="flex items-start justify-between">
              <div className="rounded-lg bg-red-50 p-2 text-red-600">
                <Trash2 size={22} />
              </div>
              <button onClick={() => setTarget(null)}>
                <X size={20} />
              </button>
            </div>
            <h3 className="mt-4 text-xl font-bold">ลบ Event นี้?</h3>
            <p className="mt-1 text-sm text-slate-500">
              Event จะถูกย้ายไป &quot;รายการที่ถูกลบ&quot; และเก็บไว้ 30 วัน กู้คืนได้ก่อนครบกำหนด
            </p>
            <div className="mt-4 rounded-lg bg-slate-100 p-4 text-sm">
              <p className="font-semibold">{target.name.th}</p>
              <p className="text-slate-500">
                {target.code} · {STATUS_LABEL[target.status].text}
              </p>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setTarget(null)}
                className="rounded-lg bg-slate-100 px-4 py-2 text-sm"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleConfirmDelete}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white"
              >
                ยืนยันลบ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ================= Modal เลือก Organizer (Typeahead) =================
// ไม่แสดง list จนกว่าจะพิมพ์ → scale ได้แม้มี 100+ คน
function AssignAdminModal({
  event,
  users,
  onConfirm,
  onClose,
}: {
  event: Event;
  users: User[];
  onConfirm: (adminId: string) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string>(event.adminIds[0] ?? "");
  const inputRef = useRef<HTMLInputElement>(null);

  const organizers = useMemo(
    () => users.filter((u) => u.role === "organizer" && u.active),
    [users]
  );

  // ผลลัพธ์ค้นหา (max 6 คน) — ถ้าไม่มี query คืน []
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q === "") return [];
    return organizers
      .filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          u.username.toLowerCase().includes(q) ||
          u.org.toLowerCase().includes(q)
      )
      .slice(0, 6);
  }, [organizers, query]);

  const selected = organizers.find((u) => u.id === selectedId);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40"
      onClick={onClose}
    >
      <div
        className="w-[520px] rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-xl font-bold">
              {event.adminIds.length === 0 ? "เลือกผู้ดูแล Event" : "เปลี่ยนผู้ดูแล Event"}
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              {event.name.th} · {event.code}
            </p>
          </div>
          <button onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* คนที่เลือกไว้ตอนนี้ */}
        {selected && (
          <div className="mt-4 flex items-center justify-between rounded-lg bg-blue-50 px-3 py-2 text-sm">
            <div>
              <p className="font-semibold text-blue-700">{selected.name}</p>
              <p className="text-xs text-blue-600/70">
                {selected.username} · {selected.org}
              </p>
            </div>
            <button
              onClick={() => setSelectedId("")}
              className="text-xs text-blue-600 hover:underline"
            >
              เปลี่ยน
            </button>
          </div>
        )}

        {/* ช่องค้นหา + ผลลัพธ์ (แสดงเมื่อยังไม่ได้เลือก หรือกำลังเปลี่ยน) */}
        {!selected && (
          <>
            <div className="mt-4 flex items-center gap-2 rounded-lg border border-slate-200 px-3 focus-within:border-blue-500">
              <Search size={16} className="text-slate-400" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="พิมพ์ชื่อ, username หรือหน่วยงานเพื่อค้นหา..."
                className="w-full bg-transparent py-2.5 text-sm outline-none"
              />
            </div>

            {query === "" ? (
              <p className="mt-6 text-center text-sm text-slate-400">
                มี organizer ทั้งหมด {organizers.length} คน · พิมพ์เพื่อค้นหา
              </p>
            ) : results.length === 0 ? (
              <p className="mt-6 text-center text-sm text-slate-400">
                ไม่พบผู้ใช้ที่ตรงกับ &quot;{query}&quot;
              </p>
            ) : (
              <ul className="mt-2 divide-y divide-slate-100 rounded-lg border border-slate-200">
                {results.map((u) => (
                  <li key={u.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(u.id)}
                      className="flex w-full items-center justify-between px-3 py-2.5 text-left text-sm hover:bg-slate-50"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium">{u.name}</p>
                        <p className="truncate text-xs text-slate-500">
                          {u.username} · {u.org}
                        </p>
                      </div>
                      <Check size={16} className="shrink-0 text-slate-300" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}

        <div className="mt-6 flex justify-end gap-2 border-t border-slate-100 pt-4">
          <button
            onClick={onClose}
            className="rounded-lg bg-slate-100 px-4 py-2 text-sm hover:bg-slate-200"
          >
            ยกเลิก
          </button>
          <button
            onClick={() => selected && onConfirm(selected.id)}
            disabled={!selected}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:bg-slate-300"
          >
            ยืนยัน
          </button>
        </div>
      </div>
    </div>
  );
}
