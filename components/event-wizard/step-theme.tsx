"use client";

import { useState } from "react";
import { Check } from "lucide-react";
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

  // ช่อง HEX: พิมพ์เองได้ ใช้ค่าเมื่อเป็น #RRGGBB ที่ถูกต้อง
  // hexDraft = ข้อความที่กำลังพิมพ์ (null = แสดงสีหลักปัจจุบัน) ไม่ต้องใช้ useEffect sync
  const [hexDraft, setHexDraft] = useState<string | null>(null);
  const hex = hexDraft ?? t.primary;
  const pickColor = (c: string) => {
    setHexDraft(null);
    set({ primary: c });
  };
  const onHex = (v: string) => {
    const val = (v.startsWith("#") ? v : `#${v}`).toUpperCase();
    setHexDraft(val);
    if (/^#[0-9A-F]{6}$/.test(val)) set({ primary: val });
  };

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Card>
        <CardContent className="space-y-6 pt-6">
          <section className="space-y-2">
            <p className="text-sm font-semibold">สีหลัก</p>
            <div className="flex items-center gap-2">
              {PRIMARY.map((c) => (
                <button
                  key={c}
                  type="button"
                  aria-label={c}
                  onClick={() => pickColor(c)}
                  style={{ backgroundColor: c }}
                  className={cn("flex size-8 items-center justify-center rounded-lg ring-offset-2", t.primary === c && "ring-2 ring-foreground")}
                >
                  {t.primary === c && <Check className="size-4 text-white" />}
                </button>
              ))}
              <Input
                value={hex}
                onChange={(e) => onHex(e.target.value)}
                onBlur={() => setHexDraft(null)}
                maxLength={7}
                aria-label="HEX"
                aria-invalid={!/^#[0-9A-F]{6}$/i.test(hex)}
                className="ml-2 h-8 w-28 font-mono"
              />
            </div>
            <p className={cn("text-xs", contrastOk ? "text-emerald-700" : "text-amber-700")}>
              {contrastOk ? "✓ ตัวหนังสือสีขาวบนสีนี้อ่านง่าย (ผ่านมาตรฐาน contrast)" : "! ตัวหนังสือสีขาวบนสีนี้อ่านยาก ลองเลือกสีเข้มขึ้น"}
            </p>
          </section>

          <section className="space-y-2">
            <p className="text-sm font-semibold">สีรอง</p>
            <div className="flex gap-2">
              {SECONDARY.map((c) => (
                <button
                  key={c}
                  type="button"
                  aria-label={c}
                  onClick={() => set({ secondary: c })}
                  style={{ backgroundColor: c }}
                  className={cn("size-8 rounded-full border ring-offset-2", t.secondary === c && "ring-2 ring-foreground")}
                />
              ))}
            </div>
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
