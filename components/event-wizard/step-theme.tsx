"use client";

import { useState } from "react";
import { Check, Pipette } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useWizardStore } from "@/lib/wizard-store";
import { whiteTextContrast } from "@/lib/utils/color";
import { cn } from "@/lib/utils";
import { FileDrop } from "./file-drop";

const PRIMARY = ["#2563EB", "#7C3AED", "#0F766E", "#C2410C", "#BE185D", "#1E1B2E"];
const SECONDARY = ["#EDE9FE", "#DBEAFE", "#FEF3C7", "#F1F5F9"];
const MODES = [
  { value: "light", label: "Light", preview: "bg-slate-100" },
  { value: "dark", label: "Dark", preview: "bg-slate-900" },
  { value: "bold", label: "Bold", preview: "bg-violet-600" },
] as const;

export function StepTheme() {
  const t = useWizardStore((s) => s.draft.theme);
  const patch = useWizardStore((s) => s.patch);
  const set = (v: Partial<typeof t>) => patch("theme", v);
  const contrastOk = whiteTextContrast(t.primary) >= 4.5;

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Card>
        <CardContent className="space-y-6 pt-6">
          <section className="space-y-2">
            <p className="text-sm font-semibold">สีหลัก</p>
            <ColorField value={t.primary} presets={PRIMARY} onChange={(c) => set({ primary: c })} label="สีหลัก" />
            <p className={cn("text-xs", contrastOk ? "text-emerald-700" : "text-amber-700")}>
              {contrastOk ? "✓ ตัวหนังสือสีขาวบนสีนี้อ่านง่าย (ผ่านมาตรฐาน contrast)" : "! ตัวหนังสือสีขาวบนสีนี้อ่านยาก ลองเลือกสีเข้มขึ้น"}
            </p>
          </section>

          <section className="space-y-2">
            <p className="text-sm font-semibold">สีรอง</p>
            <ColorField value={t.secondary} presets={SECONDARY} onChange={(c) => set({ secondary: c })} label="สีรอง" />
          </section>

          <section className="space-y-2">
            <p className="text-sm font-semibold">ประเภท Theme</p>
            <div className="grid grid-cols-3 gap-3">
              {MODES.map((m) => (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => set({ mode: m.value })}
                  className={cn("rounded-xl border p-2 text-left text-sm", t.mode === m.value && "border-primary ring-2 ring-primary")}
                >
                  <div className={cn("mb-2 h-8 rounded-md", m.preview)} />
                  <span className={cn(t.mode === m.value && "font-semibold")}>{m.label}</span>
                </button>
              ))}
            </div>
          </section>
        </CardContent>
      </Card>

      <div className="space-y-5">
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Background</CardTitle>
            <ToggleGroup value={[t.bgType]} onValueChange={(v) => v[0] && set({ bgType: v[0] as "color" | "image" })} variant="outline" size="sm">
              <ToggleGroupItem value="color">สี</ToggleGroupItem>
              <ToggleGroupItem value="image">รูปภาพ</ToggleGroupItem>
            </ToggleGroup>
          </CardHeader>
          <CardContent>
            {t.bgType === "image" ? (
              t.bg ? (
                <div className="flex items-center gap-3 rounded-lg border p-3">
                  <div className="size-8 rounded bg-primary/10" />
                  <div className="flex-1 text-sm">
                    <p className="font-semibold">{t.bg.name}</p>
                    <p className="text-xs text-muted-foreground">{t.bg.sizeKB} KB</p>
                  </div>
                  <Button variant="secondary" size="sm" onClick={() => set({ bg: null })}>เปลี่ยน</Button>
                </div>
              ) : (
                <FileDrop title="อัปโหลดรูป Background" hint="แนะนำ 1080×1920" onPick={(a) => set({ bg: a })} />
              )
            ) : (
              <p className="text-sm text-muted-foreground">ใช้สีรองเป็นพื้นหลัง</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Logo</CardTitle>
          </CardHeader>
          <CardContent>
            {t.logo ? (
              <div className="flex items-center gap-3 rounded-lg border p-3 text-sm">
                <span className="flex-1 font-semibold">{t.logo.name}</span>
                <Button variant="secondary" size="sm" onClick={() => set({ logo: null })}>ลบ</Button>
              </div>
            ) : (
              <FileDrop title="อัปโหลด Logo · PNG/SVG พื้นใส" accept="image/png,image/svg+xml" onPick={(a) => set({ logo: a })} />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ============ เลือกสี: ถาดสีสำเร็จรูป + ตัวเลือกสีอิสระ (color picker) + พิมพ์ HEX ============
// เก็บเป็นข้อความ HEX "#RRGGBB" ใน theme.primary / theme.secondary
function ColorField({
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
    if (/^#[0-9A-F]{6}$/.test(val)) onChange(val);
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
          type="color"
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
