"use client";
// ช่องเลือกสี: ถาดสีสำเร็จรูป + ตัวเลือกสีอิสระ (color picker) + พิมพ์ HEX — ใช้ในขั้น Branding

import { useState } from "react";
import { Check, Pipette } from "lucide-react";
import { Input } from "@/components/ui/input";
import { whiteTextContrast } from "@/lib/utils/color";
import { cn } from "@/lib/utils";

// ============ เลือกสี: ถาดสีสำเร็จรูป + ตัวเลือกสีอิสระ (color picker) + พิมพ์ HEX ============
// เก็บเป็นข้อความ HEX "#RRGGBB" ใน theme.primary / theme.secondary
export function ColorField({
  value,
  presets,
  onChange,
  label,
}: {
  value: string;
  presets: readonly string[];
  onChange: (hex: string) => void;
  label: string;
}) {
  // hexDraft = ข้อความที่กำลังพิมพ์ (null = แสดงค่าปัจจุบัน) · ใช้ค่าเมื่อเป็น #RRGGBB ที่ถูกต้องเท่านั้น
  const [hexDraft, setHexDraft] = useState<string | null>(null);
  const hex = hexDraft ?? value;
  const pick = (c: string) => {
    setHexDraft(null);
    onChange(c.toUpperCase());
  };
  const onHex = (v: string) => {
    const val = (v.startsWith("#") ? v : `#${v}`).toUpperCase();
    setHexDraft(val);
    if (/^#[0-9A-F]{6}$/.test(val)) onChange(val); // ตรวจ HEX ถ้าเป็น #RRGGBB → ส่งกลับ
  };
  const custom = !presets.some((c) => c.toUpperCase() === value.toUpperCase());

  return (
    <div className="flex flex-wrap items-center gap-2">
      {presets.map((c) => {
        const on = c.toUpperCase() === value.toUpperCase();
        return (
          <button
            key={c}
            type="button"
            aria-label={`${label} ${c}`}
            aria-pressed={on}
            onClick={() => pick(c)}
            style={{ backgroundColor: c }}
            className={cn("flex size-8 items-center justify-center rounded-lg border ring-offset-2", on && "ring-2 ring-foreground")}
          >
            {on && <Check className={cn("size-4", whiteTextContrast(c) >= 3 ? "text-white" : "text-slate-900")} />}
          </button>
        );
      })}
      {/* ตัวเลือกสีของเบราว์เซอร์ — กดแล้วเปิดถาดสีเต็ม */}
      <label
        title="เลือกสีเอง"
        className={cn(
          "relative flex size-8 cursor-pointer items-center justify-center rounded-lg border ring-offset-2",
          custom && "ring-2 ring-foreground"
        )}
        style={{ background: custom ? value : "conic-gradient(red, yellow, lime, aqua, blue, magenta, red)" }}
      >
        <Pipette className={cn("size-4", custom ? (whiteTextContrast(value) >= 3 ? "text-white" : "text-slate-900") : "text-white")} />
        <input
          type="color" // ตัวเลือกสีของเบราว์เซอร์ ถาดเลือกสี
          value={/^#[0-9A-F]{6}$/i.test(value) ? value : "#000000"}
          onChange={(e) => pick(e.target.value)}
          aria-label={`${label} เลือกสีเอง`}
          className="absolute inset-0 cursor-pointer opacity-0"
        />
      </label>
      <Input
        value={hex}
        onChange={(e) => onHex(e.target.value)}
        onBlur={() => setHexDraft(null)}
        maxLength={7}
        aria-label={`${label} HEX`}
        aria-invalid={!/^#[0-9A-F]{6}$/i.test(hex)}
        className="ml-1 h-8 w-28 font-mono"
      />
    </div>
  );
}
