// app/super/deleted/page.tsx
// หน้า "รายการที่ถูกลบ" (Admin) — Event ที่ถูก soft delete เก็บไว้ 30 วัน กู้คืนได้ก่อนครบกำหนด
// เปิดหน้าปุ๊บเรียก purgeExpired() เคลียร์ตัวที่ครบ 30 วันทิ้งถาวร (แทน cron)
"use client";
import { useEffect, useMemo, useState } from "react";
import { RotateCcw, Trash2, X } from "lucide-react";
import { useStore } from "@/lib/store";
import { daysLeft, KEEP_DAYS, STATUS_LABEL } from "@/lib/utils/status";
import { countByEvent } from "@/lib/utils/stats";
import { formatThaiDate } from "@/lib/utils/date";
import { Event } from "@/types";

export default function DeletedPage() {
  const events = useStore((s) => s.events);
  const registrations = useStore((s) => s.registrations);
  const restoreEvent = useStore((s) => s.restoreEvent);
  const purgeExpired = useStore((s) => s.purgeExpired);

  const [target, setTarget] = useState<Event | null>(null); // event ที่กดกู้คืน (ยืนยันก่อน)

  // เปิดหน้า → ลบถาวรตัวที่ครบ 30 วันทิ้ง (ไม่มี backend/cron เลยเช็กตอนเข้าหน้า)
  useEffect(() => {
    purgeExpired();
  }, [purgeExpired]);

  // เฉพาะตัวที่ถูกลบ เรียงจากลบล่าสุดขึ้นก่อน
  const deleted = useMemo(
    () =>
      events
        .filter((e) => e.status === "deleted")
        .sort((a, b) => (b.deletedAt ?? "").localeCompare(a.deletedAt ?? "")),
    [events]
  );

  const registered = countByEvent(registrations);

  const handleConfirmRestore = () => {
    if (target) restoreEvent(target.id);
    setTarget(null);
  };

  return (
    <div>
      {/* ===== หัวข้อ ===== */}
      <div>
        <p className="text-sm text-slate-400">ผู้ดูแลระบบ / รายการที่ถูกลบ</p>
        <h1 className="mt-1 text-3xl font-bold">รายการที่ถูกลบ</h1>
        <p className="mt-1 text-slate-500">
          Event ที่ถูกลบจะเก็บไว้ {KEEP_DAYS} วันก่อนลบถาวร · กู้คืนได้ก่อนครบกำหนด
        </p>
      </div>

      {/* ===== ตาราง ===== */}
      <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="flex items-center justify-between px-5 py-4">
          <p className="font-semibold">
            ถูกลบทั้งหมด{" "}
            <span className="text-slate-400">{deleted.length} รายการ</span>
          </p>
        </div>

        {deleted.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
            <div className="rounded-full bg-slate-100 p-3 text-slate-400">
              <Trash2 size={24} />
            </div>
            <p className="font-medium text-slate-600">ไม่มีรายการที่ถูกลบ</p>
            <p className="text-sm text-slate-400">Event ที่ลบจากหน้า Event จะมาแสดงที่นี่</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-y border-slate-100 bg-slate-50 text-left text-xs text-slate-500">
              <tr>
                <th className="px-5 py-3 font-medium">Event</th>
                <th className="px-5 py-3 font-medium">สถานะก่อนลบ</th>
                <th className="px-5 py-3 font-medium">วันที่ลบ</th>
                <th className="px-5 py-3 text-right font-medium">ลงทะเบียน</th>
                <th className="px-5 py-3 font-medium">เหลือเวลา</th>
                <th className="px-5 py-3 text-right font-medium">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {deleted.map((e) => {
                const left = daysLeft(e.purgeAt);
                const prev = e.prevStatus ?? "draft";
                return (
                  <tr key={e.id} className="hover:bg-slate-50/60">
                    <td className="px-5 py-3">
                      <p className="font-semibold">{e.name.th}</p>
                      <p className="text-xs text-slate-400">{e.code}</p>
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs ${STATUS_LABEL[prev].color}`}
                      >
                        {STATUS_LABEL[prev].text}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-slate-600">
                      {e.deletedAt ? formatThaiDate(e.deletedAt) : "-"}
                    </td>
                    <td className="px-5 py-3 text-right text-slate-600">
                      {(registered[e.id] ?? 0).toLocaleString("th-TH")} คน
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs ${
                          left <= 3
                            ? "bg-red-50 text-red-600"
                            : left <= 7
                              ? "bg-amber-50 text-amber-600"
                              : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        เหลือ {left} วัน
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button
                        onClick={() => setTarget(e)}
                        className="inline-flex items-center gap-1 rounded-lg border border-blue-200 px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50"
                      >
                        <RotateCcw size={14} /> กู้คืน
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* ===== Modal ยืนยันกู้คืน ===== */}
      {target && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40">
          <div className="w-[460px] rounded-2xl bg-white p-6">
            <div className="flex items-start justify-between">
              <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
                <RotateCcw size={22} />
              </div>
              <button onClick={() => setTarget(null)}>
                <X size={20} />
              </button>
            </div>
            <h3 className="mt-4 text-xl font-bold">กู้คืน Event นี้?</h3>
            <p className="mt-1 text-sm text-slate-500">
              Event จะกลับไปที่สถานะ &quot;{STATUS_LABEL[target.prevStatus ?? "draft"].text}&quot;
              และแสดงในรายการ Event ตามเดิม
            </p>
            <div className="mt-4 rounded-lg bg-slate-100 p-4 text-sm">
              <p className="font-semibold">{target.name.th}</p>
              <p className="text-slate-500">
                {target.code} · เหลือเวลา {daysLeft(target.purgeAt)} วันก่อนลบถาวร
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
                onClick={handleConfirmRestore}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
              >
                ยืนยันกู้คืน
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
