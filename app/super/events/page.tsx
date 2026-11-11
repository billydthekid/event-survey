// app/super/events/page.tsx
"use client";
import { useState } from "react";
import { Trash2, X } from "lucide-react";
import { useStore } from "@/lib/store";
import { STATUS_LABEL } from "@/lib/utils/status";
import { Event } from "@/types";

export default function EventsPage() {
  const events = useStore((s) => s.events);
  const users = useStore((s) => s.users);
  const deleteEvent = useStore((s) => s.deleteEvent);

  const [target, setTarget] = useState<Event | null>(null);  // event ที่จะลบ

  // ไม่โชว์ตัวที่ถูกลบแล้ว (ไปดูที่หน้ารายการที่ถูกลบ)
  const list = events.filter((e) => e.status !== "deleted");

  const adminNames = (e: Event) =>
    e.adminIds.map((id) => users.find((u) => u.id === id)?.name).filter(Boolean).join(", ") || "-";

  const handleConfirmDelete = () => {
    if (target) deleteEvent(target.id);
    setTarget(null);
  };

  return (
    <div>
      <p className="text-sm text-slate-400">ผู้ดูแลระบบ / Event</p>
      <h1 className="mt-1 text-3xl font-bold">Event ทั้งหมด</h1>
      <p className="mt-1 text-slate-500">Super Admin เห็นและลบได้ทุก Event</p>

      <div className="mt-6 rounded-xl bg-white shadow-sm">
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
              return (
                <tr key={e.id} className="border-t border-slate-100">
                  <td className="px-5 py-4 font-semibold">{e.name.th}</td>
                  <td className="px-5 py-4 text-slate-500">{e.code}</td>
                  <td className="px-5 py-4">{e.date || "ยังไม่กำหนด"}</td>
                  <td className="px-5 py-4">
                    <span className={`rounded-full px-3 py-1 text-xs ${s.color}`}>{s.text}</span>
                  </td>
                  <td className="px-5 py-4">{adminNames(e)}</td>
                  <td className="px-5 py-4">
                    <button
                      onClick={() => setTarget(e)}
                      className="flex items-center gap-1 text-xs text-red-500 hover:underline"
                    >
                      <Trash2 size={14} /> ลบ
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modal ยืนยันลบ */}
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
    </div>
  );
}