// ฟ้าใส: lib/theme-presets.ts
// ฟ้าใส: ธีมสำเร็จรูปของ Branding (Wizard ขั้นที่ 2) + ค่าสีที่ใช้วาด Preview
// ฟ้าใส: กดธีม = ตั้ง สีหลัก / โทนอ่อน / พื้นหลัง / โหมด ทีเดียวทั้งชุด · "Reset" = กลับเป็นธีมแรก (มินิมอล)
import type { EventDraft, PageTheme } from "@/types/event";
import { whiteTextContrast } from "@/lib/utils/color";

// ฟ้าใส: ชนิดของธีมใน Event
type Theme = EventDraft["theme"];

// ฟ้าใส: ข้อมูลของธีมสำเร็จรูป 1 แบบ
export interface ThemePreset {
  id: string;
  name: string;
  nameEn: string;
  primary: string;
  secondary: string;
  bgColor: string;
  mode: Theme["mode"];
}

// ฟ้าใส: สีหลักทุกธีมผ่าน contrast ≥ 4.5 กับตัวหนังสือสีขาว (ไม่ขึ้นคำเตือนเอง)
export const THEME_PRESETS: ThemePreset[] = [
  { id: "minimal", name: "มินิมอล", nameEn: "Minimal", primary: "#2563EB", secondary: "#DBEAFE", bgColor: "#FFFFFF", mode: "light" },
  { id: "sky", name: "ฟ้าใส", nameEn: "Sky", primary: "#0369A1", secondary: "#BAE6FD", bgColor: "#E0F2FE", mode: "light" },
  { id: "pastel", name: "พาสเทล", nameEn: "Pastel", primary: "#DB2777", secondary: "#FBCFE8", bgColor: "#FDF2F8", mode: "light" },
  { id: "nature", name: "ธรรมชาติ", nameEn: "Nature", primary: "#0F766E", secondary: "#BBF7D0", bgColor: "#F0FDF4", mode: "light" },
  { id: "night", name: "กลางคืน", nameEn: "Night", primary: "#7C3AED", secondary: "#1E293B", bgColor: "#0F172A", mode: "dark" },
  { id: "vivid", name: "สดใส", nameEn: "Vivid", primary: "#C2410C", secondary: "#FED7AA", bgColor: "#C2410C", mode: "bold" },
];

// ฟ้าใส: ธีมตั้งต้น = มินิมอล
export const DEFAULT_PRESET = THEME_PRESETS[0];

/** ฟ้าใส: ค่าธีมเมื่อเลือกธีมสำเร็จรูป (รูปพื้นหลัง → กลับเป็นสี · สีตัวอักษร → อัตโนมัติ · โลโก้ / สีของฟอร์ม-Survey ที่ตั้งแยกคงไว้) */
export function applyPreset(p: ThemePreset): Partial<Theme> {
  return { primary: p.primary, secondary: p.secondary, bgColor: p.bgColor, mode: p.mode, bgType: "color", preset: p.id, textColor: "" };
}

/** ฟ้าใส: ใส่ความโปร่งใสให้สี HEX (#RRGGBB) เช่น ใช้ทำสีตัวอักษรรอง */
const alpha = (hex: string, a: number) => (/^#[0-9a-f]{6}$/i.test(hex) ? hex + Math.round(a * 255).toString(16).padStart(2, "0") : hex);

// ฟ้าใส: ============ สีที่ใช้วาด Preview (มือถือ / Kiosk) ============
export interface PreviewColors {
  page: string; // ฟ้าใส: พื้นหลังทั้งหน้า (สี) — ถ้ามีรูปพื้นหลังจะวางรูปทับ
  pageImage?: string;
  pageBlur: number; // ฟ้าใส: เบลอรูปพื้นหลัง (px)
  text: string;
  muted: string;
  button: { bg: string; text: string };
  chip: { bg: string; text: string };
  coverBg: string; // ฟ้าใส: พื้นช่องรูปปกตอนยังไม่มีรูป
}

// ฟ้าใส: คำนวณสีที่ใช้วาด Preview จากธีม
export function previewColors(t: Theme): PreviewColors {
  // ฟ้าใส: สีพื้น (ไม่ได้ตั้ง = ขาว)
  const bg = t.bgColor || "#FFFFFF";
  // ฟ้าใส: โหมดเข้ม / Bold → ตัวหนังสือขาว
  const onDark = t.mode === "dark" || t.mode === "bold";
  return {
    page: t.mode === "bold" && !t.bgColor ? t.primary : bg,
    pageImage: t.bgType === "image" ? t.bg?.dataUrl : undefined,
    pageBlur: t.bgBlur ?? 0,
    // ฟ้าใส: ตั้งสีตัวอักษรเอง → ใช้สีนั้น (ตัวรอง = สีเดียวกันจางลง) · ไม่ตั้ง = อัตโนมัติตามโหมด
    text: t.textColor || (onDark ? "#F8FAFC" : "#0F172A"),
    muted: t.textColor ? alpha(t.textColor, 0.72) : onDark ? "#CBD5E1" : "#64748B",
    button: t.mode === "bold" ? { bg: "#FFFFFF", text: t.primary } : { bg: t.primary, text: "#FFFFFF" },
    chip: onDark ? { bg: "rgba(255,255,255,0.15)", text: "#F8FAFC" } : { bg: t.secondary, text: t.primary },
    coverBg: t.secondary,
  };
}

// ฟ้าใส: ============ สีของหน้าฟอร์ม / Survey ============
export type PageKey = "form" | "survey";

// ฟ้าใส: สีของหน้าฟอร์ม / Survey ที่ใช้วาด
export interface PageLook {
  primary: string;
  bg: string;
  bgImage?: string;
  bgBlur?: number; // ฟ้าใส: เบลอรูปพื้นหลัง (px)
  text: string;
  muted: string;
  banner?: string; // ฟ้าใส: แบนเนอร์หัวหน้า (data URL · 4:1) · ไม่มี = ไม่แสดง
}

/** ฟ้าใส: ค่าเริ่มต้นตอนเปิด "ตั้งสีแยก" = คัดลอกจาก Kiosk (รูปพื้นหลัง Kiosk ไม่คัดลอก เพราะคนละแนว) */
export function pageThemeFromKiosk(t: Theme): PageTheme {
  // ฟ้าใส: สีของ Kiosk
  const c = previewColors(t);
  return { primary: t.primary, bgType: "color", bgColor: c.page, bg: null, textColor: t.textColor || "" };
}

/** ฟ้าใส: สีที่ใช้วาดหน้าฟอร์ม / Survey: ตั้งแยกไว้ → ใช้ค่านั้น · ไม่ได้ตั้ง → เหมือน Kiosk */
export function pageLook(t: Theme, page: PageKey): PageLook {
  // ฟ้าใส: สีที่ตั้งแยกของหน้านี้ (ไม่มี = ใช้ของ Kiosk)
  const own = t.pages?.[page];
  const banner = t.banners?.[page]?.dataUrl; // ฟ้าใส: แบนเนอร์แยกจากสี: มีได้ทั้งตอนใช้สีเดียวกับ Kiosk และตอนตั้งสีแยก
  // ฟ้าใส: ไม่ได้ตั้งแยก → ใช้สีเดียวกับ Kiosk
  if (!own) {
    // ฟ้าใส: สีของ Kiosk
    const c = previewColors(t);
    return { primary: t.primary, bg: c.page, bgImage: c.pageImage, bgBlur: c.pageBlur, text: c.text, muted: c.muted, banner };
  }
  // ฟ้าใส: สีพื้นของหน้านี้
  const bg = own.bgColor || "#FFFFFF";
  const dark = whiteTextContrast(bg) >= 4.5; // ฟ้าใส: พื้นเข้ม → ตัวอักษรขาว (อัตโนมัติ)
  // ฟ้าใส: สีตัวอักษร: ตั้งเอง หรืออัตโนมัติตามความเข้มของพื้น
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

// ฟ้าใส: ============ พื้นหลังแบบรูป + เบลอ ============
// ฟ้าใส: เบลอเฉพาะรูปพื้นหลัง ไม่เบลอตัวหนังสือ: วาดรูปไว้ใน ::before (ชั้นล่างสุด) แล้วใส่ filter blur ที่ชั้นนั้น
// ฟ้าใส: ใช้คู่กัน: className={BG_LAYER} + style={bgStyle(สี, รูป, เบลอ, สีตัวอักษร)} · ต้องมี overflow-hidden ที่กล่องด้วย
export const BG_LAYER =
  "relative isolate before:pointer-events-none before:absolute before:inset-0 before:-z-10 before:scale-110 before:bg-cover before:bg-center before:[background-image:var(--bg-img)] before:[filter:blur(var(--bg-blur))]";

// ฟ้าใส: สร้าง style พื้นหน้า: สีพื้น สีตัวอักษร และตัวแปรรูป / เบลอ ให้ชั้น ::before
export function bgStyle(color: string, image: string | undefined, blur: number, text: string): React.CSSProperties {
  return {
    backgroundColor: color,
    color: text,
    ["--bg-img" as string]: image ? `url(${image})` : "none",
    ["--bg-blur" as string]: `${image ? blur : 0}px`,
  };
}

/** ฟ้าใส: style ของพื้นหน้า (สี + รูปพื้นหลังถ้ามี) · ใช้คู่กับ className={BG_LAYER} */
export function lookStyle(l: PageLook): React.CSSProperties {
  return bgStyle(l.bg, l.bgImage, l.bgBlur ?? 0, l.text);
}
