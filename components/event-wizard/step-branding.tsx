"use client";
// ขั้นที่ 2: Branding (เดิม Theme + โฆษณา)
// บนสุดเลือกหน้าที่จะแต่ง: จอ Kiosk / ฟอร์มลงทะเบียน / Survey → ด้านล่างแสดงเฉพาะส่วนของหน้านั้น
// - จอ Kiosk: Live Preview + แนวตั้ง/แนวนอน + สัดส่วนรูป 16:9 / 3:4 · โลโก้ · รูปภาพ [รูปปก | โฆษณา] · ธีมสำเร็จรูป 6 แบบ + Reset · ปรับแต่งเอง
// - ฟอร์ม / Survey: Live Preview · แบนเนอร์หัวหน้า 4:1 (แบบ Google Forms) · ปรับแต่งเอง (ตั้งสีแยก หรือใช้สีเดียวกับ Kiosk)
// ปรับแต่งเอง = สีหลัก, สีตัวอักษร, พื้นหลัง สี/รูป (custom-colors.tsx) · โหมด (Light/Dark/Bold) มาจากธีมสำเร็จรูปเท่านั้น
// รูปทุกแบบเก็บเป็น data URL ใน wizard store (localStorage) — ยังไม่มี server
// ธีมตอนนี้มีผลใน Wizard (Preview) · หน้าจริง /r, /s, Kiosk ยังใช้แค่สีหลัก + โหมด (ไฟล์ของเพื่อน)

import { useRef, useState } from "react";
import { Check, ClipboardList, Crop, FileText, ImagePlus, MonitorSmartphone, RotateCcw, Trash2 } from "lucide-react";
import { FormPreview } from "@/components/event/form-preview";
import { SurveyPreview } from "@/components/event/survey-preview";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { KioskPreview } from "@/components/event/brand-preview";
import { useWizardStore } from "@/lib/wizard-store";
import { MEDIA_SIZE, dataUrlKB, mediaRatioOf, readFileAsDataUrl, resizeToDataUrl } from "@/lib/image-crop";
import { ImageSlot } from "./image-slot";
import { DEFAULT_PRESET, THEME_PRESETS, applyPreset, pageLook, type PageKey } from "@/lib/theme-presets";
import { eventTypeLabel } from "@/lib/event-types";
import { cn } from "@/lib/utils";
import type { EventDraft, MediaRatio } from "@/types/event";
import { AdsEditor } from "./ads-editor";
import { CustomColors, type ColorTarget } from "./custom-colors";
import { CropDialog } from "./crop-dialog";
import { FileDrop } from "./file-drop";
import { WizardSection } from "./wizard-section";

type Theme = EventDraft["theme"];
type Media = "cover" | "ads";

const TARGETS: { value: ColorTarget; label: string; hint: string; icon: typeof FileText }[] = [
  { value: "kiosk", label: "จอ Kiosk", hint: "โลโก้ รูปปก โฆษณา ธีม สี", icon: MonitorSmartphone },
  { value: "form", label: "ฟอร์มลงทะเบียน", hint: "แบนเนอร์ สี", icon: FileText },
  { value: "survey", label: "Survey", hint: "แบนเนอร์ สี", icon: ClipboardList },
];

export function StepBranding() {
  const draft = useWizardStore((s) => s.draft);
  const patch = useWizardStore((s) => s.patch);
  const t = draft.theme;
  const [media, setMedia] = useState<Media>("cover");
  const landscape = t.kiosk === "landscape";
  const ratio = mediaRatioOf(t); // สัดส่วนที่ใช้ crop รูปปก / โฆษณา ตอนนี้
  const [target, setTarget] = useState<ColorTarget>("kiosk"); // หน้าที่กำลังแต่ง (เลือกที่บนสุด)
  const current = TARGETS.find((x) => x.value === target)!;

  // Reset = ธีมมินิมอล + ล้างสีที่ตั้งแยกของฟอร์ม / Survey (รูปปก โฆษณา โลโก้ แบนเนอร์ไม่หาย)
  const reset = () => patch("theme", { ...applyPreset(DEFAULT_PRESET), bg: null, pages: {} });

  return (
    <>
      {/* ===== เลือกหน้าที่จะแต่ง (บนสุด) ===== */}
      <WizardSection title="แต่งหน้าไหน" description="เลือกแล้วด้านล่างจะแสดงเฉพาะการตั้งค่าของหน้านั้น">
        <div className="grid gap-2 sm:grid-cols-3">
          {TARGETS.map((x) => (
            <button
              key={x.value}
              type="button"
              aria-pressed={target === x.value}
              onClick={() => setTarget(x.value)}
              className={cn(
                "flex items-center gap-3 rounded-xl border p-3 text-left transition hover:border-foreground/30 hover:bg-foreground/5",
                target === x.value && "border-foreground bg-foreground text-background hover:bg-foreground/90"
              )}
            >
              <x.icon className="size-5 shrink-0" />
              <span className="min-w-0">
                <span className="block text-sm font-semibold">{x.label}</span>
                <span className={cn("block text-xs", target === x.value ? "text-background/70" : "text-muted-foreground")}>{x.hint}</span>
              </span>
            </button>
          ))}
        </div>
      </WizardSection>

      {/* ===== Live Preview ของหน้าที่เลือก ===== */}
      {/* Kiosk: ช่องรูปแสดงโฆษณา (เลื่อนวน) · ไม่มีโฆษณา = แสดงรูปปกแทน */}
      <WizardSection title={`Live Preview · ${current.label}`} description="อัปเดตทันทีที่แก้ด้านล่าง">
        {target === "kiosk" ? (
          <div className={cn("mx-auto w-full", landscape ? "max-w-2xl" : "max-w-xs")}>
            <KioskPreview d={draft} />
          </div>
        ) : target === "form" ? (
          <FormPreview fields={draft.form.fields} primary={t.primary} eventName={draft.general.nameTh} look={pageLook(t, "form")} />
        ) : (
          <SurveyPreview
            questions={draft.survey.questions}
            lang="th"
            primary={t.primary}
            title={`แบบประเมินงาน ${eventTypeLabel(draft.general.type, draft.general.typeOther)}`}
            look={pageLook(t, "survey")}
          />
        )}
        {/* แนวตั้ง / แนวนอน + สัดส่วนรูปปก / โฆษณา (เลือกได้ทั้ง 2 แนว) · เฉพาะจอ Kiosk */}
        {target === "kiosk" && (
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3 rounded-xl bg-muted/60 px-4 py-3 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">จอ Kiosk</span>
              <ToggleGroup
                value={[t.kiosk ?? "portrait"]}
                onValueChange={(v) => v[0] && patch("theme", { kiosk: v[0] as Theme["kiosk"] })}
                variant="outline"
                size="sm"
              >
                <ToggleGroupItem value="portrait">แนวตั้ง</ToggleGroupItem>
                <ToggleGroupItem value="landscape">แนวนอน</ToggleGroupItem>
              </ToggleGroup>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">สัดส่วนรูปปก / โฆษณา</span>
              <ToggleGroup
                value={[ratio]}
                onValueChange={(v) => v[0] && patch("theme", { mediaRatio: v[0] as MediaRatio })}
                variant="outline"
                size="sm"
              >
                <ToggleGroupItem value="16:9">16:9</ToggleGroupItem>
                <ToggleGroupItem value="3:4">3:4</ToggleGroupItem>
              </ToggleGroup>
            </div>
            <p className="w-full text-xs text-muted-foreground">
              ตอนนี้มีผลกับ Preview ใน Wizard · จอ Kiosk จริงต้องรอเพื่อนรองรับแนวนอน / รูป 3:4
            </p>
          </div>
        )}
      </WizardSection>

      {target === "kiosk" ? (
        <>
  
        {/* ===== โลโก้ ===== */}
        <WizardSection title="โลโก้" description="PNG/SVG พื้นใส · ไม่ใส่ = ใช้ตัวย่อรหัสงาน">
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
        </WizardSection>
  
        {/* ===== รูปภาพ: รูปปก / โฆษณา ===== */}
        <WizardSection
          title="รูปภาพ"
          action={
            <ToggleGroup value={[media]} onValueChange={(v) => v[0] && setMedia(v[0] as Media)} variant="outline" size="sm">
              <ToggleGroupItem value="cover">รูปปก</ToggleGroupItem>
              <ToggleGroupItem value="ads">โฆษณา</ToggleGroupItem>
            </ToggleGroup>
          }
        >
          {media === "cover" ? <CoverEditor /> : <AdsEditor />}
        </WizardSection>
  
        {/* ===== ธีมสำเร็จรูป ===== */}
        <WizardSection
          title="ธีมสำเร็จรูป"
          action={
            <Button variant="ghost" size="sm" onClick={reset} title="กลับเป็นธีมมินิมอล + ฟอร์ม / Survey ใช้สีเดียวกับ Kiosk (รูปปก โฆษณา และโลโก้ไม่หาย)">
              <RotateCcw className="size-4" /> Reset
            </Button>
          }
        >
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
        </WizardSection>
        </>
      ) : (
        // ===== ฟอร์ม / Survey: แบนเนอร์หัวหน้า แบบ Google Forms =====
        <WizardSection title="แบนเนอร์" description={`รูปแนวนอน 4:1 ด้านบนหน้า${current.label} แบบ Google Forms · ไม่ใส่ = ไม่มีแบนเนอร์`}>
          <BannerEditor key={target} page={target} />
        </WizardSection>
      )}

      {/* ===== ปรับแต่งเอง (ของหน้าที่เลือก) ===== */}
      <WizardSection
        title="ปรับแต่งเอง"
        description={target === "kiosk" ? "สีของจอ Kiosk และหน้า Event" : `ตั้งสีหน้า${current.label}แยก หรือใช้สีเดียวกับ Kiosk`}
      >
        <CustomColors target={target} />
      </WizardSection>
    </>
  );
}

// ============ รูปปก 16:9 (crop ก่อนเก็บ) ============
function CoverEditor() {
  const cover = useWizardStore((s) => s.draft.general.cover);
  const ratio = useWizardStore((s) => mediaRatioOf(s.draft.theme)); // 16:9 หรือ 3:4
  const patch = useWizardStore((s) => s.patch);
  const size = MEDIA_SIZE[ratio];
  const coverRatio = cover?.ratio ?? "16:9"; // รูปเก่าไม่มีค่านี้ = 16:9
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
          <img src={cover.dataUrl} alt="รูปปก" className={cn("w-20 shrink-0 rounded object-cover", coverRatio === "3:4" ? "aspect-[3/4] w-14" : "aspect-video")} />
          <div className="min-w-0 flex-1 text-sm">
            <p className="truncate font-semibold">{cover.name}</p>
            <p className="text-xs text-muted-foreground">{cover.sizeKB} KB · {coverRatio}</p>
            {coverRatio !== ratio && <p className="text-xs text-amber-700">รูปนี้เป็น {coverRatio} · กด Crop ใหม่ให้เป็น {ratio}</p>}
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
        <FileDrop title="ลากรูปปกมาวาง หรือเลือกไฟล์" hint={`${ratio} · ${size.w}×${size.h} px · ไม่ใส่ก็ได้`} onFile={pick} className="py-6" />
      )}
      {cover && !cover.dataUrl && <p className="text-xs text-amber-700">{cover.name} · ไม่มีไฟล์รูป อัปโหลดใหม่</p>}
      {error && <p role="alert" className="text-sm font-medium text-destructive">{error}</p>}
      <CropDialog
        title={`Crop รูปปก ${ratio}`}
        ratio={ratio}
        src={cropping?.src ?? null}
        fileName={cropping?.name ?? ""}
        onCancel={() => setCropping(null)}
        onDone={(url) => {
          patch("general", { cover: { name: cropping!.name, sizeKB: dataUrlKB(url), cropped: true, ratio, dataUrl: url } });
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

// ============ แบนเนอร์หัวฟอร์ม / Survey 4:1 (crop ก่อนเก็บ · 1600 × 400 px) ============
function BannerEditor({ page }: { page: PageKey }) {
  const banners = useWizardStore((s) => s.draft.theme.banners);
  const patch = useWizardStore((s) => s.patch);
  const banner = banners?.[page] ?? null;
  const [cropping, setCropping] = useState<{ src: string; name: string } | null>(null);
  const [error, setError] = useState("");
  const size = MEDIA_SIZE["4:1"];
  const save = (next: EventDraft["general"]["cover"]) => patch("theme", { banners: { ...banners, [page]: next } });

  const pick = async (file: File) => {
    setError("");
    if (!/^image\/(png|jpeg)$/.test(file.type)) return setError("รองรับเฉพาะ JPG / PNG");
    if (file.size > 10 * 1024 * 1024) return setError("ไฟล์ใหญ่เกิน 10 MB");
    setCropping({ src: await readFileAsDataUrl(file), name: file.name });
  };

  return (
    <div className="space-y-2">
      {banner?.dataUrl ? (
        <div className="flex items-center gap-3 rounded-lg border bg-background p-2">
          {/* eslint-disable-next-line @next/next/no-img-element -- data URL ของแบนเนอร์ที่ crop แล้ว */}
          <img src={banner.dataUrl} alt="แบนเนอร์" className="aspect-[4/1] w-32 shrink-0 rounded object-cover" />
          <div className="min-w-0 flex-1 text-sm">
            <p className="truncate font-semibold">{banner.name}</p>
            <p className="text-xs text-muted-foreground">{banner.sizeKB} KB · 4:1</p>
          </div>
          <Button variant="ghost" size="icon" aria-label="Crop ใหม่" onClick={() => setCropping({ src: banner.dataUrl!, name: banner.name })}>
            <Crop className="size-4" />
          </Button>
          <ReplaceButton onFile={pick} />
          <Button variant="ghost" size="icon" className="text-destructive" aria-label="ลบแบนเนอร์" onClick={() => save(null)}>
            <Trash2 className="size-4" />
          </Button>
        </div>
      ) : (
        <FileDrop title="ลากรูปแบนเนอร์มาวาง หรือเลือกไฟล์" hint={`4:1 · ${size.w}×${size.h} px · ไม่ใส่ก็ได้`} onFile={pick} className="py-6" />
      )}
      {error && <p role="alert" className="text-sm font-medium text-destructive">{error}</p>}
      <CropDialog
        title="Crop แบนเนอร์ 4:1"
        ratio="4:1"
        src={cropping?.src ?? null}
        fileName={cropping?.name ?? ""}
        onCancel={() => setCropping(null)}
        onDone={(url) => {
          save({ name: cropping!.name, sizeKB: dataUrlKB(url), cropped: true, ratio: "4:1", dataUrl: url });
          setCropping(null);
        }}
      />
    </div>
  );
}
