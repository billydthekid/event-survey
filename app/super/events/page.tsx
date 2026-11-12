// app/super/events/page.tsx
// หน้ารวม Event ทุกงาน (Super Admin) — Billy ทำตาราง + ลบ ไว้ก่อน · Jin เพิ่ม KPI / ค้นหา / กรอง / เรียง / สร้าง Draft
// ตาม Figma "Admin · Event ทั้งหมด (รวม)" · กดแถว → Dashboard ของ Event นั้น
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, CheckCircle2, Clock, PlayCircle, Plus, Trash2, X } from "lucide-react";
import { useStore } from "@/lib/store";
import { STATUS_LABEL } from "@/lib/utils/status";
import { countByEvent, visibleEvents } from "@/lib/utils/stats";
import { formatThaiDate } from "@/lib/utils/date";
import { matchKeyword, sortEvents, SortKey } from "@/lib/utils/eventList";
import { adminNames } from "@/components/dashboard/EventTable";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { EventFilterBar } from "@/components/events/EventFilterBar";
import { Badge, EventColumn, EventListTable } from "@/components/events/EventListTable";
import { Event, EventStatus } from "@/types";

// ปุ่มกรองสถานะ (ลำดับตาม Figma)
const STATUS_CHIPS: EventStatus[] = ["active", "scheduled", "ended", "draft"];

export default function EventsPage() {
  const router = useRouter();
  const events = useStore((s) => s.events);
  const users = useStore((s) => s.users);
  const registrations = useStore((s) => s.registrations);
  const deleteEvent = useStore((s) => s.deleteEvent);
  const createDraftEvent = useStore((s) => s.createDraftEvent);

  const [search, setSearch] = useState("");
  const [chip, setChip] = useState("all");
  const [sort, setSort] = useState<SortKey>("date");
  const [target, setTarget] = useState<Event | null>(null);   // event ที่จะลบ
  const [creating, setCreating] = useState(false);              // เปิด modal สร้าง Draft

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
    { key: "admin", header: "ผู้ดูแล", render: (e) => adminNames(e, users) },
    {
      key: "registered", header: "ลงทะเบียน", align: "right",
      render: (e) => `${(registered[e.id] ?? 0).toLocaleString("th-TH")} คน`,
    },
    {
      key: "manage", header: "จัดการ",
      render: (e) => (
        <div className="flex items-center gap-4 text-xs">
          <span className="text-blue-600">ดู →</span>
          {/* stopPropagation: กดลบแล้วไม่ให้ไปเปิดหน้า Dashboard ด้วย */}
          <button
            onClick={(ev) => { ev.stopPropagation(); setTarget(e); }}
            className="flex items-center gap-1 text-red-500 hover:underline"
          >
            <Trash2 size={14} /> ลบ
          </button>
        </div>
      ),
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
          <p className="mt-1 text-slate-500">Super Admin เห็นและจัดการได้ทุก Event · กดแถวเพื่อเปิด Dashboard ของ Event นั้น</p>
        </div>
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

      {/* Modal ยืนยันลบ (ของ Billy เดิม) */}
      {target && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40">
          <div className="w-[460px] rounded-2xl bg-white p-6">
            <div className="flex items-start justify-between">
              <div className="rounded-lg bg-red-50 p-2 text-red-600"><Trash2 size={22} /></div>
              <button onClick={() => setTarget(null)}><X size={20} /></button>
            </div>
            <h3 className="mt-4 text-xl font-bold">ลบ Event นี้?</h3>
            <p className="mt-1 text-sm text-slate-500">
              Event จะถูกย้ายไป &quot;รายการที่ถูกลบ&quot; และเก็บไว้ 30 วัน กู้คืนได้ก่อนครบกำหนด
            </p>
            <div className="mt-4 rounded-lg bg-slate-100 p-4 text-sm">
              <p className="font-semibold">{target.name.th}</p>
              <p className="text-slate-500">{target.code} · {STATUS_LABEL[target.status].text}</p>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => setTarget(null)} className="rounded-lg bg-slate-100 px-4 py-2 text-sm">
                ยกเลิก
              </button>
              <button onClick={handleConfirmDelete}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white">
                ยืนยันลบ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal สร้าง Draft */}
      {creating && (
        <CreateDraftModal
          onClose={() => setCreating(false)}
          onCreate={(name, adminId) => { createDraftEvent(name, adminId); setCreating(false); }}
        />
      )}
    </div>
  );
}

// ============ Modal สร้าง Event (Draft) ============
// กรอกแค่ชื่อ Event + เลือก Event Admin (แบบเดียวกับขั้นที่ 2 ของหน้าเพิ่มผู้ใช้) → store.createDraftEvent
function CreateDraftModal({ onClose, onCreate }: { onClose: () => void; onCreate: (name: string, adminId: string) => void }) {
  const users = useStore((s) => s.users);
  const admins = users.filter((u) => u.role === "event" && u.active);   // บัญชี Event Admin ที่ยังเปิดใช้

  const [name, setName] = useState("");
  const [adminId, setAdminId] = useState(admins[0]?.id ?? "");
  const [error, setError] = useState("");

  const submit = () => {
    if (!name.trim()) return setError("กรอกชื่อ Event");
    if (!adminId) return setError("เลือก Event Admin");
    onCreate(name, adminId);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40">
      <div className="w-[460px] rounded-2xl bg-white p-6">
        <div className="flex items-start justify-between">
          <h3 className="text-xl font-bold">สร้าง Event (Draft)</h3>
          <button onClick={onClose}><X size={20} /></button>
        </div>
        <p className="mt-1 text-sm text-slate-500">Event Admin ที่เลือกจะเข้าไปกรอกรายละเอียดต่อเอง</p>

        <label className="mt-5 block text-sm font-semibold">ชื่อ Event</label>
        <input
          value={name}
          onChange={(e) => { setName(e.target.value); setError(""); }}
          placeholder="เช่น Job Fair คณะ IT 2569"
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
        />

        <label className="mt-4 block text-sm font-semibold">Event Admin</label>
        <select
          value={adminId}
          onChange={(e) => { setAdminId(e.target.value); setError(""); }}
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
        >
          {admins.length === 0 && <option value="">ยังไม่มีบัญชี Event Admin</option>}
          {admins.map((u) => (
            <option key={u.id} value={u.id}>{u.name} · {u.username}</option>
          ))}
        </select>

        {error && <p className="mt-3 text-sm text-red-500">{error}</p>}

        <div className="mt-6 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-lg bg-slate-100 px-4 py-2 text-sm">ยกเลิก</button>
          <button onClick={submit} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white">
            สร้าง Draft
          </button>
        </div>
      </div>
    </div>
  );
}
