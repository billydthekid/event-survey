// components/layout/EventSidebar.tsx
// Sidebar ของ Event Admin (แยกจาก Sidebar ของ Super เพื่อไม่ให้แก้ไฟล์ชนกัน)
// โครงตามต้นแบบ (dashboard.png / myevent.png):
//   โลโก้ (กดแล้วไป Event ของฉัน), Event ของฉัน (เมนูหลักเดียว) →"Event ที่เลือก" + ตัวสลับ → เมนูของ Event → Settings, Logout
// - Event ที่เลือก: id ใน URL ชนะเสมอ / หน้าที่ไม่มี id ใช้ Event ล่าสุดที่จำไว้ (localStorage) / ไม่มี → เลือกตามกติกา
// - เมนูที่ยังไม่มีหน้า: สีเทา + ป้าย "เร็วๆ นี้" กดไม่ได้ (กัน 404)
// - usePathname() ทำงานได้เพราะ admin layout ครอบคอมโพเนนต์นี้ด้วย <Suspense> แล้ว
"use client";
import { useEffect, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  List, LayoutGrid, CalendarDays, ClipboardList, BarChart3, Smartphone,
  SlidersHorizontal, LogOut, Ticket, ChevronsUpDown, Check, type LucideIcon,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { Event, Lang } from "@/types";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// ============ พจนานุกรมข้อความ 2 ภาษา ============
// ภาษามาจาก currentUser.lang (อ่านอย่างเดียว) — ยังไม่มีระบบภาษากลาง
const TEXT = {
  th: {
    myEvents: "Event ของฉัน",
    selectedEvent: "Event ที่เลือก",
    dashboard: "Dashboard",
    info: "ข้อมูล Event",
    survey: "Survey",
    report: "Report",
    kiosk: "หน้า Kiosk",
    settings: "Settings",
    logout: "Logout",
    soon: "เร็วๆ นี้",
    notFound: "ไม่พบ Event",
    noEvents: "ยังไม่มี Event ที่ได้รับมอบหมาย",
    switchEvent: "เปลี่ยน Event",
  },
  en: {
    myEvents: "My Events",
    selectedEvent: "Selected event",
    dashboard: "Dashboard",
    info: "Event info",
    survey: "Survey",
    report: "Report",
    kiosk: "Kiosk",
    settings: "Settings",
    logout: "Logout",
    soon: "Soon",
    notFound: "Event not found",
    noEvents: "No assigned events yet",
    switchEvent: "Switch event",
  },
};
type Text = (typeof TEXT)["th"];

// ============ อ่าน id และ "ส่วน" ของหน้าจาก URL ============
// "/admin/events/e-workshop/report/survey" → { id: "e-workshop", section: "report" }
// "/admin/events/e-workshop"               → { id: "e-workshop", section: "" }
// "/admin/events"                          → { id: null, section: "" }
const EVENT_PATH = /^\/admin\/events\/([^/]+)(?:\/([^/]+))?/;

function parseEventPath(pathname: string): { id: string | null; section: string } {
  const m = pathname.match(EVENT_PATH);
  return m ? { id: m[1], section: m[2] ?? "" } : { id: null, section: "" };
}

// ============ จำ "Event ล่าสุด" ใน localStorage (แยกตาม user) ============
// ไม่แก้ lib/store.ts → เก็บเองใน localStorage และครอบ try/catch ทุกครั้ง
// (โหมดส่วนตัว / ปิดการเก็บข้อมูล อาจ throw ได้ → ถือว่า "ไม่มีค่าที่จำไว้")
const storageKey = (userId: string) => `esp.eventAdmin.lastEvent.${userId}`;

// ผู้ที่รอฟังการเปลี่ยนค่า (ให้ useSyncExternalStore วาดใหม่เมื่อเราเขียนค่าเอง)
const listeners = new Set<() => void>();
function subscribe(onChange: () => void) {
  listeners.add(onChange);
  window.addEventListener("storage", onChange); // ค่าเปลี่ยนจากแท็บอื่น
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onChange);
  };
}

function readLastEvent(userId: string): string | null {
  try {
    return localStorage.getItem(storageKey(userId));
  } catch {
    return null;
  }
}

function writeLastEvent(userId: string, eventId: string) {
  try {
    if (localStorage.getItem(storageKey(userId)) === eventId) return; // ค่าเดิม ไม่ต้องเขียนซ้ำ
    localStorage.setItem(storageKey(userId), eventId);
  } catch {
    return; // เขียนไม่ได้ก็ไม่เป็นไร แค่จำไม่ได้
  }
  listeners.forEach((fn) => fn());
}

// ============ วิธี B: เลือก Event เริ่มต้นตามกติกา ============
// Active → Scheduled ที่วันใกล้สุด → Draft → Ended ที่ล่าสุด
// ตัวอย่าง: [ended 18 ต.ค., scheduled 25 ต.ค., active 23 ต.ค.] → เลือก active 23 ต.ค.
function pickDefault(events: Event[]): Event | null {
  const byDate = (a: Event, b: Event) => (a.date || "9999").localeCompare(b.date || "9999"); // ไม่มีวันที่ → ไว้ท้าย
  const of = (status: Event["status"]) => events.filter((e) => e.status === status).sort(byDate);
  return (
    of("active")[0] ??
    of("scheduled")[0] ??
    of("draft")[0] ??
    of("ended").at(-1) ?? // ended: เอาวันที่ล่าสุด (ท้ายสุดหลังเรียงจากเก่าไปใหม่)
    null
  );
}

// ============ เมนู ============
type Menu = {
  key: string;
  label: string;
  icon: LucideIcon;
  href: string | null; // null = ยังไม่มีหน้า หรือยังไม่มี Event ที่เลือก → กดไม่ได้
  active: boolean;
  soon?: boolean;      // แสดงป้าย "เร็วๆ นี้"
};

// เมนูของ Event ที่ยังไม่มีหน้า (เมื่อทำหน้าเสร็จ ลบ key ออกจากรายการนี้)
const NOT_BUILT = new Set(["edit", "survey"]);

export function EventSidebar() {
  const pathname = usePathname(); // เช่น "/admin/events/e-workshop/report/survey"
  const router = useRouter();
  const logout = useStore((s) => s.logout);
  const user = useStore((s) => s.currentUser);
  const hydrated = useStore((s) => s.hydrated);
  const events = useStore((s) => s.events);

  // ภาษา: ก่อน store โหลดเสร็จ user = null → "th" ทั้งฝั่ง server และ client (ไม่เกิด hydration mismatch)
  const lang: Lang = user?.lang ?? "th";
  const t = TEXT[lang];

  // Event ที่ฉันได้รับมอบหมาย และยังไม่ถูกลบ (ก่อนโหลดเสร็จ = ว่าง)
  const myEvents =
    hydrated && user ? events.filter((e) => e.adminIds.includes(user.id) && e.status !== "deleted") : [];

  const { id: urlId, section } = parseEventPath(pathname);
  const urlEvent = urlId ? myEvents.find((e) => e.id === urlId) ?? null : null;

  // ค่าที่จำไว้: อ่านเฉพาะเมื่อ store โหลดเสร็จและรู้ user แล้ว
  // getServerSnapshot = null → ตอน hydrate ได้ค่าเดียวกับ server เสมอ แล้วค่อยอ่านค่าจริง
  const userId = hydrated && user ? user.id : null;
  const lastEventId = useSyncExternalStore(
    subscribe,
    () => (userId ? readLastEvent(userId) : null),
    () => null
  );

  // เมื่อ URL มี id ของ Event ที่ได้รับมอบหมาย → บันทึกเป็น "Event ล่าสุด" ทุกครั้ง
  useEffect(() => {
    if (userId && urlEvent) writeLastEvent(userId, urlEvent.id);
  }, [userId, urlEvent]);

  // ----- Event ที่เลือก -----
  // 1) URL มี id → ใช้ id นั้นเสมอ (ไม่อยู่ในรายการของฉัน → null = "ไม่พบ Event")
  // 2) ไม่มี id → Event ที่จำไว้ (ถ้ายังอยู่ในรายการ) → ไม่งั้นเลือกตามกติกา (วิธี B)
  const selected: Event | null = urlId
    ? urlEvent
    : myEvents.find((e) => e.id === lastEventId) ?? pickDefault(myEvents);
  const notFound = hydrated && urlId !== null && urlEvent === null;

  // ----- เลือก Event อื่นจากตัวสลับ -----
  function handleSelect(ev: Event) {
    if (urlId) {
      // อยู่หน้าของ Event → เปลี่ยนแค่ id อยู่ส่วนเดิม
      // "/admin/events/A/report/survey" → "/admin/events/B/report/survey"
      const prefix = `/admin/events/${urlId}`;
      router.push(`/admin/events/${ev.id}${pathname.slice(prefix.length)}`);
    } else if (userId) {
      // หน้าที่ไม่มี id (เช่น Event ของฉัน) → อยู่หน้าเดิม แค่จำ Event ที่เลือก
      writeLastEvent(userId, ev.id);
    }
  }

  const handleLogout = () => {
    logout();
    router.replace("/login");
  };

  // ----- เมนูหลัก (เหลือ "Event ของฉัน" อันเดียว — /admin ถูกเปลี่ยนเส้นทางมาที่นี่แล้ว) -----
  const mainMenu: Menu[] = [
    // เฉพาะหน้ารายการพอดี — หน้าย่อยของ Event ไปขึ้นที่เมนูของ Event แทน
    { key: "events", label: t.myEvents, icon: List, href: "/admin/events", active: pathname === "/admin/events" },
  ];

  // ----- เมนูของ Event ที่เลือก -----
  // section = ส่วนหลัง id ใน URL ("" = หน้า Dashboard ของ Event)
  // active ต้องเป็น Event เดียวกับใน URL ด้วย เช่น /report/* ทุกแท็บ → Report
  // (หน้า /qr ไม่มีเมนูในต้นแบบ → ไม่มีเมนูไหน active)
  const base = selected ? `/admin/events/${selected.id}` : null;
  const inSelected = urlEvent !== null; // อยู่ในหน้าของ Event ที่เลือก
  const eventItem = (key: string, label: string, icon: LucideIcon, path: string, sectionName: string): Menu => ({
    key,
    label,
    icon,
    href: base && !NOT_BUILT.has(key) ? base + path : null,
    active: inSelected && section === sectionName,
    soon: NOT_BUILT.has(key),
  });
  const eventMenu: Menu[] = [
    eventItem("dashboard", t.dashboard, LayoutGrid, "", ""),
    eventItem("edit", t.info, CalendarDays, "/edit", "edit"),
    eventItem("survey", t.survey, ClipboardList, "/survey", "survey"),
    eventItem("report", t.report, BarChart3, "/report", "report"),
    eventItem("kiosk", t.kiosk, Smartphone, "/kiosk", "kiosk"),
  ];

  return (
    <aside className="flex h-screen w-60 flex-col border-r border-slate-200 bg-[#F4F2F7] p-4">
      {/* ===== โลโก้ (กดแล้วกลับหน้า Event ของฉัน) ===== */}
      {/* ใช้ class เดิมทุกตัว → หน้าตาไม่เปลี่ยน แค่กดได้ */}
      <Link href="/admin/events" aria-label={t.myEvents} className="mb-6 flex items-center gap-2 px-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">
          <Ticket size={18} />
        </div>
        <span className="font-bold">
          Event<span className="text-blue-600">Survey</span>
        </span>
      </Link>

      {/* ===== เมนูหลัก ===== */}
      <nav className="flex flex-col gap-1">
        {mainMenu.map((m) => <MenuItem key={m.key} menu={m} t={t} />)}
      </nav>

      {/* ===== Event ที่เลือก + ตัวสลับ ===== */}
      <p className="mt-6 mb-2 px-2 text-xs font-semibold text-slate-600">{t.selectedEvent}</p>
      <EventSwitcher
        events={myEvents}
        selected={selected}
        notFound={notFound}
        hydrated={hydrated}
        lang={lang}
        t={t}
        onSelect={handleSelect}
      />

      {/* ===== เมนูของ Event ===== */}
      <nav className="mt-3 flex flex-col gap-1">
        {eventMenu.map((m) => <MenuItem key={m.key} menu={m} t={t} />)}
      </nav>

      {/* ===== ล่างสุด ===== */}
      <div className="mt-auto flex flex-col gap-1 border-t border-slate-200 pt-3">
        <MenuItem
          menu={{ key: "settings", label: t.settings, icon: SlidersHorizontal, href: null, active: false, soon: true }}
          t={t}
        />
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-red-500 hover:bg-white/60"
        >
          <LogOut size={18} /> {t.logout}
        </button>
      </div>
    </aside>
  );
}

// ============ เมนู 1 รายการ ============
// href = null → แสดงเป็นข้อความสีเทา กดไม่ได้ (ไม่ใช่ลิงก์ จึงไม่มีทางไป 404)
function MenuItem({ menu, t }: { menu: Menu; t: Text }) {
  const Icon = menu.icon;
  const base = "flex items-center gap-3 rounded-lg px-3 py-2 text-sm";

  if (!menu.href) {
    return (
      <span aria-disabled="true" className={`${base} cursor-not-allowed text-slate-400`}>
        <Icon size={18} />
        {menu.label}
        {menu.soon && (
          <span className="ml-auto rounded-full bg-slate-200 px-2 py-0.5 text-[10px] text-slate-500">{t.soon}</span>
        )}
      </span>
    );
  }

  return (
    <Link
      href={menu.href}
      aria-current={menu.active ? "page" : undefined}
      className={`${base} ${
        menu.active ? "bg-white font-semibold text-blue-600 shadow-sm" : "text-slate-600 hover:bg-white/60"
      }`}
    >
      <Icon size={18} />
      {menu.label}
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

// ============ กล่อง "Event ที่เลือก" + รายการให้เลือก ============
// (หน้าตารายการที่เปิดออกมาไม่มีในต้นฉบับ — ออกแบบเพิ่มด้วยสไตล์เดียวกัน)
function EventSwitcher({
  events,
  selected,
  notFound,
  hydrated,
  lang,
  t,
  onSelect,
}: {
  events: Event[];
  selected: Event | null;
  notFound: boolean;
  hydrated: boolean;
  lang: Lang;
  t: Text;
  onSelect: (ev: Event) => void;
}) {
  const name = (ev: Event) => (lang === "en" && ev.name.en ? ev.name.en : ev.name.th);
  // min-h: กล่องสูงเท่ากันทุกสถานะ (มี Event / ไม่พบ / ยังโหลด) เมนูด้านล่างจึงไม่ขยับ
  const box = "flex min-h-[52px] w-full items-center gap-2 rounded-xl bg-white p-2 text-left shadow-sm";

  // ยังโหลดไม่เสร็จ → กล่องว่างขนาดเท่าเดิม (กรอบ admin ซ่อนอยู่แล้วจนโหลดเสร็จ)
  if (!hydrated) return <div className={box} />;

  // ไม่มี Event ที่ได้รับมอบหมายเลย → ไม่มีอะไรให้สลับ
  if (events.length === 0) {
    return <div className={`${box} text-xs text-slate-400`}>{t.noEvents}</div>;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className={`${box} hover:ring-1 hover:ring-slate-200`} aria-label={t.switchEvent}>
        {selected ? (
          <>
            <DateBadge date={selected.date} lang={lang} />
            <span className="line-clamp-2 flex-1 text-xs font-semibold">{name(selected)}</span>
          </>
        ) : (
          // URL มี id ที่ไม่ได้รับมอบหมาย / ถูกลบ
          <span className="flex-1 px-1 text-xs text-slate-400">{notFound ? t.notFound : t.switchEvent}</span>
        )}
        <ChevronsUpDown size={16} className="shrink-0 text-slate-400" />
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-56">
        {events.map((ev) => (
          <DropdownMenuItem key={ev.id} onClick={() => onSelect(ev)} className="gap-2 py-1.5">
            <DateBadge date={ev.date} lang={lang} />
            <span className="line-clamp-2 flex-1 text-xs">{name(ev)}</span>
            {selected?.id === ev.id && <Check className="text-blue-600" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
