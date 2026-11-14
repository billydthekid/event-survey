// app/admin/events/[id]/kiosk/KioskScreen.tsx
// หน้าตาจอ Kiosk แบบโปสเตอร์แนวตั้ง (ตาม Figma: K1–K5, Theme Light / Dark / Bold)
//
// ออกแบบบนผืนผ้าใบขนาด 1080 px กว้าง (Full HD แนวตั้ง) แล้ว KioskView ย่อ/ขยายให้พอดีจอ
// → ค่า px ทุกตัวในไฟล์นี้คือ px บนจอ 1080×1920 จริง
// จอ Kiosk เป็นแค่ป้ายประกาศ: ไม่มีปุ่มกดเข้าฟอร์ม ผู้เข้าร่วมต้องสแกน QR ด้วยมือถือเท่านั้น
"use client";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { th as thLocale } from "date-fns/locale";
import { CalendarDays, Check, Clock, Lock, LogOut, MapPin, Maximize, Minimize, ScanLine } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import type { Lang } from "@/types";
import { KioskModel, KioskScene, initials } from "./kioskModel";

// ============ ข้อความ 2 ภาษา ============
export const KIOSK_TEXT = {
  th: {
    chip: { upcoming: "ยังไม่เริ่ม", live: "กำลังจัดงาน", thanks: "งานจบแล้ว" },
    startsIn: "งานจะเริ่มในอีก",
    unit: { d: "วัน", h: "ชม.", m: "นาที" },
    scanRegister: "สแกนเพื่อลงทะเบียน",
    register: "ลงทะเบียน",
    registerSub: "ใช้เวลา 1 นาที · ไม่ต้องสมัครสมาชิก",
    scanSurvey: "สแกนเพื่อประเมินงาน",
    survey: "แบบประเมิน",
    surveySub: "ใช้เวลา 2 นาที · สำหรับผู้ที่ลงทะเบียนแล้ว",
    scanWithPhone: "สแกนด้วยกล้องมือถือ",
    regUntil: "ลงทะเบียนเปิดถึง",
    surveyUntil: "เปิดประเมินถึง",
    thanksTitle: "ขอบคุณที่มาร่วมงาน",
    thanksDesc: "ช่วยตอบแบบประเมินสั้น ๆ เพื่อพัฒนางานครั้งต่อไป",
    closedTitle: "Event นี้ปิดแล้ว",
    closedDesc: "ปิดรับลงทะเบียนและแบบประเมินแล้ว · ขอบคุณทุกท่าน",
    regClosed: "ปิดรับลงทะเบียนแล้ว",
    regClosedHint: "ขอบคุณที่ให้ความสนใจ",
    surveyLater: "แบบประเมินจะเปิดให้สแกนเมื่องานเริ่ม",
    noDate: "ยังไม่กำหนดวัน",
    hrs: " น.",
  },
  en: {
    chip: { upcoming: "Not started", live: "Happening now", thanks: "Event ended" },
    startsIn: "Starts in",
    unit: { d: "days", h: "hrs", m: "min" },
    scanRegister: "Scan to register",
    register: "Register",
    registerSub: "Takes 1 min · No sign-up needed",
    scanSurvey: "Scan to rate this event",
    survey: "Survey",
    surveySub: "Takes 2 min · For registered attendees",
    scanWithPhone: "Scan with your phone camera",
    regUntil: "Registration open until",
    surveyUntil: "Survey open until",
    thanksTitle: "Thank you for joining",
    thanksDesc: "Please take a short survey to help us improve",
    closedTitle: "This event is closed",
    closedDesc: "Registration and survey are closed · Thank you all",
    regClosed: "Registration is closed",
    regClosedHint: "Thank you for your interest",
    surveyLater: "The survey QR will appear when the event starts",
    noDate: "Date not set",
    hrs: "",
  },
};
type Text = (typeof KIOSK_TEXT)["th"];

// ============ สีตาม Theme ============
interface Palette {
  page: string;
  text: string;
  muted: string;
  line: string;
  card: string; // การ์ดทั่วไป (นับถอยหลัง / แบบประเมิน)
  cardText: string;
  cardBorder: string;
  reg: { bg: string; text: string; sub: string; border: string }; // การ์ด QR ลงทะเบียน
  survey: { bg: string; text: string; sub: string; border: string }; // การ์ด QR แบบประเมิน
  langActive: { bg: string; text: string };
  langBorder: string;
}

function palette(m: KioskModel): Palette {
  const p = m.theme.primary;
  if (m.theme.mode === "dark") {
    return {
      page: "#0B1220",
      text: "#F8FAFC",
      muted: "#94A3B8",
      line: "rgba(255,255,255,0.10)",
      card: "#131C2E",
      cardText: "#F8FAFC",
      cardBorder: "rgba(255,255,255,0.10)",
      reg: { bg: p, text: "#FFFFFF", sub: "rgba(255,255,255,0.8)", border: p },
      survey: { bg: "#131C2E", text: "#F8FAFC", sub: "#94A3B8", border: "rgba(255,255,255,0.12)" },
      langActive: { bg: "#FFFFFF", text: "#0B1220" },
      langBorder: "rgba(255,255,255,0.15)",
    };
  }
  if (m.theme.mode === "bold") {
    return {
      page: p,
      text: "#FFFFFF",
      muted: "rgba(255,255,255,0.8)",
      line: "rgba(255,255,255,0.22)",
      card: "#FFFFFF",
      cardText: "#0F172A",
      cardBorder: "transparent",
      reg: { bg: "#FFFFFF", text: p, sub: "#64748B", border: "transparent" },
      survey: { bg: "#FFFFFF", text: p, sub: "#64748B", border: "transparent" },
      langActive: { bg: "#FFFFFF", text: "#0F172A" },
      langBorder: "rgba(255,255,255,0.3)",
    };
  }
  return {
    page: m.theme.background,
    text: "#0F172A",
    muted: "#64748B",
    line: "#E2E8F0",
    card: "#FFFFFF",
    cardText: "#0F172A",
    cardBorder: "#E2E8F0",
    reg: { bg: p, text: "#FFFFFF", sub: "rgba(255,255,255,0.85)", border: p },
    survey: { bg: "#FFFFFF", text: "#0F172A", sub: "#64748B", border: "#E2E8F0" },
    langActive: { bg: "#0F172A", text: "#FFFFFF" },
    langBorder: "#E2E8F0",
  };
}

export function pageColor(m: KioskModel) {
  return palette(m).page;
}

// ป้ายสถานะ (จุดสี + ข้อความ)
const CHIP: Record<Exclude<KioskScene, "closed">, { fg: string; bg: string }> = {
  upcoming: { fg: "#B45309", bg: "#FEF3C7" },
  live: { fg: "#15803D", bg: "#DCFCE7" },
  thanks: { fg: "#1D4ED8", bg: "#DBEAFE" },
};

// ============ วันที่ / เวลา ============
const toDate = (date: string, time = "00:00") => new Date(`${date}T${time}`);

function fmtDay(d: Date, lang: Lang) {
  return lang === "th" ? format(d, "EEE d MMM", { locale: thLocale }) : format(d, "EEE, d MMM");
}
// "ศ. 30 ต.ค. · 09:00–16:00 น."
function fmtEventWhen(m: KioskModel, lang: Lang, t: Text) {
  if (!m.date) return t.noDate;
  const time = m.startTime ? ` · ${m.startTime}–${m.endTime}${t.hrs}` : "";
  return fmtDay(toDate(m.date), lang) + time;
}
// "ศ. 30 ต.ค. · 09:00 น."
function fmtDateTime(iso: string, lang: Lang, t: Text) {
  const d = new Date(iso);
  return `${fmtDay(d, lang)} · ${format(d, "HH:mm")}${t.hrs}`;
}

// ขนาดชื่องานตามความยาว (ชื่อยาวตัวเล็กลง เพื่อให้จบใน 2 บรรทัด)
function titleSize(text: string) {
  if (text.length <= 24) return 76;
  if (text.length <= 40) return 64;
  return 54;
}

// ============ จอ Kiosk หลัก ============
export function KioskScreen({
  model: m,
  scene,
  showRegister,
  showSurvey,
  lang,
  setLang,
  now,
  origin,
  admin,
}: {
  admin: KioskAdminControls;
  model: KioskModel;
  scene: KioskScene;
  showRegister: boolean;
  showSurvey: boolean;
  lang: Lang;
  setLang: (l: Lang) => void;
  now: Date;
  origin: string;
}) {
  const t = KIOSK_TEXT[lang];
  const pal = palette(m);
  const name = (lang === "en" && m.name.en) || m.name.th;
  const desc = (lang === "en" && m.desc.en) || m.desc.th;
  const registerUrl = origin ? `${origin}/r/${m.code}` : "";
  const surveyUrl = origin ? `${origin}/s/${m.code}` : "";
  const regClosedByTime = !!m.regClose && now > new Date(m.regClose);

  return (
    // overflow-hidden: จอ Kiosk ห้าม scroll — ถ้าเนื้อหาเยอะเกิน รูปโฆษณาจะหดก่อน (ดู AdSlideshow)
    <div className="flex h-full flex-col overflow-hidden" style={{ background: pal.page, color: pal.text }}>
      <Header m={m} pal={pal} lang={lang} setLang={setLang} admin={admin} />

      {scene === "closed" ? (
        // ===== K5 ปิดแล้ว =====
        <main className="flex flex-1 flex-col items-center justify-center px-24 text-center">
          <div
            className="flex size-[120px] items-center justify-center rounded-full"
            style={{ background: m.theme.mode === "light" ? "#EFF6FF" : "rgba(255,255,255,0.12)" }}
          >
            <Check size={56} strokeWidth={2.5} style={{ color: m.theme.mode === "light" ? m.theme.primary : "#FFFFFF" }} />
          </div>
          <h1 className="mt-12 text-[72px] leading-tight font-bold">{t.closedTitle}</h1>
          <p className="mt-6 line-clamp-2 text-[32px] font-medium break-words">{name}</p>
          <p className="mt-3 text-[28px]" style={{ color: pal.muted }}>
            {t.closedDesc}
          </p>
        </main>
      ) : (
        <main className="flex min-h-0 flex-1 flex-col gap-12 px-12 pt-4 pb-12">
          {/* ===== รูปโฆษณา (หดได้ เมื่อข้อความ/QR ต้องการพื้นที่) ===== */}
          {m.ads.length > 0 && <AdSlideshow ads={m.ads} seconds={m.adSeconds} />}

          {/* ===== ชื่องาน + วันเวลา + สถานที่ ===== */}
          <section className="shrink-0">
            <StatusChip scene={scene} text={t.chip[scene]} mode={m.theme.mode} />
            {(() => {
              const title = scene === "thanks" ? t.thanksTitle : name;
              return (
                // ชื่อยาว → ตัวเล็กลง และไม่เกิน 2 บรรทัด
                <h1
                  className="mt-5 line-clamp-2 leading-[1.15] font-bold tracking-tight break-words"
                  style={{ fontSize: titleSize(title) }}
                >
                  {title}
                </h1>
              );
            })()}
            <div className="mt-5 flex flex-wrap gap-x-10 gap-y-2 text-[28px]" style={{ color: pal.muted }}>
              <span className="inline-flex shrink-0 items-center gap-3">
                <CalendarDays size={30} /> {fmtEventWhen(m, lang, t)}
              </span>
              {m.venue && (
                <span className="flex min-w-0 items-center gap-3">
                  <MapPin size={30} className="shrink-0" />
                  <span className="line-clamp-1 break-all">{m.venue}</span>
                </span>
              )}
            </div>
            {scene === "live" && desc && (
              <p className="mt-6 line-clamp-3 text-[28px] leading-relaxed break-words" style={{ color: pal.muted }}>
                {desc}
              </p>
            )}
            {scene === "thanks" && (
              <p className="mt-6 line-clamp-2 text-[28px] leading-relaxed break-words" style={{ color: pal.muted }}>
                {name} · {t.thanksDesc}
              </p>
            )}
          </section>

          {/* ===== ส่วน QR ตามสถานะ ===== */}
          {/* mt-auto: ดัน QR ลงชิดล่างจอ (ฟีลโปสเตอร์) — ถ้าพื้นที่ไม่พอ ค่านี้เป็น 0 เอง */}
          <section className="mt-auto flex shrink-0 flex-col gap-8">
            {scene === "upcoming" && <Countdown m={m} now={now} pal={pal} t={t} />}

            {showRegister && showSurvey ? (
              // K2: QR ทั้งคู่ (การ์ดคู่)
              <div className="grid grid-cols-2 gap-9">
                <QrPairCard title={t.register} caption={t.scanWithPhone} url={registerUrl} colors={pal.reg} />
                <QrPairCard title={t.survey} caption={t.scanWithPhone} url={surveyUrl} colors={pal.survey} />
              </div>
            ) : showRegister ? (
              // K1/K3: QR ลงทะเบียนอย่างเดียว (การ์ดยาว)
              <QrWideCard
                scan={t.scanRegister}
                title={t.register}
                sub={t.registerSub}
                url={registerUrl}
                colors={pal.reg}
              />
            ) : showSurvey ? (
              // K4 (หรือ Kiosk ตั้งไว้ให้แสดงแค่ Survey)
              <QrWideCard
                scan={t.scanSurvey}
                title={t.survey}
                sub={t.surveySub}
                url={surveyUrl}
                colors={pal.survey}
              />
            ) : (
              // ไม่มี QR ให้แสดง (เช่น ปิดรับลงทะเบียนแล้ว)
              <InfoCard
                pal={pal}
                title={regClosedByTime ? t.regClosed : t.surveyLater}
                hint={regClosedByTime ? t.regClosedHint : ""}
              />
            )}

            {/* บรรทัดบอกเวลาปิด */}
            {showRegister && !showSurvey && m.regClose && (
              <Hint pal={pal}>
                {t.regUntil} {fmtDateTime(m.regClose, lang, t)}
              </Hint>
            )}
            {showSurvey && !showRegister && m.surveyClose && (
              <Hint pal={pal}>
                {t.surveyUntil} {fmtDateTime(m.surveyClose, lang, t)}
              </Hint>
            )}
          </section>
        </main>
      )}

    </div>
  );
}

// ============ ปุ่มของ admin (เต็มจอ / ออก) ============
export interface KioskAdminControls {
  visible: boolean; // โผล่เมื่อขยับเมาส์/แตะจอ แล้วจางหายเอง
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  onExit: () => void;
  labels: { fullscreen: string; exitFullscreen: string; exit: string };
}

function AdminControls({ c, pal }: { c: KioskAdminControls; pal: Palette }) {
  const btn = "flex size-[64px] items-center justify-center rounded-[16px] border transition-colors";
  const style = { borderColor: pal.langBorder, color: pal.muted };
  return (
    <div
      className={`flex items-center gap-3 transition-opacity duration-300 ${
        c.visible ? "opacity-100" : "pointer-events-none opacity-0"
      }`}
    >
      <button
        type="button"
        onClick={c.onToggleFullscreen}
        title={c.isFullscreen ? c.labels.exitFullscreen : c.labels.fullscreen}
        aria-label={c.isFullscreen ? c.labels.exitFullscreen : c.labels.fullscreen}
        className={btn}
        style={style}
      >
        {c.isFullscreen ? <Minimize size={28} /> : <Maximize size={28} />}
      </button>
      <button type="button" onClick={c.onExit} title={c.labels.exit} aria-label={c.labels.exit} className={btn} style={style}>
        <LogOut size={28} />
      </button>
    </div>
  );
}

// ============ ส่วนหัว: โลโก้ + ผู้จัด + TH/EN ============
function Header({
  m,
  pal,
  lang,
  setLang,
  admin,
}: {
  m: KioskModel;
  pal: Palette;
  lang: Lang;
  setLang: (l: Lang) => void;
  admin: KioskAdminControls;
}) {
  const boxBg = m.theme.mode === "bold" ? "#FFFFFF" : m.theme.primary;
  const boxFg = m.theme.mode === "bold" ? m.theme.primary : "#FFFFFF";
  return (
    <header className="flex items-center justify-between px-12 pt-12 pb-8">
      <div className="flex items-center gap-5">
        {m.logo ? (
          // eslint-disable-next-line @next/next/no-img-element -- โลโก้อาจเป็น URL ภายนอกจาก API
          <img src={m.logo} alt="" className="size-[76px] rounded-[20px] object-contain" />
        ) : (
          <div
            className="flex size-[76px] items-center justify-center rounded-[20px] text-[28px] font-bold"
            style={{ background: boxBg, color: boxFg }}
          >
            {initials(m)}
          </div>
        )}
        <div className="max-w-[560px] min-w-0 leading-tight">
          <p className="truncate text-[30px] font-semibold">{m.organizer || "EventSurvey"}</p>
          <p className="text-[22px]" style={{ color: pal.muted }}>
            EventSurvey
          </p>
        </div>
      </div>

      {/* ขวาบน: ปุ่ม admin (จางหายเมื่อไม่ได้ใช้) + สลับภาษา */}
      <div className="flex items-center gap-4">
        <AdminControls c={admin} pal={pal} />
        <div className="flex rounded-[14px] border p-1.5" style={{ borderColor: pal.langBorder }}>
          {(["th", "en"] as Lang[]).map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => setLang(l)}
              className="min-w-[72px] rounded-[10px] px-4 py-2 text-[24px] font-semibold transition-colors"
              style={lang === l ? { background: pal.langActive.bg, color: pal.langActive.text } : { color: pal.muted }}
            >
              {l.toUpperCase()}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}

// ============ ป้ายสถานะ ============
function StatusChip({ scene, text, mode }: { scene: Exclude<KioskScene, "closed">; text: string; mode: KioskModel["theme"]["mode"] }) {
  const c = CHIP[scene];
  const style =
    mode === "bold"
      ? { background: "#FFFFFF", color: c.fg }
      : mode === "dark"
        ? { background: `${c.fg}33`, color: c.bg }
        : { background: c.bg, color: c.fg };
  return (
    <span className="inline-flex items-center gap-3 rounded-full px-5 py-2 text-[24px] font-semibold" style={style}>
      <span className="size-3 rounded-full" style={{ background: "currentColor" }} />
      {text}
    </span>
  );
}

// ============ รูปโฆษณา 16:9 (หลายรูป = เลื่อนอัตโนมัติทุก `seconds` วินาที ตั้งใน Wizard ขั้น Branding) ============
function AdSlideshow({ ads, seconds }: { ads: string[]; seconds: number }) {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    if (ads.length < 2) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % ads.length), seconds * 1000); 
    return () => clearInterval(timer);
  }, [ads.length, seconds]);

  return (
    // สูงได้สุด 16:9 ของความกว้าง (984 × 9/16 ≈ 554 px) / ถ้าพื้นที่ไม่พอจะหดลง (ไม่ต่ำกว่า 240 px)
    // และ object-cover ครอปกลางรูปแทน → QR ไม่ถูกดันตกจอ
    <div className="relative max-h-[554px] min-h-[240px] w-full flex-1 overflow-hidden rounded-[36px] bg-slate-100">
      {ads.map((src, i) => (
        // eslint-disable-next-line @next/next/no-img-element -- รูปโฆษณาอาจเป็น URL ภายนอกจาก API
        <img
          key={src + i}
          src={src}
          alt=""
          className="absolute inset-0 size-full object-cover transition-opacity duration-1000"
          style={{ opacity: i === index % ads.length ? 1 : 0 }}
        />
      ))}
      {ads.length > 1 && (
        <div className="absolute inset-x-0 bottom-6 flex justify-center gap-3">
          {ads.map((src, i) => (
            <span
              key={src + i}
              className="h-3 rounded-full bg-white shadow transition-all"
              style={{ width: i === index % ads.length ? 40 : 12, opacity: i === index % ads.length ? 1 : 0.6 }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ============ K1: นับถอยหลังถึงเวลาเริ่มงาน ============
function Countdown({ m, now, pal, t }: { m: KioskModel; now: Date; pal: Palette; t: Text }) {
  if (!m.date || !m.startTime) return null;
  const ms = toDate(m.date, m.startTime).getTime() - now.getTime();
  if (ms <= 0) return null;
  const totalMin = Math.floor(ms / 60000);
  const parts = [
    { v: Math.floor(totalMin / 1440), u: t.unit.d },
    { v: Math.floor((totalMin % 1440) / 60), u: t.unit.h },
    { v: totalMin % 60, u: t.unit.m },
  ];
  return (
    <div
      className="flex items-center justify-between rounded-[32px] border px-12 py-9"
      style={{ background: pal.card, color: pal.cardText, borderColor: pal.cardBorder }}
    >
      <p className="text-[30px] font-medium" style={{ color: m.theme.mode === "bold" ? "#64748B" : pal.muted }}>
        {t.startsIn}
      </p>
      <div className="flex items-start gap-5">
        {parts.map((p, i) => (
          <div key={p.u} className="flex items-start gap-5">
            {i > 0 && <span className="text-[56px] leading-none font-bold opacity-30">:</span>}
            <div className="flex flex-col items-center">
              <span className="text-[64px] leading-none font-bold tabular-nums">{String(p.v).padStart(2, "0")}</span>
              <span className="mt-2 text-[22px]" style={{ color: "#64748B" }}>
                {p.u}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============ กล่อง QR สีขาว (QR อ่านง่ายที่สุดบนพื้นขาว) ============
function QrBox({ url, size }: { url: string; size: number }) {
  return (
    <div className="shrink-0 rounded-[24px] bg-white p-5" style={{ boxShadow: "0 0 0 1px rgba(15,23,42,0.06)" }}>
      {url ? <QRCodeSVG value={url} size={size} marginSize={0} /> : <div style={{ width: size, height: size }} />}
    </div>
  );
}

type CardColors = Palette["reg"];

// ============ การ์ด QR ยาว (QR ซ้าย ข้อความขวา) — K1 / K3 / K4 ============
function QrWideCard({ scan, title, sub, url, colors }: { scan: string; title: string; sub: string; url: string; colors: CardColors }) {
  return (
    <div
      className="flex items-center gap-12 rounded-[36px] border p-10"
      style={{ background: colors.bg, color: colors.text, borderColor: colors.border }}
    >
      <div className="flex shrink-0 flex-col items-center">
        <QrBox url={url} size={300} />
        <QrLink url={url} color={colors.sub} />
      </div>
      <div className="min-w-0">
        <p className="inline-flex items-center gap-3 text-[26px] font-medium" style={{ color: colors.sub }}>
          <ScanLine size={30} /> {scan}
        </p>
        <p className="mt-3 text-[64px] leading-tight font-bold">{title}</p>
        <p className="mt-3 text-[24px]" style={{ color: colors.sub }}>
          {sub}
        </p>
      </div>
    </div>
  );
}

// ============ การ์ด QR คู่ (หัวข้อบน QR กลาง คำแนะนำล่าง) — K2 ============
function QrPairCard({ title, caption, url, colors }: { title: string; caption: string; url: string; colors: CardColors }) {
  return (
    <div
      className="flex flex-col items-center rounded-[36px] border px-8 pt-10 pb-8"
      style={{ background: colors.bg, color: colors.text, borderColor: colors.border }}
    >
      <p className="text-[44px] leading-tight font-bold">{title}</p>
      <div className="mt-7">
        <QrBox url={url} size={320} />
      </div>
      <QrLink url={url} color={colors.sub} />
      <p className="mt-3 inline-flex items-center gap-2 text-[22px]" style={{ color: colors.sub }}>
        <ScanLine size={24} /> {caption}
      </p>
    </div>
  );
}

// ลิงก์ใต้ QR (ไว้พิมพ์เองเมื่อสแกนไม่ได้) — ตัด http:// ออกให้สั้นลง เช่น "localhost:3000/r/FIG-1017"
function QrLink({ url, color }: { url: string; color: string }) {
  if (!url) return null;
  return (
    <p className="mt-4 max-w-[360px] text-center text-[22px] font-medium break-all" style={{ color }}>
      {url.replace(/^https?:\/\//, "")}
    </p>
  );
}

// ============ การ์ดข้อความ (ไม่มี QR ให้สแกน) ============
function InfoCard({ pal, title, hint }: { pal: Palette; title: string; hint: string }) {
  return (
    <div
      className="flex items-center gap-8 rounded-[36px] border px-12 py-12"
      style={{ background: pal.card, color: pal.cardText, borderColor: pal.cardBorder }}
    >
      <div className="flex size-[88px] shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500">
        <Lock size={40} />
      </div>
      <div>
        <p className="text-[40px] font-bold">{title}</p>
        {hint && <p className="mt-2 text-[26px] text-slate-500">{hint}</p>}
      </div>
    </div>
  );
}

function Hint({ pal, children }: { pal: Palette; children: React.ReactNode }) {
  return (
    <p className="inline-flex items-center justify-center gap-3 text-[24px]" style={{ color: pal.muted }}>
      <Clock size={26} /> {children}
    </p>
  );
}

