// components/dashboard/EventTable.tsx
"use client";
import { Suspense } from "react";
import { Event, User } from "@/types";
import { STATUS_LABEL } from "@/lib/utils/status";
import { formatThaiDate, formatThaiDateTime } from "@/lib/utils/date";

// ตาราง "รายการ Event ภาพรวม" (หน้า ②) — หน้าเว็บกรอง Event ที่ถูกลบออกก่อนส่งเข้ามา

// ชื่อผู้ดูแลของ Event (หลายคนคั่นด้วย ,) — export ไว้ให้ไฟล์ CSV ใช้ชื่อชุดเดียวกับตาราง
export function adminNames(event: Event, users: User[]): string {
  return (
    event.adminIds
      .map((id) => users.find((u) => u.id === id)?.name)
      .filter(Boolean)
      .join(", ") || "-"
  );
}

interface EventTableProps {
  events: Event[];
  users: User[];
  registered: Record<string, number>;   // { eventId: จำนวนลงทะเบียน } จาก countByEvent
  responded: Record<string, number>;    // { eventId: จำนวนตอบ Survey }
}

// เวลา "ข้อมูล ณ ..." ตอนเปิดหน้า
// โปรเจกต์เปิด cacheComponents (next.config.ts) → Next prerender หน้าไว้ล่วงหน้า
// ถ้าเรียก new Date() ตรงๆ เวลาจะค้างเป็นตอน prerender (Next ขึ้น error + build ไม่ผ่าน)
// แก้ตามที่ Next แนะนำ: แยกเป็น component แล้วครอบ <Suspense> → ส่วนนี้ render ใหม่ทุกครั้งที่เปิดหน้า
function UpdatedAt() {
  // suppressHydrationWarning: เวลาฝั่ง server กับ browser อาจต่างกันไม่กี่วินาที (ข้ามนาที) ไม่ต้องเตือน
  return <span suppressHydrationWarning>{formatThaiDateTime(new Date())}</span>;
}

export function EventTable({ events, users, registered, responded }: EventTableProps) {
  return (
    <div className="rounded-xl bg-white shadow-sm">
      {/* หัวการ์ด */}
      <div className="flex items-center justify-between p-5">
        <h2 className="font-bold">รายการ Event ภาพรวม</h2>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-500">
          ทั้งหมด {events.length} Event
        </span>
      </div>

      <table className="w-full text-sm">
        <thead className="bg-slate-100 text-left text-slate-500">
          <tr>
            <th className="px-5 py-3">ชื่อ Event</th>
            <th className="px-5 py-3">วันที่จัด</th>
            <th className="px-5 py-3">สถานะ</th>
            <th className="px-5 py-3">ผู้ดูแล</th>
            <th className="px-5 py-3 text-right">ลงทะเบียน</th>
            <th className="px-5 py-3 text-right">ตอบ Survey</th>
          </tr>
        </thead>
        <tbody>
          {events.map((e) => {
            const s = STATUS_LABEL[e.status];
            return (
              <tr key={e.id} className="border-t border-slate-100">
                <td className="px-5 py-4 font-semibold">{e.name.th}</td>
                <td className="px-5 py-4">{formatThaiDate(e.date)}</td>
                <td className="px-5 py-4">
                  <span className={`rounded-full px-3 py-1 text-xs ${s.color}`}>{s.text}</span>
                </td>
                <td className="px-5 py-4">{adminNames(e, users)}</td>
                <td className="px-5 py-4 text-right">{(registered[e.id] ?? 0).toLocaleString("th-TH")} คน</td>
                <td className="px-5 py-4 text-right">{(responded[e.id] ?? 0).toLocaleString("th-TH")} คน</td>
              </tr>
            );
          })}

          {events.length === 0 && (
            <tr>
              <td colSpan={6} className="px-5 py-10 text-center text-slate-400">ยังไม่มี Event</td>
            </tr>
          )}
        </tbody>
      </table>

      {/* ท้ายตาราง — ระหว่างรอเวลาแสดง "-" */}
      <p className="border-t border-slate-100 px-5 py-3 text-xs text-slate-400">
        ข้อมูล ณ{" "}
        <Suspense fallback="-">
          <UpdatedAt />
        </Suspense>{" "}
        (Asia/Bangkok) · ไม่รวมรายการที่ถูกลบ
      </p>
    </div>
  );
}
