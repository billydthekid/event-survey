// components/layout/Sidebar.tsx
"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, CalendarDays, ClipboardList, BarChart3,
  History, Users, Trash2, Settings, LogOut, Plus, Ticket,
  type LucideIcon,
} from "lucide-react";
import { useStore } from "@/lib/store";

type Menu = { href: string; label: string; icon: LucideIcon };

const MAIN_MENU: Menu[] = [
  { href: "/super", label: "Dashboard", icon: LayoutDashboard },
  { href: "/super/events", label: "Event", icon: CalendarDays },
  { href: "/super/survey", label: "Survey", icon: ClipboardList },
  { href: "/super/report", label: "Report", icon: BarChart3 },
];

const ADMIN_MENU: Menu[] = [
  { href: "/super/action-log", label: "Action log", icon: History },
  { href: "/super/users", label: "จัดการผู้ใช้", icon: Users },
  { href: "/super/deleted", label: "รายการที่ถูกลบ", icon: Trash2 },
];

//  อยู่นอก Sidebar แล้ว — รับ pathname เป็น prop
function MenuItem({ menu, pathname }: { menu: Menu; pathname: string }) {
  const Icon = menu.icon;
  const active = pathname === menu.href;
  return (
    <Link
      href={menu.href}
      className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm ${
        active ? "bg-white font-semibold text-blue-600 shadow-sm" : "text-slate-600 hover:bg-white/60"
      }`}
    >
      <Icon size={18} />
      {menu.label}
    </Link>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const logout = useStore((s) => s.logout);

  const handleLogout = () => {
    logout();
    router.replace("/login");
  };

  return (
    <aside className="flex h-screen w-60 flex-col border-r border-slate-200 bg-[#F4F2F7] p-4">
      {/* โลโก้ */}
      <div className="mb-4 flex items-center gap-2 px-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">
          <Ticket size={18} />
        </div>
        <span className="font-bold">
          Event<span className="text-blue-600">Survey</span>
        </span>
      </div>

      {/* ปุ่มสร้าง Event */}
      <Link
        href="/super/users"
        className="mb-4 flex items-center justify-center gap-2 rounded-lg bg-blue-600 py-2 text-sm font-semibold text-white hover:bg-blue-700"
      >
        <Plus size={16} /> สร้าง Event
      </Link>

      {/* เมนูหลัก */}
      <nav className="flex flex-col gap-1">
        {MAIN_MENU.map((m) => <MenuItem key={m.href} menu={m} pathname={pathname} />)}
      </nav>

      {/* เมนู Admin */}
      <p className="mt-6 mb-2 px-3 text-xs text-slate-400">Admin</p>
      <nav className="flex flex-col gap-1">
        {ADMIN_MENU.map((m) => <MenuItem key={m.href} menu={m} pathname={pathname} />)}
      </nav>

      {/* ล่างสุด */}
      <div className="mt-auto flex flex-col gap-1">
        <MenuItem
          menu={{ href: "/super/settings", label: "Settings", icon: Settings }}
          pathname={pathname}
        />
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-red-500 hover:bg-white/60"
        >
          <LogOut size={18} /> Logout
        </button>
      </div>
    </aside>
  );
}