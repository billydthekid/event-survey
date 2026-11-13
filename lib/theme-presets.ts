// lib/theme-presets.ts
// ธีมสำเร็จรูปของ Branding (Wizard ขั้นที่ 2) + ค่าสีที่ใช้วาด Preview
// กดธีม = ตั้ง สีหลัก / โทนอ่อน / พื้นหลัง / โหมด ทีเดียวทั้งชุด · "Reset" = กลับเป็นธีมแรก (มินิมอล)
import type { EventDraft } from "@/types/event";

type Theme = EventDraft["theme"];

export interface ThemePreset {
  id: string;
  name: string;
  primary: string;
  secondary: string;
  bgColor: string;
  mode: Theme["mode"];
}

// สีหลักทุกธีมผ่าน contrast ≥ 4.5 กับตัวหนังสือสีขาว (ไม่ขึ้นคำเตือนเอง)
export const THEME_PRESETS: ThemePreset[] = [
  { id: "minimal", name: "มินิมอล", primary: "#2563EB", secondary: "#DBEAFE", bgColor: "#FFFFFF", mode: "light" },
  { id: "sky", name: "ฟ้าใส", primary: "#0369A1", secondary: "#BAE6FD", bgColor: "#E0F2FE", mode: "light" },
  { id: "pastel", name: "พาสเทล", primary: "#DB2777", secondary: "#FBCFE8", bgColor: "#FDF2F8", mode: "light" },
  { id: "nature", name: "ธรรมชาติ", primary: "#0F766E", secondary: "#BBF7D0", bgColor: "#F0FDF4", mode: "light" },
  { id: "night", name: "กลางคืน", primary: "#7C3AED", secondary: "#1E293B", bgColor: "#0F172A", mode: "dark" },
  { id: "vivid", name: "สดใส", primary: "#C2410C", secondary: "#FED7AA", bgColor: "#C2410C", mode: "bold" },
];

export const DEFAULT_PRESET = THEME_PRESETS[0];

/** ค่าธีมเมื่อเลือกธีมสำเร็จรูป (รูปพื้นหลัง → กลับเป็นสี · โลโก้คงไว้) */
export function applyPreset(p: ThemePreset): Partial<Theme> {
  return { primary: p.primary, secondary: p.secondary, bgColor: p.bgColor, mode: p.mode, bgType: "color", preset: p.id };
}

// ============ สีที่ใช้วาด Preview (มือถือ / Kiosk) ============
export interface PreviewColors {
  page: string; // พื้นหลังทั้งหน้า (สี) — ถ้ามีรูปพื้นหลังจะวางรูปทับ
  pageImage?: string;
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
    text: onDark ? "#F8FAFC" : "#0F172A",
    muted: onDark ? "#CBD5E1" : "#64748B",
    button: t.mode === "bold" ? { bg: "#FFFFFF", text: t.primary } : { bg: t.primary, text: "#FFFFFF" },
    chip: onDark ? { bg: "rgba(255,255,255,0.15)", text: "#F8FAFC" } : { bg: t.secondary, text: t.primary },
    coverBg: t.secondary,
  };
}
