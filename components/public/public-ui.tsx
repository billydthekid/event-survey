// components/public/public-ui.tsx
// ชิ้นส่วนที่หน้าผู้เข้าร่วมใช้ร่วมกัน (ลงทะเบียน /r/<code> และแบบประเมิน /s/<code>)
// ดีไซน์ตาม Figma: A5/A2/A4 (ลงทะเบียน), B1/B2 (แบบประเมิน), C1–C4 (สถานะ), E1 (โหลดไม่สำเร็จ), T-A1 (Dark/Bold)
// Mobile first: กว้างสุด 28rem (ตรงกับจอมือถือ) บนจอใหญ่วางกลางจอ
"use client";
import { useEffect, useSyncExternalStore } from "react";
import { format } from "date-fns";
import { th as thLocale } from "date-fns/locale";
import { CalendarDays, MapPin } from "lucide-react";
import type { Lang } from "@/types";
import { useNow } from "@/lib/hooks/useNow";
import { PublicEvent, initials, pick } from "@/lib/public-event";

// ============ ภาษา: จำไว้ในเครื่องผู้ใช้ (ลงทะเบียนเป็น EN → หน้าแบบประเมินก็ EN) ============
const LANG_KEY = "esp.public.lang";
const LANG_EVENT = "esp-public-lang";

function subscribeLang(onChange: () => void) {
  window.addEventListener(LANG_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(LANG_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}
function readLang(): Lang {
  try {
    return localStorage.getItem(LANG_KEY) === "en" ? "en" : "th";
  } catch {
    return "th"; // โหมดส่วนตัว / ปิด storage → ใช้ภาษาไทย
  }
}
export function usePublicLang(): [Lang, (l: Lang) => void] {
  const lang = useSyncExternalStore(subscribeLang, readLang, () => "th" as Lang);
  const setLang = (l: Lang) => {
    try {
      localStorage.setItem(LANG_KEY, l);
    } catch {
      // เก็บไม่ได้ก็ไม่เป็นไร
    }
    window.dispatchEvent(new Event(LANG_EVENT));
  };
  return [lang, setLang];
}

// ============ สีตาม Theme ============
export interface Palette {
  mode: "light" | "dark" | "bold";
  primary: string;
  page: string; // พื้นหลังส่วนเนื้อหา
  text: string;
  muted: string;
  line: string;
  input: string; // พื้นช่องกรอก
  inputText: string;
  head: { bg: string; text: string; muted: string; line: string }; // ส่วนหัว + ข้อมูลงาน
  chip: { bg: string; text: string };
  soft: string; // พื้นตัวเลือกที่ถูกเลือก (โทนอ่อนของสีหลัก)
}

export function palette(e: Pick<PublicEvent, "theme"> | null): Palette {
  const primary = e?.theme.primary ?? "#2563EB";
  const mode = e?.theme.mode ?? "light";
  if (mode === "dark") {
    return {
      mode, primary,
      page: "#0F172A", text: "#F8FAFC", muted: "#94A3B8", line: "rgba(255,255,255,0.10)",
      input: "#1E293B", inputText: "#F8FAFC",
      head: { bg: "#0F172A", text: "#F8FAFC", muted: "#94A3B8", line: "rgba(255,255,255,0.10)" },
      chip: { bg: `${primary}40`, text: "#E0E7FF" },
      soft: `${primary}33`,
    };
  }
  const light = {
    page: "#FFFFFF", text: "#0F172A", muted: "#64748B", line: "#E2E8F0",
    input: "#F1F5F9", inputText: "#0F172A", soft: `${primary}14`,
  };
  if (mode === "bold") {
    return {
      mode, primary, ...light,
      head: { bg: primary, text: "#FFFFFF", muted: "rgba(255,255,255,0.8)", line: "rgba(255,255,255,0.2)" },
      chip: { bg: "rgba(255,255,255,0.2)", text: "#FFFFFF" },
    };
  }
  return {
    mode, primary, ...light,
    head: { bg: "#FFFFFF", text: "#0F172A", muted: "#64748B", line: "#E2E8F0" },
    chip: { bg: `${primary}1A`, text: primary },
  };
}

// ============ วันที่ ============
export function fmtDay(d: Date, lang: Lang) {
  return lang === "th" ? format(d, "EEE d MMM", { locale: thLocale }) : format(d, "EEE, d MMM");
}
// "ศ. 30 ต.ค. · 09:00–16:00 น."
export function fmtEventWhen(e: PublicEvent, lang: Lang) {
  if (!e.date) return lang === "th" ? "ยังไม่กำหนดวัน" : "Date not set";
  const time = e.startTime ? ` · ${e.startTime}–${e.endTime}${lang === "th" ? " น." : ""}` : "";
  return fmtDay(new Date(`${e.date}T00:00`), lang) + time;
}
// "ศ. 30 ต.ค. · 09:12 น."
export function fmtDateTime(input: string | Date, lang: Lang) {
  const d = typeof input === "string" ? new Date(input) : input;
  return `${fmtDay(d, lang)} · ${format(d, "HH:mm")}${lang === "th" ? " น." : ""}`;
}

// ============ กรอบหน้า: ส่วนหัว (โลโก้ + ผู้จัด + TH/EN) ============
export function PublicShell({
  event,
  pal,
  lang,
  setLang,
  progress,
  children,
}: {
  event: PublicEvent | null; // null = ไม่พบ Event (ใช้โลโก้ EventSurvey)
  pal: Palette;
  lang: Lang;
  setLang: (l: Lang) => void;
  progress?: number; // 0–1 แถบความคืบหน้าใต้ส่วนหัว (หน้าแบบประเมิน)
  children: React.ReactNode;
}) {
  // ให้พื้นหลังนอกกรอบมือถือเป็นสีเดียวกับหน้า (เลื่อนเกินขอบแล้วไม่เห็นสีขาวโผล่)
  useEffect(() => {
    const prev = document.body.style.background;
    document.body.style.background = pal.page;
    return () => {
      document.body.style.background = prev;
    };
  }, [pal.page]);

  const boxBg = pal.mode === "bold" ? "#FFFFFF" : event ? pal.primary : "#0F172A";
  const boxFg = pal.mode === "bold" ? pal.primary : "#FFFFFF";

  return (
    <div className="min-h-dvh" style={{ background: pal.page, color: pal.text }}>
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col">
        <header style={{ background: pal.head.bg, color: pal.head.text }}>
          <div className="flex items-center justify-between gap-3 px-5 py-3.5">
            <div className="flex min-w-0 items-center gap-2.5">
              {event?.logo ? (
                // eslint-disable-next-line @next/next/no-img-element -- โลโก้อาจเป็น URL ภายนอกจาก API
                <img src={event.logo} alt="" className="size-8 shrink-0 rounded-lg object-contain" />
              ) : (
                <span
                  className="flex size-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold"
                  style={{ background: boxBg, color: boxFg }}
                >
                  {event ? initials(event) : "ES"}
                </span>
              )}
              <span className="truncate text-sm font-semibold">{event?.organizer || "EventSurvey"}</span>
            </div>
            <LangToggle lang={lang} setLang={setLang} pal={pal} />
          </div>
          {progress !== undefined && (
            <div className="h-1 w-full" style={{ background: pal.head.line }}>
              <div
                className="h-full transition-[width] duration-300"
                style={{ width: `${Math.round(progress * 100)}%`, background: pal.mode === "bold" ? "#FFFFFF" : pal.primary }}
              />
            </div>
          )}
        </header>
        {children}
      </div>
    </div>
  );
}

function LangToggle({ lang, setLang, pal }: { lang: Lang; setLang: (l: Lang) => void; pal: Palette }) {
  const activeBg = pal.mode === "light" ? "#0F172A" : "#FFFFFF";
  const activeText = pal.mode === "light" ? "#FFFFFF" : pal.mode === "bold" ? pal.primary : "#0F172A";
  return (
    <div className="flex shrink-0 rounded-lg border p-0.5" style={{ borderColor: pal.head.line }}>
      {(["th", "en"] as Lang[]).map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => setLang(l)}
          aria-pressed={lang === l}
          className="min-w-9 rounded-md px-2 py-1 text-xs font-semibold transition-colors"
          style={lang === l ? { background: activeBg, color: activeText } : { color: pal.head.muted }}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

// ============ ข้อมูลงาน: ป้าย + ชื่อ + วันเวลา + สถานที่ ============
export function EventInfo({
  event,
  pal,
  lang,
  chip,
  extra,
}: {
  event: PublicEvent;
  pal: Palette;
  lang: Lang;
  chip: string; // เช่น "ลงทะเบียนเข้าร่วม" / "แบบประเมิน"
  extra?: React.ReactNode; // บรรทัดเพิ่มใต้สถานที่ (เช่น เวลาที่ใช้ทำแบบประเมิน)
}) {
  return (
    <section
      className="border-b px-5 pt-4 pb-5"
      style={{ background: pal.head.bg, color: pal.head.text, borderColor: pal.head.line }}
    >
      <span className="inline-block rounded-full px-2.5 py-1 text-xs font-semibold" style={{ background: pal.chip.bg, color: pal.chip.text }}>
        {chip}
      </span>
      <h1 className="mt-2.5 text-2xl leading-snug font-bold break-words">{pick(event.name, lang)}</h1>
      <div className="mt-2 space-y-1 text-sm" style={{ color: pal.head.muted }}>
        <p className="flex items-center gap-2">
          <CalendarDays className="size-4 shrink-0" /> {fmtEventWhen(event, lang)}
        </p>
        {event.venue && (
          <p className="flex items-center gap-2">
            <MapPin className="size-4 shrink-0" /> <span className="min-w-0 break-words">{event.venue}</span>
          </p>
        )}
        {extra && <div className="pt-1">{extra}</div>}
      </div>
    </section>
  );
}

// ============ หน้าสถานะ (ยังไม่เปิด / ปิดแล้ว / เต็ม / ไม่พบ / สำเร็จ / โหลดไม่สำเร็จ) ============
export type StateTone = "amber" | "slate" | "blue" | "green" | "red";
const TONE: Record<StateTone, { bg: string; fg: string }> = {
  amber: { bg: "#FEF3C7", fg: "#B45309" },
  slate: { bg: "#F1F5F9", fg: "#64748B" },
  blue: { bg: "#DBEAFE", fg: "#2563EB" },
  green: { bg: "#DCFCE7", fg: "#16A34A" },
  red: { bg: "#FEE2E2", fg: "#DC2626" },
};

export function StateMessage({
  icon: Icon,
  tone,
  title,
  lines,
  pal,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  tone: StateTone;
  title: string;
  lines: string[]; // คำอธิบายใต้หัวข้อ (บรรทัดละข้อความ)
  pal: Palette;
  children?: React.ReactNode; // นับถอยหลัง / ปุ่ม / การ์ดสรุป
}) {
  const t = TONE[tone];
  return (
    <main className="flex flex-1 flex-col items-center px-6 pt-14 pb-10 text-center">
      <span
        className="flex size-14 items-center justify-center rounded-full"
        style={pal.mode === "dark" ? { background: `${t.fg}33`, color: t.bg } : { background: t.bg, color: t.fg }}
      >
        <Icon className="size-6" />
      </span>
      <h2 className="mt-4 text-lg font-bold">{title}</h2>
      {lines.filter(Boolean).map((l) => (
        <p key={l} className="mt-1 text-sm" style={{ color: pal.muted }}>
          {l}
        </p>
      ))}
      {children}
    </main>
  );
}

// ============ นับถอยหลัง (วัน / ชม. / นาที) — ตาม Figma C1 ============
export function Countdown({ to, lang, pal }: { to: string; lang: Lang; pal: Palette }) {
  const now = useNow(1000);
  if (!to) return null;
  const ms = new Date(to).getTime() - now.getTime();
  if (ms <= 0) return null;
  const min = Math.floor(ms / 60000);
  const parts = [
    { v: Math.floor(min / 1440), u: lang === "th" ? "วัน" : "days" },
    { v: Math.floor((min % 1440) / 60), u: lang === "th" ? "ชม." : "hrs" },
    { v: min % 60, u: lang === "th" ? "นาที" : "min" },
  ];
  return (
    <div className="mt-6 flex gap-3">
      {parts.map((p) => (
        <div key={p.u} className="flex w-16 flex-col items-center rounded-xl py-2.5" style={{ background: pal.input }}>
          <span className="text-xl font-bold tabular-nums">{String(p.v).padStart(2, "0")}</span>
          <span className="text-[11px]" style={{ color: pal.muted }}>
            {p.u}
          </span>
        </div>
      ))}
    </div>
  );
}

// ปุ่มหลักเต็มความกว้าง (ลงทะเบียน / ส่งแบบประเมิน / ลองอีกครั้ง)
export function PrimaryButton({
  pal,
  children,
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { pal: Palette }) {
  return (
    <button
      {...props}
      className={`h-12 rounded-xl px-6 text-sm font-semibold text-white transition active:scale-[0.99] disabled:opacity-60 ${className}`}
      style={{ background: pal.primary }}
    >
      {children}
    </button>
  );
}

// หน้ารอโหลดข้อมูล (store ยังอ่าน localStorage ไม่เสร็จ)
export function PublicLoading() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col gap-4 px-5 py-6" aria-busy="true">
      <div className="h-8 w-40 animate-pulse rounded-lg bg-slate-100" />
      <div className="h-7 w-3/4 animate-pulse rounded-lg bg-slate-100" />
      <div className="h-4 w-1/2 animate-pulse rounded bg-slate-100" />
      <div className="mt-4 h-12 animate-pulse rounded-xl bg-slate-100" />
      <div className="h-12 animate-pulse rounded-xl bg-slate-100" />
    </div>
  );
}
