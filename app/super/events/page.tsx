// app/super/events/page.tsx
//
// รายการ Event ทั้งหมด — Admin ลบ + assign/เปลี่ยนผู้ดูแลได้ที่นี่
//
// ถ้ามี query ?new=<id> จะ highlight แถวนั้น + เปิด picker ให้เลย (เพราะเพิ่งสร้าง event จาก sidebar)
"use client";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Trash2, X, UserPlus, UserCog, Search, Check } from "lucide-react";
import { useStore } from "@/lib/store";
import { STATUS_LABEL } from "@/lib/utils/status";
import { Event, User } from "@/types";

export default function EventsPage() {
  return (
    <Suspense fallback={null}>
      <EventsPageContent />
    </Suspense>
  );
}

function EventsPageContent() {
  const events = useStore((s) => s.events);
  const users = useStore((s) => s.users);
  const deleteEvent = useStore((s) => s.deleteEvent);
  const setEventAdmin = useStore((s) => s.setEventAdmin);

  const searchParams = useSearchParams();
  const newEventId = searchParams.get("new");

  const [target, setTarget] = useState<Event | null>(null);       // event ที่จะลบ
  const [assignTarget, setAssignTarget] = useState<Event | null>(null); // event ที่จะ assign

  // ถ้าเพิ่งสร้างจาก sidebar และยังไม่มีผู้ดูแล → เปิด picker ให้เลย
  useEffect(() => {
    if (!newEventId) return;
    const ev = events.find((e) => e.id === newEventId);
    if (ev && ev.adminIds.length === 0) setAssignTarget(ev);
  }, [newEventId, events]);

  // ไม่โชว์ตัวที่ถูกลบแล้ว (ไปดูที่หน้ารายการที่ถูกลบ)
  const list = events.filter((e) => e.status !== "deleted");

  const adminNames = (e: Event) =>
    e.adminIds
      .map((id) => users.find((u) => u.id === id)?.name)
      .filter(Boolean)
      .join(", ") || "-";

  const handleConfirmDelete = () => {
    if (target) deleteEvent(target.id);
    setTarget(null);
  };

  return (
    <div>
      <p className="text-sm text-slate-400">ผู้ดูแลระบบ / Event</p>
      <h1 className="mt-1 text-3xl font-bold">Event ทั้งหมด</h1>
      <p className="mt-1 text-slate-500">
        Admin เห็น ลบ และมอบหมายผู้ดูแล (Organizer) ได้ทุก Event
      </p>

      <div className="mt-6 rounded-xl bg-white shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-100 text-left text-slate-500">
            <tr>
              <th className="px-5 py-3">ชื่อ Event</th>
              <th className="px-5 py-3">รหัส</th>
              <th className="px-5 py-3">วันที่จัด</th>
              <th className="px-5 py-3">สถานะ</th>
              <th className="px-5 py-3">ผู้ดูแล</th>
              <th className="px-5 py-3">จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {list.map((e) => {
              const s = STATUS_LABEL[e.status];
              const noAdmin = e.adminIds.length === 0;
              const isNew = e.id === newEventId;
              return (
                <tr
                  key={e.id}
                  className={`border-t border-slate-100 ${
                    isNew ? "bg-blue-50/50" : ""
                  }`}
                >
                  <td className="px-5 py-4 font-semibold">
                    {e.name.th}
                    {isNew && (
                      <span className="ml-2 rounded bg-blue-100 px-1.5 py-0.5 text-xs text-blue-700">
                        เพิ่งสร้าง
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-slate-500">{e.code}</td>
                  <td className="px-5 py-4">{e.date || "ยังไม่กำหนด"}</td>
                  <td className="px-5 py-4">
                    <span className={`rounded-full px-3 py-1 text-xs ${s.color}`}>
                      {s.text}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    {noAdmin ? (
                      <span className="text-xs text-amber-600">ยังไม่มีผู้ดูแล</span>
                    ) : (
                      adminNames(e)
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setAssignTarget(e)}
                        className="flex items-center gap-1 text-xs text-blue-600 hover:underline"
                        title={noAdmin ? "เลือกผู้ดูแล" : "เปลี่ยนผู้ดูแล"}
                      >
                        {noAdmin ? <UserPlus size={14} /> : <UserCog size={14} />}
                        {noAdmin ? "เลือกผู้ดูแล" : "เปลี่ยนผู้ดูแล"}
                      </button>
                      <button
                        onClick={() => setTarget(e)}
                        className="flex items-center gap-1 text-xs text-red-500 hover:underline"
                      >
                        <Trash2 size={14} /> ลบ
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modal เลือก/เปลี่ยนผู้ดูแล */}
      {assignTarget && (
        <AssignAdminModal
          event={assignTarget}
          users={users}
          onConfirm={(adminId) => {
            setEventAdmin(assignTarget.id, adminId);
            setAssignTarget(null);
          }}
          onClose={() => setAssignTarget(null)}
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
