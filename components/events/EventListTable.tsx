// components/events/EventListTable.tsx
"use client";
import { ReactNode } from "react";
import { Event } from "@/types";

// การ์ดตารางรายการ Event ของหน้ารวมทุก Event (Event / Survey / Report)
// คอลัมน์แรก "ชื่อ Event + รหัส" มีทุกหน้า · คอลัมน์ที่เหลือแต่ละหน้าส่งมาเองผ่าน columns
// กดแถว → onSelect(eventId) (หน้าเป็นคนตัดสินว่าจะไปหน้าไหน)

export interface EventColumn {
  key: string;
  header: string;
  align?: "right";
  render: (event: Event) => ReactNode;
}

interface EventListTableProps {
  title: string;
  total: number;              // ป้าย "ทั้งหมด N Event" (จำนวนก่อนกรอง)
  toolbar?: ReactNode;        // แถบค้นหา / กรอง (EventFilterBar)
  events: Event[];            // รายการที่กรอง + เรียงแล้ว
  columns: EventColumn[];
  onSelect: (eventId: string) => void;
  highlightId?: string | null; // แถวที่เพิ่งสร้าง (?new=<id>) → พื้นฟ้า + ป้าย "เพิ่งสร้าง"
}

export function EventListTable({ title, total, toolbar, events, columns, onSelect, highlightId }: EventListTableProps) {
  return (
    <div className="rounded-xl bg-white shadow-sm">
      {/* หัวการ์ด */}
      <div className="flex items-center justify-between p-5">
        <h2 className="font-bold">{title}</h2>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-500">ทั้งหมด {total} Event</span>
      </div>

      {toolbar}

      <table className="w-full text-sm">
        <thead className="bg-slate-100 text-left text-slate-500">
          <tr>
            <th className="px-5 py-3">ชื่อ Event</th>
            {columns.map((c) => (
              <th key={c.key} className={`px-5 py-3 ${c.align === "right" ? "text-right" : ""}`}>{c.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {events.map((e) => (
            <tr
              key={e.id}
              onClick={() => onSelect(e.id)}
              className={`cursor-pointer border-t border-slate-100 hover:bg-slate-50 ${e.id === highlightId ? "bg-blue-50/50" : ""}`}
            >
              <td className="px-5 py-4">
                <p className="font-semibold">
                  {e.name.th}
                  {e.id === highlightId && (
                    <span className="ml-2 rounded bg-blue-100 px-1.5 py-0.5 text-xs text-blue-700">เพิ่งสร้าง</span>
                  )}
                </p>
                <p className="text-xs text-slate-400">{e.code}</p>
              </td>
              {columns.map((c) => (
                <td key={c.key} className={`px-5 py-4 ${c.align === "right" ? "text-right" : ""}`}>{c.render(e)}</td>
              ))}
            </tr>
          ))}

          {events.length === 0 && (
            <tr>
              <td colSpan={columns.length + 1} className="px-5 py-10 text-center text-slate-400">
                ไม่พบ Event ที่ตรงกับการค้นหา
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <p className="border-t border-slate-100 px-5 py-3 text-xs text-slate-400">
        กดแถวเพื่อเปิดหน้าของ Event นั้น · ไม่รวมรายการที่ถูกลบ
      </p>
    </div>
  );
}

// ============ ชิ้นเล็กที่หลายหน้าใช้ ============

// % ตอบ + แถบ (หน้า Survey / Report) · total = 0 → "—"
export function RateCell({ done, total }: { done: number; total: number }) {
  if (total === 0) return <span className="text-slate-400">—</span>;
  const rate = Math.round((done / total) * 100);
  return (
    <div className="w-32">
      <p>{rate}%</p>
      <div className="mt-1 h-1.5 rounded-full bg-slate-100">
        <div className="h-1.5 rounded-full bg-blue-600" style={{ width: `${rate}%` }} />
      </div>
    </div>
  );
}

// ป้ายสีเล็ก (สถานะ Event / รายงาน)
export function Badge({ text, color }: { text: string; color: string }) {
  return <span className={`whitespace-nowrap rounded-full px-3 py-1 text-xs ${color}`}>{text}</span>;
}
