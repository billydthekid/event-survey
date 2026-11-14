// components/events/EventFilterBar.tsx
"use client";
import { Search } from "lucide-react";
import { SORT_OPTIONS, SortKey } from "@/lib/utils/eventList";

// แถบค้นหา + ปุ่มกรอง + เรียง ของหน้ารวมทุก Event (Event / Survey / Report ใช้ตัวเดียวกัน)
// เก็บค่าไว้ที่หน้า (state อยู่ในหน้า) — component นี้แค่แสดงและแจ้งกลับผ่าน onXxx

export interface FilterChip {
  key: string;
  label: string;
  count?: number;   // ตัวเลขท้ายปุ่ม (ไม่ใส่ = ไม่แสดง)
}

interface EventFilterBarProps {
  search: string;
  onSearch: (value: string) => void;
  chips: FilterChip[];
  chip: string;                 // key ของปุ่มที่เลือกอยู่
  onChip: (key: string) => void;
  sort: SortKey;
  onSort: (key: SortKey) => void;
}

export function EventFilterBar({ search, onSearch, chips, chip, onChip, sort, onSort }: EventFilterBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 px-5 pb-4">
      {/* ช่องค้นหา */}
      <label className="flex h-10 min-w-[240px] max-w-[360px] flex-1 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm">
        <Search size={16} className="text-slate-400" />
        <input
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="ค้นหาชื่อ Event หรือรหัส"
          className="w-full outline-none"
        />
      </label>

      {/* ปุ่มกรอง */}
      {chips.map((c) => (
        <button
          key={c.key}
          onClick={() => onChip(c.key)}
          className={`rounded-full px-3 py-1 text-xs ${
            chip === c.key ? "bg-blue-50 font-semibold text-blue-600" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
          }`}
        >
          {c.label}
          {c.count !== undefined && <span className="ml-1">{c.count}</span>}
        </button>
      ))}

      {/* เรียง (ชิดขวา) */}
      <select
        value={sort}
        onChange={(e) => onSort(e.target.value as SortKey)}
        className="ml-auto h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm"
      >
        {SORT_OPTIONS.map((o) => (
          <option key={o.key} value={o.key}>เรียง: {o.label}</option>
        ))}
      </select>
    </div>
  );
}
