// lib/theme-presets.ts
// ธีมสำเร็จรูปของ Branding (Wizard ขั้นที่ 2) + ค่าสีที่ใช้วาด Preview
// กดธีม = ตั้ง สีหลัก / โทนอ่อน / พื้นหลัง / โหมด ทีเดียวทั้งชุด · "Reset" = กลับเป็นธีมแรก (มินิมอล)
import type { EventDraft, PageTheme } from "@/types/event";
import { whiteTextContrast } from "@/lib/utils/color";

type Theme = EventDraft["theme"];

export interface ThemePreset {
  id: string;
  name: string;
  nameEn: string;
  primary: string;
  secondary: string;
  bgColor: string;
  mode: Theme["mode"];
}

// สีหลักทุกธีมผ่าน contrast ≥ 4.5 กับตัวหนังสือสีขาว (ไม่ขึ้นคำเตือนเอง)
export const THEME_PRESETS: ThemePreset[] = [
  { id: "minimal", name: "มินิมอล", nameEn: "Minimal", primary: "#2563EB", secondary: "#DBEAFE", bgColor: "#FFFFFF", mode: "light" },
  { id: "sky", name: "ฟ้าใส", nameEn: "Sky", primary: "#0369A1", secondary: "#BAE6FD", bgColor: "#E0F2FE", mode: "light" },
  { id: "pastel", name: "พาสเทล", nameEn: "Pastel", primary: "#DB2777", secondary: "#FBCFE8", bgColor: "#FDF2F8", mode: "light" },
  { id: "nature", name: "ธรรมชาติ", nameEn: "Nature", primary: "#0F766E", secondary: "#BBF7D0", bgColor: "#F0FDF4", mode: "light" },
  { id: "night", name: "กลางคืน", nameEn: "Night", primary: "#7C3AED", secondary: "#1E293B", bgColor: "#0F172A", mode: "dark" },
  { id: "vivid", name: "สดใส", nameEn: "Vivid", primary: "#C2410C", secondary: "#FED7AA", bgColor: "#C2410C", mode: "bold" },
];

export const DEFAULT_PRESET = THEME_PRESETS[0];

/** ค่าธีมเมื่อเลือกธีมสำเร็จรูป (รูปพื้นหลัง → กลับเป็นสี · สีตัวอักษร → อัตโนมัติ · โลโก้ / สีของฟอร์ม-Survey ที่ตั้งแยกคงไว้) */
export function applyPreset(p: ThemePreset): Partial<Theme> {
  return { primary: p.primary, secondary: p.secondary, bgColor: p.bgColor, mode: p.mode, bgType: "color", preset: p.id, textColor: "" };
}

/** ใส่ความโปร่งใสให้สี HEX (#RRGGBB) เช่น ใช้ทำสีตัวอักษรรอง */
const alpha = (hex: string, a: number) => (/^#[0-9a-f]{6}$/i.test(hex) ? hex + Math.round(a * 255).toString(16).padStart(2, "0") : hex);

// ============ สีที่ใช้วาด Preview (มือถือ / Kiosk) ============
export interface PreviewColors {
  page: string; // พื้นหลังทั้งหน้า (สี) — ถ้ามีรูปพื้นหลังจะวางรูปทับ
  pageImage?: string;
  pageBlur: number; // เบลอรูปพื้นหลัง (px)
  text: string;
  muted: string;
  button: { bg: string; text: string };
  chip: { bg: string; text: string };
  coverBg: string; // พื้นช่องรูปปกตอนยังไม่มีรูป
}

export function previewColors(t: Theme): PreviewColors {
  const bg = t.bgColor || "#FFFFFF";
  const onDark = t.mode === "dark" || t.mode === "bold";
  return {
    page: t.mode === "bold" && !t.bgColor ? t.primary : bg,
    pageImage: t.bgType === "image" ? t.bg?.dataUrl : undefined,
    pageBlur: t.bgBlur ?? 0,
    // ตั้งสีตัวอักษรเอง → ใช้สีนั้น (ตัวรอง = สีเดียวกันจางลง) · ไม่ตั้ง = อัตโนมัติตามโหมด
    text: t.textColor || (onDark ? "#F8FAFC" : "#0F172A"),
    muted: t.textColor ? alpha(t.textColor, 0.72) : onDark ? "#CBD5E1" : "#64748B",
    button: t.mode === "bold" ? { bg: "#FFFFFF", text: t.primary } : { bg: t.primary, text: "#FFFFFF" },
    chip: onDark ? { bg: "rgba(255,255,255,0.15)", text: "#F8FAFC" } : { bg: t.secondary, text: t.primary },
    coverBg: t.secondary,
  };
}

// ============ สีของหน้าฟอร์ม / Survey ============
export type PageKey = "form" | "survey";

export interface PageLook {
  primary: string;
  bg: string;
  bgImage?: string;
  bgBlur?: number; // เบลอรูปพื้นหลัง (px)
  text: string;
  muted: string;
  banner?: string; // แบนเนอร์หัวหน้า (data URL · 4:1) · ไม่มี = ไม่แสดง
}

/** ค่าเริ่มต้นตอนเปิด "ตั้งสีแยก" = คัดลอกจาก Kiosk (รูปพื้นหลัง Kiosk ไม่คัดลอก เพราะคนละแนว) */
export function pageThemeFromKiosk(t: Theme): PageTheme {
  const c = previewColors(t);
  return { primary: t.primary, bgType: "color", bgColor: c.page, bg: null, textColor: t.textColor || "" };
}

/** สีที่ใช้วาดหน้าฟอร์ม / Survey: ตั้งแยกไว้ → ใช้ค่านั้น · ไม่ได้ตั้ง → เหมือน Kiosk */
export function pageLook(t: Theme, page: PageKey): PageLook {
  const own = t.pages?.[page];
  const banner = t.banners?.[page]?.dataUrl; // แบนเนอร์แยกจากสี: มีได้ทั้งตอนใช้สีเดียวกับ Kiosk และตอนตั้งสีแยก
  if (!own) {
    const c = previewColors(t);
    return { primary: t.primary, bg: c.page, bgImage: c.pageImage, bgBlur: c.pageBlur, text: c.text, muted: c.muted, banner };
  }
  const bg = own.bgColor || "#FFFFFF";
  const dark = whiteTextContrast(bg) >= 4.5; // พื้นเข้ม → ตัวอักษรขาว (อัตโนมัติ)
  const text = own.textColor || (dark ? "#F8FAFC" : "#0F172A");
  return {
    primary: own.primary,
    bg,
    bgImage: own.bgType === "image" ? own.bg?.dataUrl : undefined,
    bgBlur: own.bgBlur ?? 0,
    text,
    muted: own.textColor ? alpha(own.textColor, 0.72) : dark ? "#CBD5E1" : "#64748B",
    banner,
  };
}

// ============ พื้นหลังแบบรูป + เบลอ ============
// เบลอเฉพาะรูปพื้นหลัง ไม่เบลอตัวหนังสือ: วาดรูปไว้ใน ::before (ชั้นล่างสุด) แล้วใส่ filter blur ที่ชั้นนั้น
// ใช้คู่กัน: className={BG_LAYER} + style={bgStyle(สี, รูป, เบลอ, สีตัวอักษร)} · ต้องมี overflow-hidden ที่กล่องด้วย
export const BG_LAYER =
  "relative isolate before:pointer-events-none before:absolute before:inset-0 before:-z-10 before:scale-110 before:bg-cover before:bg-center before:[background-image:var(--bg-img)] before:[filter:blur(var(--bg-blur))]";

export function bgStyle(color: string, image: string | undefined, blur: number, text: string): React.CSSProperties {
  return {
    backgroundColor: color,
    color: text,
    ["--bg-img" as string]: image ? `url(${image})` : "none",
    ["--bg-blur" as string]: `${image ? blur : 0}px`,
  };
}

/** style ของพื้นหน้า (สี + รูปพื้นหลังถ้ามี) · ใช้คู่กับ className={BG_LAYER} */
export function lookStyle(l: PageLook): React.CSSProperties {
  return bgStyle(l.bg, l.bgImage, l.bgBlur ?? 0, l.text);
}
