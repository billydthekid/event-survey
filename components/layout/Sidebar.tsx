// components/layout/Sidebar.tsx
"use client";
import { Suspense, useState } from "react";
import Link from "next/link";
import { useParams, usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, CalendarDays, ClipboardList, BarChart3,
  History, Users, Trash2, Settings, LogOut, Plus,
  type LucideIcon,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { EventSwitcher } from "@/components/layout/EventPicker";
import CreateEventModal from "@/components/events/CreateEventModal";

type Menu = { href: string; label: string; icon: LucideIcon };

const MAIN_MENU: Menu[] = [
  { href: "/super", label: "Dashboard", icon: LayoutDashboard },
  { href: "/super/events", label: "Event", icon: CalendarDays },
  { href: "/super/survey", label: "Survey", icon: ClipboardList },
  { href: "/super/report", label: "Report", icon: BarChart3 },
];

// เมนูหลักตอนเลือก Event เจาะจง — ลิงก์ไปหน้าของ Event นั้น /super/events/[id]/...
function eventMenu(id: string): Menu[] {
  return [
    { href: `/super/events/${id}/dashboard`, label: "Dashboard", icon: LayoutDashboard },
    { href: `/super/events/${id}/event`, label: "Event", icon: CalendarDays },
    { href: `/super/events/${id}/survey`, label: "Survey", icon: ClipboardList },
    { href: `/super/events/${id}/report`, label: "Report", icon: BarChart3 },
  ];
}

const ADMIN_MENU: Menu[] = [
  { href: "/super/action-log", label: "Action log", icon: History },
  { href: "/super/users", label: "จัดการผู้ใช้", icon: Users },
  { href: "/super/deleted", label: "รายการที่ถูกลบ", icon: Trash2 },
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

// ครอบ <Suspense>: โปรเจกต์เปิด cacheComponents → usePathname / useParams ต้องรอ URL
export function Sidebar() {
  return (
    <Suspense fallback={<aside className="h-screen w-60 border-r border-slate-200 bg-[#F4F2F7]" />}>
      <SidebarContent />
    </Suspense>
  );
}

function SidebarContent() {
  const pathname = usePathname();
  const router = useRouter();
  const logout = useStore((s) => s.logout);
  const [showCreate, setShowCreate] = useState(false);

  // อยู่ใต้ /super/events/[id]/... → มี id = กำลังดู Event นั้น
  const { id: eventId } = useParams<{ id?: string }>();
  const mainMenu = eventId ? eventMenu(eventId) : MAIN_MENU;

  const handleLogout = () => {
    logout();
    router.replace("/login");
  };

  return (
    <aside className="flex h-screen w-60 flex-col border-r border-slate-200 bg-[#F4F2F7] p-4">
      {/* โลโก้ */}
      <div className="mb-4 flex items-center gap-2 px-2">
        <img src="/logo.png" alt="" className="h-8 w-8 rounded-lg object-contain" />
        <span className="font-bold">
          Event<span className="text-blue-600">Survey</span>
        </span>
      </div>

      {/* ช่องเลือก Event (กดแล้วเปิด popup) */}
      <EventSwitcher eventId={eventId} />

      {/* ปุ่มสร้าง Event — เปิด modal ตรงนี้ ไม่ลิงก์ไปหน้าอื่น */}
      <button
        onClick={() => setShowCreate(true)}
        className="mb-4 flex items-center justify-center gap-2 rounded-lg bg-blue-600 py-2 text-sm font-semibold text-white hover:bg-blue-700"
      >
        <Plus size={16} /> สร้าง Event
      </button>

      {/* เมนูหลัก */}
      <nav className="flex flex-col gap-1">
        {mainMenu.map((m) => <MenuItem key={m.href} menu={m} pathname={pathname} />)}
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

      {/* Modal สร้าง Event */}
      {showCreate && <CreateEventModal onClose={() => setShowCreate(false)} />}
    </aside>
  );
}
