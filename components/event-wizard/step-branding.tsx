"use client";
// ขั้นที่ 2: Branding (เดิม Theme + โฆษณา)
// - ซ้าย: Live Preview จอ Kiosk อัปเดตทันที (ช่องรูป = โฆษณา · ไม่มีโฆษณา = รูปปก)
// - ขวา: โลโก้ · รูปภาพ [รูปปก | โฆษณา] · ธีมสำเร็จรูป 6 แบบ + Reset · ปรับแต่งเอง (สีหลัก, พื้นหลัง สี/รูป, โหมด = รอปรับปรุง)
// รูปทุกแบบเก็บเป็น data URL ใน wizard store (localStorage) — ยังไม่มี server
// ธีมตอนนี้มีผลใน Wizard (Preview) · หน้าจริง /r, /s, Kiosk ยังใช้แค่สีหลัก + โหมด (ไฟล์ของเพื่อน)

import { useRef, useState } from "react";
import { Check, Crop, ImagePlus, RotateCcw, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { KioskPreview } from "@/components/event/brand-preview";
import { useWizardStore } from "@/lib/wizard-store";
import { AD_HEIGHT, AD_WIDTH, dataUrlKB, readFileAsDataUrl, resizeToDataUrl } from "@/lib/image-crop";
import { DEFAULT_PRESET, THEME_PRESETS, applyPreset } from "@/lib/theme-presets";
import { whiteTextContrast } from "@/lib/utils/color";
import { cn } from "@/lib/utils";
import type { EventDraft } from "@/types/event";
import { AdsEditor } from "./ads-editor";
import { ColorField } from "./color-field";
import { CropDialog } from "./crop-dialog";
import { FileDrop } from "./file-drop";

type Theme = EventDraft["theme"];
type Media = "cover" | "ads";

const PRIMARY = ["#2563EB", "#7C3AED", "#0F766E", "#C2410C", "#BE185D", "#1E1B2E"];
const BG = ["#FFFFFF", "#F8FAFC", "#FEF3C7", "#E0F2FE", "#FDF2F8", "#0F172A"];
const MODES: { value: Theme["mode"]; label: string; hint: string }[] = [
  { value: "light", label: "Light", hint: "ตัวหนังสือเข้ม" },
  { value: "dark", label: "Dark", hint: "ตัวหนังสือขาว" },
  { value: "bold", label: "Bold", hint: "พื้นสีหลักเต็ม" },
];

export function StepBranding() {
  const draft = useWizardStore((s) => s.draft);
  const patch = useWizardStore((s) => s.patch);
  const t = draft.theme;
  const [media, setMedia] = useState<Media>("cover");

  // แก้สีเอง → ไม่ใช่ธีมสำเร็จรูปแล้ว
  const setTheme = (v: Partial<Theme>) => patch("theme", { ...v, preset: "" });
  const reset = () => patch("theme", { ...applyPreset(DEFAULT_PRESET), bg: null });

  return (
    <div className="grid gap-5 lg:grid-cols-[320px_minmax(0,1fr)]">
      {/* ===== Live Preview ===== */}
      {/* ช่องรูปแสดงโฆษณา (เลื่อนวน) · ไม่มีโฆษณา = แสดงรูปปกแทน */}
      <div className="h-fit space-y-3 rounded-2xl border bg-muted/40 p-4 lg:sticky lg:top-0">
        <p className="text-sm font-semibold">Live Preview · จอ Kiosk</p>
        <KioskPreview d={draft} />
      </div>

      <div className="min-w-0 space-y-5">
        {/* ===== โลโก้ (บนสุด) ===== */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              โลโก้ <span className="ml-1 text-xs font-normal text-muted-foreground">· PNG/SVG พื้นใส · ไม่ใส่ = ใช้ตัวย่อรหัสงาน</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ImageSlot
              asset={t.logo}
              accept="image/png,image/svg+xml,image/jpeg"
              hint="ย่อเหลือ 256 px"
              onPick={async (file) => {
                const url = await resizeToDataUrl(await readFileAsDataUrl(file), 256, 256, "image/png"); // โลโก้ใช้ PNG (คงพื้นใส) · ย่อเหลือ 256 px
                patch("theme", { logo: { name: file.name, sizeKB: dataUrlKB(url), dataUrl: url } });
              }}
              onRemove={() => patch("theme", { logo: null })}
              className="size-16"
              contain
            />
          </CardContent>
        </Card>

        {/* ===== รูปภาพ: รูปปก / โฆษณา ===== */}
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle className="text-base">รูปภาพ</CardTitle>
            <ToggleGroup value={[media]} onValueChange={(v) => v[0] && setMedia(v[0] as Media)} variant="outline" size="sm">
              <ToggleGroupItem value="cover">รูปปก</ToggleGroupItem>
              <ToggleGroupItem value="ads">โฆษณา</ToggleGroupItem>
            </ToggleGroup>
            </div>
          </CardHeader>
          <CardContent>{media === "cover" ? <CoverEditor /> : <AdsEditor />}</CardContent>
        </Card>

        {/* ===== ธีมสำเร็จรูป ===== */}
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle className="text-base">ธีมสำเร็จรูป</CardTitle>
            <Button variant="ghost" size="sm" onClick={reset} title="กลับเป็นธีมมินิมอล (รูปปก โฆษณา และโลโก้ไม่หาย)">
              <RotateCcw className="size-4" /> Reset
            </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
              {THEME_PRESETS.map((p) => {
                const on = t.preset === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    aria-pressed={on}
                    onClick={() => patch("theme", applyPreset(p))}
                    className={cn("space-y-1.5 text-center text-xs", on ? "font-semibold" : "text-muted-foreground")}
                  >
                    <span
                      className={cn("flex h-14 items-end gap-1 rounded-lg border p-2", on && "ring-2 ring-foreground ring-offset-2")}
                      style={{ background: p.bgColor }}
                    >
                      <span className="h-2.5 w-8 rounded" style={{ background: p.mode === "bold" ? "#FFFFFF" : p.primary }} />
                      <span className="h-2.5 w-4 rounded" style={{ background: p.secondary }} />
                      {on && <Check className="ml-auto size-4" style={{ color: p.mode === "light" ? p.primary : "#FFFFFF" }} />}
                    </span>
                    {p.name}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* ===== ปรับแต่งเอง ===== */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">ปรับแต่งเอง</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <Section title="สีหลัก" hint="ปุ่ม ป้าย กรอบ QR">
              <ColorField value={t.primary} presets={PRIMARY} onChange={(c) => setTheme({ primary: c })} label="สีหลัก" />
              {whiteTextContrast(t.primary) < 4.5 && (
                <p className="text-xs text-amber-700">ตัวหนังสือสีขาวบนสีนี้อ่านยาก ลองสีเข้มขึ้น</p>
              )}
            </Section>

            <Section title="พื้นหลัง" hint="หน้ามือถือและจอ Kiosk">
              <ToggleGroup
                value={[t.bgType]}
                onValueChange={(v) => v[0] && setTheme({ bgType: v[0] as Theme["bgType"] })}
                variant="outline"
                size="sm"
                className="justify-start"
              >
                <ToggleGroupItem value="color">สี</ToggleGroupItem>
                <ToggleGroupItem value="image">รูปภาพ</ToggleGroupItem>
              </ToggleGroup>
              {t.bgType === "color" ? (
                <ColorField value={t.bgColor || "#FFFFFF"} presets={BG} onChange={(c) => setTheme({ bgColor: c })} label="สีพื้นหลัง" />
              ) : (
                <ImageSlot
                  asset={t.bg}
                  hint="แนวตั้ง · ย่อเหลือ 1080×1920 px"
                  onPick={async (file) => {
                    const url = await resizeToDataUrl(await readFileAsDataUrl(file), 1080, 1920, "image/jpeg"); // รูปพื้นหลังใช้ JPEG (ไฟล์เล็ก)
                    setTheme({ bg: { name: file.name, sizeKB: dataUrlKB(url), dataUrl: url } });
                  }}
                  onRemove={() => setTheme({ bg: null })}
                  className="aspect-[9/16] w-24"
                />
              )}
            </Section>

            {/* โหมด: ยังกดไม่ได้ (รอปรับปรุง) — ตอนนี้โหมดเปลี่ยนได้จากธีมสำเร็จรูปเท่านั้น */}
            <Section title="โหมด" hint="รอปรับปรุง · เปลี่ยนได้จากธีมสำเร็จรูป">
              <div className="grid grid-cols-3 gap-2">
                {MODES.map((m) => (
                  <button
                    key={m.value}
                    type="button"
                    aria-pressed={t.mode === m.value}
                    disabled
                    title="รอปรับปรุง"
                    className={cn(
                      "cursor-not-allowed rounded-lg border px-3 py-2 text-left text-sm opacity-60",
                      t.mode === m.value && "border-primary bg-primary/5 font-semibold text-primary"
                    )}
                  >
                    {m.label}
                    <span className="block text-xs font-normal text-muted-foreground">{m.hint}</span>
                  </button>
                ))}
              </div>
            </Section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Section({ title, hint, children }: { title: string; hint: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2 border-b pb-5 last:border-0 last:pb-0">
      <p className="text-sm font-semibold">
        {title} <span className="ml-1 text-xs font-normal text-muted-foreground">· {hint}</span>
      </p>
      {children}
    </section>
  );
}

// ============ รูปปก 16:9 (crop ก่อนเก็บ) ============
function CoverEditor() {
  const cover = useWizardStore((s) => s.draft.general.cover);
  const patch = useWizardStore((s) => s.patch);
  const [cropping, setCropping] = useState<{ src: string; name: string } | null>(null);
  const [error, setError] = useState("");

  const pick = async (file: File) => {
    setError("");
    if (!/^image\/(png|jpeg)$/.test(file.type)) return setError("รองรับเฉพาะ JPG / PNG");
    if (file.size > 10 * 1024 * 1024) return setError("ไฟล์ใหญ่เกิน 10 MB");
    setCropping({ src: await readFileAsDataUrl(file), name: file.name });
  };

  return (
    <div className="space-y-2">
      {/* ขนาดเท่ากับแท็บโฆษณา: ช่องวางไฟล์เตี้ย + รูปที่มีแล้วแสดงเป็นแถว (รูปย่อ + ปุ่ม) */}
      {cover?.dataUrl ? (
        <div className="flex items-center gap-3 rounded-lg border bg-background p-2">
          {/* eslint-disable-next-line @next/next/no-img-element -- data URL ของรูปปกที่ crop แล้ว */}
          <img src={cover.dataUrl} alt="รูปปก" className="aspect-video w-20 shrink-0 rounded object-cover" />
          <div className="min-w-0 flex-1 text-sm">
            <p className="truncate font-semibold">{cover.name}</p>
            <p className="text-xs text-muted-foreground">{cover.sizeKB} KB · 16:9</p>
          </div>
          <Button variant="ghost" size="icon" aria-label="Crop ใหม่" onClick={() => setCropping({ src: cover.dataUrl!, name: cover.name })}>
            <Crop className="size-4" />
          </Button>
          <ReplaceButton onFile={pick} />
          <Button variant="ghost" size="icon" className="text-destructive" aria-label="ลบรูปปก" onClick={() => patch("general", { cover: null })}>
            <Trash2 className="size-4" />
          </Button>
        </div>
      ) : (
        <FileDrop title="ลากรูปปกมาวาง หรือเลือกไฟล์" hint={`16:9 · ${AD_WIDTH}×${AD_HEIGHT} px · ไม่ใส่ก็ได้`} onFile={pick} className="py-6" />
      )}
      {cover && !cover.dataUrl && <p className="text-xs text-amber-700">{cover.name} · ไม่มีไฟล์รูป อัปโหลดใหม่</p>}
      {error && <p role="alert" className="text-sm font-medium text-destructive">{error}</p>}
      <CropDialog
        title="Crop รูปปก 16:9"
        src={cropping?.src ?? null}
        fileName={cropping?.name ?? ""}
        onCancel={() => setCropping(null)}
        onDone={(url) => {
          patch("general", { cover: { name: cropping!.name, sizeKB: dataUrlKB(url), cropped: true, dataUrl: url } });
          setCropping(null);
        }}
      />
    </div>
  );
}

function ReplaceButton({ onFile }: { onFile: (f: File) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <>
      <Button variant="ghost" size="icon" aria-label="เปลี่ยนรูป" title="เปลี่ยนรูป" onClick={() => ref.current?.click()}>
        <ImagePlus className="size-4" />
      </Button>
      <input
        ref={ref}
        type="file"
        accept="image/png,image/jpeg"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
          e.target.value = "";
        }}
      />
    </>
  );
}

// ============ ช่องรูปเล็ก (โลโก้ / พื้นหลัง) ============
function ImageSlot({
  asset,
  hint,
  onPick,
  onRemove,
  className,
  accept = "image/png,image/jpeg",
  contain,
}: {
  asset: EventDraft["theme"]["logo"];
  hint: string;
  onPick: (f: File) => Promise<void>;
  onRemove: () => void;
  className?: string;
  accept?: string;
  contain?: boolean;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={() => ref.current?.click()}
        className={cn("flex shrink-0 items-center justify-center overflow-hidden rounded-lg border border-dashed bg-muted/40 text-muted-foreground", className)}
        aria-label="เลือกรูป"
      >
        {asset?.dataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- data URL
          <img src={asset.dataUrl} alt="" className={cn("size-full", contain ? "object-contain p-1" : "object-cover")} />
        ) : (
          <ImagePlus className="size-5" />
        )}
      </button>
      <div className="min-w-0 text-sm">
        <p className="truncate">{asset ? asset.name : "ยังไม่มีรูป"}</p>
        <p className="text-xs text-muted-foreground">{asset?.dataUrl ? `${asset.sizeKB} KB · ` : ""}{hint}</p>
        {error && <p className="text-xs text-destructive">{error}</p>}
        <div className="mt-1 flex gap-2">
          <Button size="sm" variant="outline" onClick={() => ref.current?.click()}>
            {asset ? "เปลี่ยน" : "อัปโหลด"}
          </Button>
          {asset && (
            <Button size="sm" variant="ghost" className="text-destructive" onClick={onRemove}>
              ลบ
            </Button>
          )}
        </div>
      </div>
      <input
        ref={ref}
        type="file"
        accept={accept}
        hidden
        onChange={async (e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (!f) return;
          setError("");
          if (f.size > 10 * 1024 * 1024) return setError("ไฟล์ใหญ่เกิน 10 MB");
          try {
            await onPick(f);
          } catch {
            setError("อ่านรูปไม่ได้ หรือพื้นที่เก็บรูปเต็ม");
          }
        }}
      />
    </div>
  );
}
