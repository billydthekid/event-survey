// components/layout/EventTopbar.tsx
// Topbar ของ Event Admin (แยกจาก Topbar ของ Super ที่เขียนคำว่า "Super Admin" ไว้)
"use client";
import { Search, Bell } from "lucide-react";
import { useStore } from "@/lib/store";

export function EventTopbar() {
  const user = useStore((s) => s.currentUser);

  return (
    <header className="flex items-center justify-between px-8 py-4">
      {/* ค้นหา */}
      <div className="flex w-96 items-center gap-2 rounded-full bg-white px-4 py-2 shadow-sm">
        <Search size={16} className="text-slate-400" />
        <input placeholder="ค้นหา Event, ผู้ลงทะเบียน" className="w-full text-sm outline-none" />
      </div>

      <div className="flex items-center gap-3">
        <button className="rounded-full bg-white px-4 py-2 text-sm shadow-sm">ไทย</button>
        <button className="rounded-full bg-white p-2 shadow-sm">
          <Bell size={18} />
        </button>

        {/* ชื่อ + role */}
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 font-semibold text-blue-600">
            {user?.name.charAt(0)}
          </div>
          <div className="text-sm">
            <p className="font-semibold">{user?.name}</p>
            <p className="text-xs text-slate-400">Event Admin · {user?.username}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
