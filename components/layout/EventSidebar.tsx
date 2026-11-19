// components/layout/EventSidebar.tsx
// Sidebar ของ Event Admin (แยกจาก Sidebar ของ Super เพื่อไม่ให้แก้ไฟล์ชนกัน)
// กติกา: 1 Event Admin ดูแล 1 Event → ไม่มีเมนู "Event ของฉัน" และไม่มีตัวสลับ Event
// โครง: โลโก้ (กดแล้วไป Dashboard ของ Event) → "Event ที่ได้รับมอบหมาย" (การ์ดกดไม่ได้)
//       → ปุ่มตั้งค่า Event → เมนูของ Event → Settings, Logout
// - Event ที่แสดง = Event ที่ได้รับมอบหมายเสมอ (useAssignedEvent) ไม่ได้อ่านจาก URL
//   URL ใช้แค่ตัดสินว่าเมนูไหน active (เปิดหน้าของ Event อื่น → ไม่มีเมนูไหน active)
// - ปุ่ม "ตั้งค่า Event" ไปหน้า Wizard (/edit · รวม Survey ไว้ในขั้นที่ 4) เฉพาะ Event ที่ยังแก้ได้ (Draft / Scheduled)
//   Event ที่ Active / Ended → สีเทา + ป้าย "ล็อกแล้ว" กดไม่ได้ (กติกา: Event Admin แก้ได้เฉพาะก่อน Active)
// - usePathname() ทำงานได้เพราะ admin layout ครอบคอมโพเนนต์นี้ด้วย <Suspense> แล้ว
"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutGrid, BarChart3, SlidersHorizontal, LogOut, Settings, type LucideIcon,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { Event, Lang } from "@/types";
import { useAssignedEvent } from "@/app/admin/assignedEvent";

// ============ พจนานุกรมข้อความ 2 ภาษา ============
// ภาษามาจาก currentUser.lang (อ่านอย่างเดียว) — ยังไม่มีระบบภาษากลาง
const TEXT = {
  th: {
    assignedEvent: "Event ที่ได้รับมอบหมาย",
    dashboard: "Dashboard",
    info: "ตั้งค่า Event",
    report: "Report",
    settings: "Settings",
    logout: "Logout",
    locked: "ล็อกแล้ว",
    noEvents: "ยังไม่ได้รับมอบหมาย Event",
  },
  en: {
    assignedEvent: "Assigned event",
    dashboard: "Dashboard",
    info: "Event settings",
    report: "Report",
    settings: "Settings",
    logout: "Logout",
    locked: "Locked",
    noEvents: "No event assigned yet",
  },
};
type Text = (typeof TEXT)["th"];

// ============ อ่าน id และ "ส่วน" ของหน้าจาก URL ============
// "/admin/events/e-workshop/report/survey" → { id: "e-workshop", section: "report" }
// "/admin/events/e-workshop"               → { id: "e-workshop", section: "" }
// "/admin/settings"                        → { id: null, section: "" }
const EVENT_PATH = /^\/admin\/events\/([^/]+)(?:\/([^/]+))?/;

function parseEventPath(pathname: string): { id: string | null; section: string } {
  const m = pathname.match(EVENT_PATH);
  return m ? { id: m[1], section: m[2] ?? "" } : { id: null, section: "" };
}

// ============ เมนู ============
type Menu = {
  key: string;
  label: string;
  icon: LucideIcon;
  href: string | null; // null = ยังไม่มี Event ที่ได้รับมอบหมาย หรือ Event ล็อกแล้ว → กดไม่ได้
  active: boolean;
  locked?: boolean;    // แสดงป้าย "ล็อกแล้ว"
};

// เมนูที่ไปหน้า Wizard (แก้ข้อมูล Event) — เปิดได้เฉพาะ Event ที่ยังแก้ได้
const WIZARD_KEYS = new Set(["edit"]);
// สถานะที่ Event Admin ยังแก้ได้ (ก่อน Active) — ตัดสินจากสถานะใน store หลักอย่างเดียว
// (Wizard ล็อกตามวันเวลาเริ่มงานอีกชั้นหนึ่ง เช่น Scheduled ที่วันผ่านไปแล้ว → เข้าได้แต่ Wizard ล็อกเอง)
const EDITABLE: Event["status"][] = ["draft", "scheduled"];

export function EventSidebar() {
  const pathname = usePathname(); // เช่น "/admin/events/e-workshop/report/survey"
  const router = useRouter();
  const logout = useStore((s) => s.logout);
  const user = useStore((s) => s.currentUser);
  const assigned = useAssignedEvent();

  // ภาษา: ก่อน store โหลดเสร็จ user = null → "th" ทั้งฝั่ง server และ client (ไม่เกิด hydration mismatch)
  const lang: Lang = user?.lang ?? "th";
  const t = TEXT[lang];

  // Event ที่ได้รับมอบหมาย (null = ยังโหลดไม่เสร็จ หรือไม่มี)
  const selected: Event | null = assigned.status === "ok" ? assigned.event : null;

  const handleLogout = () => {
    logout();
    router.replace("/login");
  };

  // ----- เมนูของ Event ที่ได้รับมอบหมาย -----
  // section = ส่วนหลัง id ใน URL ("" = หน้า Dashboard ของ Event)
  // active ต้องเป็นหน้าของ Event ที่ได้รับมอบหมายด้วย เช่น /report/* ทุกแท็บ → Report
  // (หน้า /qr, /kiosk ไม่มีเมนูในต้นแบบ → ไม่มีเมนูไหน active)
  const { id: urlId, section } = parseEventPath(pathname);
  const base = selected ? `/admin/events/${selected.id}` : null;
  const inSelected = selected !== null && urlId === selected.id;
  // ล็อกเมนู Wizard เมื่อ Event เริ่มแล้ว
  // ตัวอย่าง: e-workshop (active) → ล็อก | e-career (scheduled) → เปิดได้ | ไม่มี Event → ไม่ล็อก (แค่กดไม่ได้)
  const wizardLocked = selected !== null && !EDITABLE.includes(selected.status);
  const eventItem = (key: string, label: string, icon: LucideIcon, path: string, sectionName: string): Menu => {
    const locked = WIZARD_KEYS.has(key) && wizardLocked;
    return {
      key,
      label,
      icon,
      href: base && !locked ? base + path : null,
      active: inSelected && section === sectionName,
      locked,
    };
  };
  // "ตั้งค่า Event" (Wizard /edit) เป็นปุ่มสีน้ำเงินใต้การ์ด Event
  const settingsItem = eventItem("edit", t.info, Settings, "/edit", "edit");
  const eventMenu: Menu[] = [
    eventItem("dashboard", t.dashboard, LayoutGrid, "", ""),
    eventItem("report", t.report, BarChart3, "/report", "report"),
  ];

  return (
    // sticky top-0: หน้ายาวแล้วเลื่อน → Sidebar ติดจอไว้ (ตัวที่เลื่อนยังเป็นทั้งหน้าเหมือนเดิม)
    <aside className="sticky top-0 flex h-screen w-60 flex-col border-r border-slate-200 bg-[#F4F2F7] p-4">
      {/* ===== โลโก้ (กดแล้วไป Dashboard ของ Event · ไม่มี Event → /admin ที่แสดงการ์ด "ยังไม่ได้รับมอบหมาย") ===== */}
      <Link href={base ?? "/admin"} aria-label={t.dashboard} className="mb-6 flex items-center gap-2 px-2">
        <img src="/logo.png" alt="" className="h-8 w-8 rounded-lg object-contain" />
        <span className="font-bold">
          Event<span className="text-blue-600">Survey</span>
        </span>
      </Link>

      {/* ===== ส่วนกลาง: เลื่อนได้เองเมื่อเมนูยาวเกินจอ (โลโก้กับ Settings/Logout อยู่กับที่) =====
          flex-1 = กินที่ที่เหลือ → ส่วนล่างติดขอบล่างเสมอ
          min-h-0 = ยอมให้หดเตี้ยกว่าเนื้อหา (ไม่ใส่ overflow จะไม่ทำงานใน flex) */}
      <div className="min-h-0 flex-1 overflow-y-auto">
      {/* ===== Event ที่ได้รับมอบหมาย (การ์ดกดไม่ได้) ===== */}
      <p className="mb-2 px-2 text-xs font-semibold text-slate-600">{t.assignedEvent}</p>
      <AssignedEventCard event={selected} loading={assigned.status === "loading"} lang={lang} t={t} />

      {/* ===== ปุ่มตั้งค่า Event (เปิด Wizard) ===== */}
      <SettingsButton menu={settingsItem} t={t} />

      {/* ===== เมนูของ Event ===== */}
      <nav className="mt-3 flex flex-col gap-1">
        {eventMenu.map((m) => <MenuItem key={m.key} menu={m} t={t} />)}
      </nav>
      </div>

      {/* ===== ล่างสุด ===== */}
      <div className="mt-auto flex flex-col gap-1 border-t border-slate-200 pt-3">
        <MenuItem
          menu={{
            key: "settings",
            label: t.settings,
            icon: SlidersHorizontal,
            href: "/admin/settings",
            active: pathname.startsWith("/admin/settings"),
          }}
          t={t}
        />
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-red-500 hover:bg-red-50"
        >
          <LogOut size={18} /> {t.logout}
        </button>
      </div>
    </aside>
  );
}

// ============ เมนู 1 รายการ ============
// href = null → แสดงเป็นข้อความสีเทา กดไม่ได้ (ไม่ใช่ลิงก์) + ป้าย "ล็อกแล้ว" ถ้า Event เริ่มแล้ว
function MenuItem({ menu, t }: { menu: Menu; t: Text }) {
  const Icon = menu.icon;
  const base = "flex items-center gap-3 rounded-lg px-3 py-2 text-sm";

  if (!menu.href) {
    return (
      <span aria-disabled="true" className={`${base} cursor-not-allowed text-slate-400`}>
        <Icon size={18} />
        {menu.label}
        {menu.locked && (
          <span className="ml-auto rounded-full bg-slate-200 px-2 py-0.5 text-[10px] text-slate-500">{t.locked}</span>
        )}
      </span>
    );
  }

  return (
    <Link
      href={menu.href}
      aria-current={menu.active ? "page" : undefined}
      className={`${base} ${
        menu.active ? "bg-white font-semibold text-blue-600 shadow-sm" : "text-slate-600 hover:bg-slate-200/80 hover:text-slate-900"
      }`}
    >
      <Icon size={18} />
      {menu.label}
    </Link>
  );
}

// ============ ปุ่ม "ตั้งค่า Event" (หน้าตาแบบปุ่ม "+ สร้าง Event" ของ Super) ============
// href = null → ยังไม่มี Event หรือ Event ล็อกแล้ว → สีเทา กดไม่ได้ (+ ป้าย "ล็อกแล้ว")
function SettingsButton({ menu, t }: { menu: Menu; t: Text }) {
  const Icon = menu.icon;
  const base = "mt-3 flex w-full items-center justify-center gap-2 rounded-lg py-2 text-sm font-semibold";

  if (!menu.href) {
    return (
      <span aria-disabled="true" className={`${base} cursor-not-allowed bg-slate-200 text-slate-400`}>
        <Icon size={16} /> {menu.label}
        {menu.locked && (
          <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-normal text-slate-500">{t.locked}</span>
        )}
      </span>
    );
  }

  return (
    <Link
      href={menu.href}
      aria-current={menu.active ? "page" : undefined}
      className={`${base} bg-blue-600 text-white hover:bg-blue-700 ${menu.active ? "ring-2 ring-blue-300 ring-offset-1" : ""}`}
    >
      <Icon size={16} /> {menu.label}
    </Link>
  );
}

// ============ ป้ายวัน เช่น "23" + "ต.ค." ============
// "2026-10-23" → แยกตัวเลขเอง (ไม่ใช้ new Date("2026-10-23") ที่ถือเป็นเวลา UTC)
function DateBadge({ date, lang }: { date: string; lang: Lang }) {
  let day = "—";
  let month = "";
  if (date) {
    const [y, m, d] = date.split("-").map(Number);
    day = String(d);
    month = new Date(y, m - 1, d).toLocaleDateString(lang === "th" ? "th-TH" : "en-GB", { month: "short" });
  }
  return (
    <div className="flex h-9 w-9 shrink-0 flex-col items-center justify-center rounded-lg bg-blue-50 leading-none text-blue-600">
      <span className="text-sm font-bold">{day}</span>
      {month && <span className="mt-0.5 text-[9px]">{month}</span>}
    </div>
  );
}

// ============ การ์ด "Event ที่ได้รับมอบหมาย" (แสดงอย่างเดียว ไม่มีลูกศร ไม่มีรายการให้เลือก) ============
// event = null + loading → กล่องว่างขนาดเท่าเดิม | event = null → ข้อความ "ยังไม่ได้รับมอบหมาย Event"
function AssignedEventCard({
  event,
  loading,
  lang,
  t,
}: {
  event: Event | null;
  loading: boolean;
  lang: Lang;
  t: Text;
}) {
  // min-h: กล่องสูงเท่ากันทุกสถานะ (มี Event / ไม่มี / ยังโหลด) เมนูด้านล่างจึงไม่ขยับ
  const box = "flex min-h-[52px] w-full items-center gap-2 rounded-xl bg-white p-2 text-left shadow-sm";

  if (loading) return <div className={box} />;
  if (!event) return <div className={`${box} px-3 text-xs text-slate-400`}>{t.noEvents}</div>;

  // ชื่อ Event: EN และมีชื่ออังกฤษ → ใช้ชื่ออังกฤษ ไม่งั้นใช้ชื่อไทย
  const name = lang === "en" && event.name.en ? event.name.en : event.name.th;
  return (
    <div className={box}>
      <DateBadge date={event.date} lang={lang} />
      <span className="line-clamp-2 flex-1 text-xs font-semibold">{name}</span>
    </div>
  );
}
