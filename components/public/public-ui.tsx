// components/public/public-ui.tsx
// ชิ้นส่วนที่หน้าผู้เข้าร่วมใช้ร่วมกัน (ลงทะเบียน /r/<code> และแบบประเมิน /s/<code>)
// ดีไซน์ตาม Figma: A5/A2/A4 (ลงทะเบียน), B1/B2 (แบบประเมิน), C1–C4 (สถานะ), E1 (โหลดไม่สำเร็จ), T-A1 (Dark/Bold)
// Mobile first: กว้างสุด 28rem (ตรงกับจอมือถือ) บนจอใหญ่วางกลางจอ
"use client";
import { useEffect, useState, useSyncExternalStore } from "react";
import { format } from "date-fns";
import { th as thLocale } from "date-fns/locale";
import { CalendarDays, ExternalLink, Mail, MapPin, Phone } from "lucide-react";
import type { Lang } from "@/types";
import { useNow } from "@/lib/hooks/useNow";
import { PublicEvent, pick, type PageStyle } from "@/lib/public-event";
import type { PageKey } from "@/lib/theme-presets";
import { whiteTextContrast } from "@/lib/utils/color";

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
  page: string; // พื้นหลังส่วนเนื้อหา (สีพื้นหลังที่ Event Admin เลือกใน Wizard ถ้ามี)
  pageImage: string; // รูปพื้นหลังจาก Wizard ("" = ไม่มี)
  imageInside: boolean; // true = รูปพื้นหลังอยู่หลังเนื้อหาเลย (หน้าฟอร์ม / Survey ที่ตั้งรูปแยก) · false = แสดงรอบกรอบเนื้อหา
  banner: string; // แบนเนอร์หัวหน้า 4:1 (Wizard ขั้น Branding) "" = ไม่มี
  text: string;
  muted: string;
  line: string;
  input: string; // พื้นช่องกรอก
  inputText: string;
  head: { bg: string; text: string; muted: string; line: string }; // ส่วนหัว + ข้อมูลงาน
  chip: { bg: string; text: string };
  soft: string; // พื้นตัวเลือกที่ถูกเลือก (โทนอ่อนของสีหลัก)
}

// page = หน้าไหน (ฟอร์ม / Survey) → ใช้สีที่ Event Admin ตั้งแยกให้หน้านั้น + แบนเนอร์ของหน้านั้น
export function palette(e: Pick<PublicEvent, "theme" | "pages"> | null, page?: PageKey): Palette {
  const look = page ? e?.pages?.[page] : undefined;
  const base = basePalette(e);
  const withBanner = { ...base, banner: look?.banner ?? "" };
  // ตั้งสีแยกให้หน้านี้ → ใช้สีชุดนั้นทั้งหน้า (เหมือน Preview ฟอร์ม / Survey ใน Wizard)
  if (look?.own) return ownPagePalette(look, withBanner.banner);
  // ไม่ได้ตั้งแยก → ธีมเดิม · ตั้งสีตัวอักษรเอง (textColor) → ใช้กับส่วนข้อมูลงาน (ชื่อ รายละเอียด)
  const tc = e?.theme.textColor;
  return tc ? { ...withBanner, head: { ...withBanner.head, text: tc, muted: alpha(tc, 0.72) } } : withBanner;
}

// ใส่ความโปร่งใสให้สี HEX (#RRGGBB) — สีตัวอักษรรอง
const alpha = (hex: string, a: number) =>
  /^#[0-9a-f]{6}$/i.test(hex) ? hex + Math.round(a * 255).toString(16).padStart(2, "0") : hex;

// สีชุดที่ Event Admin ตั้งแยกให้หน้าฟอร์ม / Survey: พื้นเข้ม → ช่องกรอกโทนเข้ม · พื้นอ่อน → โทนอ่อน
function ownPagePalette(l: PageStyle, banner: string): Palette {
  const dark = whiteTextContrast(l.bg) >= 4.5;
  const p = l.primary;
  const line = dark ? "rgba(255,255,255,0.12)" : "rgba(15,23,42,0.10)";
  return {
    mode: dark ? "dark" : "light",
    primary: p,
    page: l.bg,
    pageImage: l.bgImage ?? "",
    imageInside: !!l.bgImage,
    banner,
    text: l.text,
    muted: l.muted,
    line,
    input: dark ? "rgba(255,255,255,0.10)" : "rgba(255,255,255,0.85)",
    inputText: dark ? "#F8FAFC" : "#0F172A",
    head: { bg: "transparent", text: l.text, muted: l.muted, line },
    chip: dark ? { bg: `${p}40`, text: "#E0E7FF" } : { bg: `${p}1A`, text: p },
    soft: dark ? `${p}33` : `${p}14`,
  };
}

function basePalette(e: Pick<PublicEvent, "theme"> | null): Omit<Palette, "banner"> {
  const primary = e?.theme.primary ?? "#2563EB";
  const mode = e?.theme.mode ?? "light";
  // พื้นหลังจาก Wizard: สีที่เลือกเอง (ทุกธีม เหมือนตัวอย่างใน Wizard) / สีเดิมใน Event (เฉพาะ Light)
  const bg = e?.theme.background;
  const pageImage = bg?.image ?? "";
  const imageInside = false;
  if (mode === "dark") {
    return {
      mode, primary, pageImage, imageInside,
      page: bg?.custom || "#0F172A", text: "#F8FAFC", muted: "#94A3B8", line: "rgba(255,255,255,0.10)",
      input: "#1E293B", inputText: "#F8FAFC",
      head: { bg: "#0F172A", text: "#F8FAFC", muted: "#94A3B8", line: "rgba(255,255,255,0.10)" },
      chip: { bg: `${primary}40`, text: "#E0E7FF" },
      soft: `${primary}33`,
    };
  }
  const light = {
    page: "#FFFFFF", text: "#0F172A", muted: "#64748B", line: "#E2E8F0",
    input: "#F1F5F9", inputText: "#0F172A", soft: `${primary}14`, pageImage, imageInside,
  };
  if (mode === "bold") {
    return {
      mode, primary, ...light,
      page: bg?.custom || light.page,
      head: { bg: primary, text: "#FFFFFF", muted: "rgba(255,255,255,0.8)", line: "rgba(255,255,255,0.2)" },
      chip: { bg: "rgba(255,255,255,0.2)", text: "#FFFFFF" },
    };
  }
  return {
    mode, primary, ...light,
    page: bg?.custom || bg?.base || light.page,
    head: { bg: "#FFFFFF", text: "#0F172A", muted: "#64748B", line: "#E2E8F0" },
    chip: { bg: `${primary}1A`, text: primary },
  };
}

// ============ วันที่ ============
export function fmtDay(d: Date, lang: Lang) {
  return lang === "th" ? format(d, "EEE d MMM", { locale: thLocale }) : format(d, "EEE, d MMM");
}
// วันเดียว: "ศ. 30 ต.ค. · 09:00–16:00 น."
// หลายวัน:  "ศ. 30 ต.ค. 09:00 – ส. 31 ต.ค. 16:00 น." (แบบเดียวกับตัวอย่างใน Wizard)
export function fmtEventWhen(e: Pick<PublicEvent, "date" | "endDate" | "startTime" | "endTime">, lang: Lang) {
  if (!e.date) return lang === "th" ? "ยังไม่กำหนดวัน" : "Date not set";
  const hrs = lang === "th" ? " น." : "";
  const start = fmtDay(new Date(`${e.date}T00:00`), lang);
  if (e.endDate && e.endDate !== e.date) {
    const end = fmtDay(new Date(`${e.endDate}T00:00`), lang);
    return e.startTime ? `${start} ${e.startTime} – ${end} ${e.endTime}${hrs}` : `${start} – ${end}`;
  }
  const time = e.startTime ? ` · ${e.startTime}–${e.endTime}${hrs}` : "";
  return start + time;
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

  // รูปพื้นหลังจาก Wizard: แสดงรอบกรอบเนื้อหา (เห็นบนแท็บเล็ต/คอม) · ตัวเนื้อหาใช้สีพื้นทึบ → ฟอร์มอ่านง่ายเสมอ
  // รูปพื้นหลัง 2 แบบ:
  // - รูปของ Kiosk (ไม่ได้ตั้งหน้าแยก) → อยู่รอบกรอบเนื้อหา เนื้อหาเป็นสีทึบ (ฟอร์มอ่านง่าย)
  // - รูปที่ Event Admin ตั้งให้หน้าฟอร์ม / Survey โดยเฉพาะ (แนวตั้งสำหรับมือถือ) → อยู่หลังเนื้อหาเลย (เหมือน Preview)
  const image = (src: string): React.CSSProperties => ({
    backgroundColor: pal.page,
    backgroundImage: `url("${src}")`,
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundAttachment: "fixed",
  });
  const outer: React.CSSProperties = pal.pageImage && !pal.imageInside ? image(pal.pageImage) : { background: pal.page };
  const inner: React.CSSProperties | undefined = !pal.pageImage
    ? undefined
    : pal.imageInside
      ? image(pal.pageImage)
      : { background: pal.page };
  return (
    <div className="min-h-dvh" style={{ ...outer, color: pal.text }}>
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col" style={inner}>
        <header style={{ background: pal.head.bg, color: pal.head.text }}>
          <div className="flex items-center justify-between gap-3 px-5 py-3.5">
            <div className="flex min-w-0 items-center gap-2.5">
              {event?.logo ? (
                // eslint-disable-next-line @next/next/no-img-element -- โลโก้อาจเป็น URL ภายนอกจาก API
                <img src={event.logo} alt="" className="size-8 shrink-0 rounded-lg object-contain" />
              ) : (
                // ไม่มีโลโก้ของงาน (หรือไม่พบ Event) → โลโก้ระบบ public/logo.png เหมือนจอ Kiosk
                // กล่องขาวรองไว้ → เห็นชัดทุก Theme (Light / Dark / Bold)
                <span
                  className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white p-1"
                  style={{ boxShadow: "0 0 0 1px rgba(15,23,42,0.08)" }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- รูปเล็กคงที่ ใช้แบบเดียวกับ Sidebar / Kiosk */}
                  <img src="/logo.png" alt="EventSurvey" className="size-full object-contain" />
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
      {/* รูปหัวหน้า:
          - มีแบนเนอร์ของหน้านี้ (4:1 แบบ Google Forms, ตั้งในขั้น Branding) → แสดงแบนเนอร์ (เหมือน Preview ฟอร์ม / Survey)
          - ไม่มี → รูปปก 16:9 (เหมือนตัวอย่างหน้า Event บนมือถือ) · ไม่มีทั้งคู่ = ไม่แสดงกรอบ */}
      {pal.banner ? (
        // eslint-disable-next-line @next/next/no-img-element -- รูปจาก Wizard เป็น data URL
        <img src={pal.banner} alt="" className="mb-4 aspect-[4/1] w-full rounded-xl object-cover" />
      ) : (
        event.cover && (
          // โชว์รูปปกเต็มทั้งรูป (object-contain) ไม่ตัดหัว-ท้าย เช่นโปสเตอร์แนวตั้งในกรอบ 16:9
          // ส่วนที่ว่างข้าง ๆ เติมด้วยรูปเดียวกันแบบเบลอ (แบบเดียวกับจอ Kiosk) · รูป 16:9 = เต็มกรอบเหมือนเดิม
          <div className="relative mb-4 aspect-video w-full overflow-hidden rounded-xl">
            {/* eslint-disable-next-line @next/next/no-img-element -- รูปจาก Wizard เป็น data URL / URL ภายนอก */}
            <img src={event.cover} alt="" aria-hidden className="absolute inset-0 size-full scale-110 object-cover blur-xl" />
            {/* eslint-disable-next-line @next/next/no-img-element -- รูปจาก Wizard เป็น data URL / URL ภายนอก */}
            <img src={event.cover} alt="" className="absolute inset-0 size-full object-contain" />
          </div>
        )
      )}
      {/* ป้าย: หน้านี้คืออะไร (ลงทะเบียน / แบบประเมิน) + ประเภทงาน (เหมือนตัวอย่างใน Wizard) */}
      <div className="flex flex-wrap gap-1.5">
        <span className="inline-block rounded-full px-2.5 py-1 text-xs font-semibold" style={{ background: pal.chip.bg, color: pal.chip.text }}>
          {chip}
        </span>
        {pick(event.typeLabel, lang) && (
          <span
            className="inline-block rounded-full border px-2.5 py-1 text-xs font-medium"
            style={{ borderColor: pal.head.line, color: pal.head.muted }}
          >
            {pick(event.typeLabel, lang)}
          </span>
        )}
      </div>
      <h1 className="mt-2.5 text-2xl leading-snug font-bold break-words">{pick(event.name, lang)}</h1>
      <div className="mt-2 space-y-1 text-sm" style={{ color: pal.head.muted }}>
        <p className="flex items-center gap-2">
          <CalendarDays className="size-4 shrink-0" /> {fmtEventWhen(event, lang)}
        </p>
        {event.venue && (
          <p className="flex items-center gap-2">
            <MapPin className="size-4 shrink-0" /> <span className="min-w-0 break-words">{event.venue}</span>
            {/* ลิงก์แผนที่จาก Wizard → เปิดแอปแผนที่ในมือถือ */}
            {event.mapUrl && (
              <a
                href={event.mapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-auto inline-flex shrink-0 items-center gap-1 text-xs font-semibold underline-offset-2 hover:underline"
                style={{ color: pal.mode === "light" ? pal.primary : pal.head.text }}
              >
                {lang === "th" ? "ดูแผนที่" : "Map"} <ExternalLink className="size-3" />
              </a>
            )}
          </p>
        )}
        {extra && <div className="pt-1">{extra}</div>}
      </div>
      {/* รายละเอียดงาน (REQ-12: หน้าลงทะเบียนแสดงรายละเอียดงานก่อนแบบฟอร์ม) */}
      <EventDescription text={pick(event.desc, lang)} pal={pal} lang={lang} />
      {/* ช่องทางติดต่อ: แสดงเมื่อ Event Admin เปิดสวิตช์ "แสดงช่องทางติดต่อบนหน้า Event" */}
      {(event.contactPhone || event.contactEmail) && (
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm" style={{ color: pal.head.muted }}>
          {event.contactPhone && (
            <a href={`tel:${event.contactPhone.replace(/[^\d+]/g, "")}`} className="inline-flex items-center gap-1.5 hover:underline">
              <Phone className="size-4 shrink-0" /> {event.contactPhone}
            </a>
          )}
          {event.contactEmail && (
            <a href={`mailto:${event.contactEmail}`} className="inline-flex min-w-0 items-center gap-1.5 break-all hover:underline">
              <Mail className="size-4 shrink-0" /> {event.contactEmail}
            </a>
          )}
        </div>
      )}
    </section>
  );
}

// รายละเอียดงาน: ยาวเกิน 3 บรรทัด → ย่อไว้ มีปุ่ม "ดูเพิ่ม" (ฟอร์มจะได้ไม่ถูกดันลงไปไกล)
function EventDescription({ text, pal, lang }: { text: string; pal: Palette; lang: Lang }) {
  const [open, setOpen] = useState(false);
  const clean = text.trim();
  if (!clean) return null;
  const long = clean.length > 140 || clean.split("\n").length > 3;
  return (
    <div className="mt-3 text-sm leading-relaxed" style={{ color: pal.head.text }}>
      <p className={`break-words whitespace-pre-line ${long && !open ? "line-clamp-3" : ""}`}>{clean}</p>
      {long && (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="mt-1 text-xs font-semibold"
          style={{ color: pal.mode === "light" ? pal.primary : pal.head.muted }}
        >
          {open ? (lang === "th" ? "ย่อ" : "Show less") : lang === "th" ? "ดูเพิ่ม" : "Read more"}
        </button>
      )}
    </div>
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
