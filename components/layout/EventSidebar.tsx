// components/layout/EventSidebar.tsx
// Sidebar ของ Event Admin (แยกจาก Sidebar ของ Super เพื่อไม่ให้แก้ไฟล์ชนกัน)
"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, CalendarDays, ClipboardList, Users, BarChart3,
  Settings, LogOut, Ticket, type LucideIcon,
} from "lucide-react";
import { useStore } from "@/lib/store";

type Menu = { href: string; label: string; icon: LucideIcon };

const MAIN_MENU: Menu[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/events", label: "Event ของฉัน", icon: CalendarDays },
  { href: "/admin/registrations", label: "ผู้ลงทะเบียน", icon: Users },
  { href: "/admin/survey", label: "Survey", icon: ClipboardList },
  { href: "/admin/report", label: "Report", icon: BarChart3 },
];

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

export function EventSidebar() {
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
      <div className="mb-6 flex items-center gap-2 px-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">
          <Ticket size={18} />
        </div>
        <span className="font-bold">
          Event<span className="text-blue-600">Survey</span>
        </span>
      </div>

      {/* เมนูหลัก */}
      <nav className="flex flex-col gap-1">
        {MAIN_MENU.map((m) => <MenuItem key={m.href} menu={m} pathname={pathname} />)}
      </nav>

      {/* ล่างสุด */}
      <div className="mt-auto flex flex-col gap-1">
        <MenuItem
          menu={{ href: "/admin/settings", label: "Settings", icon: Settings }}
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
