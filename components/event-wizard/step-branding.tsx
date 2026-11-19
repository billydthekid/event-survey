"use client";
// ฟ้าใส: ขั้นที่ 2: Branding (เดิม Theme + โฆษณา)
// ฟ้าใส: บนสุดเลือกหน้าที่จะแต่ง: จอ Kiosk / ฟอร์มลงทะเบียน / Survey → ด้านล่างแสดงเฉพาะส่วนของหน้านั้น
// ฟ้าใส: - จอ Kiosk: Live Preview + แนวตั้ง/แนวนอน + สัดส่วนรูป 16:9 / 3:4 · โลโก้ · รูปภาพ [รูปปก | โฆษณา] · ธีมสำเร็จรูป 6 แบบ + Reset · ปรับแต่งเอง
// ฟ้าใส: - ฟอร์ม / Survey: Live Preview · แบนเนอร์หัวหน้า 4:1 (แบบ Google Forms) · ปรับแต่งเอง (ตั้งสีแยก หรือใช้สีเดียวกับ Kiosk)
// ฟ้าใส: ปรับแต่งเอง = สีหลัก, สีตัวอักษร, พื้นหลัง สี/รูป (custom-colors.tsx) · โหมด (Light/Dark/Bold) มาจากธีมสำเร็จรูปเท่านั้น
// ฟ้าใส: รูปทุกแบบเก็บเป็น data URL ใน wizard store (localStorage) — ยังไม่มี server
// ฟ้าใส: ธีมตอนนี้มีผลใน Wizard (Preview) · หน้าจริง /r, /s, Kiosk ยังใช้แค่สีหลัก + โหมด (ไฟล์ของเพื่อน)

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
import { useTr, useWizardLang } from "@/lib/wizard-lang";

// ฟ้าใส: ชนิดของธีม
type Theme = EventDraft["theme"];
// ฟ้าใส: แท็บรูปภาพ: รูปปก หรือ โฆษณา
type Media = "cover" | "ads";

// ฟ้าใส: การ์ดเลือกหน้าที่จะแต่ง 3 แบบ
const TARGETS: { value: ColorTarget; label: string; labelEn: string; hint: string; hintEn: string; icon: typeof FileText }[] = [
  { value: "kiosk", label: "จอ Kiosk", labelEn: "Kiosk screen", hint: "โลโก้ รูปปก โฆษณา ธีม สี", hintEn: "Logo, cover, ads, theme, colors", icon: MonitorSmartphone },
  { value: "form", label: "ฟอร์มลงทะเบียน", labelEn: "Registration form", hint: "แบนเนอร์ สี", hintEn: "Banner, colors", icon: FileText },
  { value: "survey", label: "Survey", labelEn: "Survey", hint: "แบนเนอร์ สี", hintEn: "Banner, colors", icon: ClipboardList },
];

// ฟ้าใส: ขั้นที่ 2 Branding
export function StepBranding() {
  // ฟ้าใส: Event ที่กำลังแก้
  const draft = useWizardStore((s) => s.draft);
  // ฟ้าใส: ฟังก์ชันบันทึก
  const patch = useWizardStore((s) => s.patch);
  // ฟ้าใส: ธีมของ Event
  const t = draft.theme;
  const [media, setMedia] = useState<Media>("cover");
  // ฟ้าใส: จอ Kiosk แนวนอนไหม
  const landscape = t.kiosk === "landscape";
  const ratio = mediaRatioOf(t); // ฟ้าใส: สัดส่วนที่ใช้ crop รูปปก / โฆษณา ตอนนี้
  const [target, setTarget] = useState<ColorTarget>("kiosk"); // ฟ้าใส: หน้าที่กำลังแต่ง (เลือกที่บนสุด)
  // ฟ้าใส: ภาษาที่เลือก
  const lang = useWizardLang();
  // ฟ้าใส: ตัวเลือกข้อความตามภาษา
  const tr = useTr();
  // ฟ้าใส: ข้อมูลของหน้าที่เลือก
  const currentT = TARGETS.find((x) => x.value === target)!;
  // ฟ้าใส: ชื่อหน้าตามภาษา
  const current = { ...currentT, label: lang === "en" ? currentT.labelEn : currentT.label };

  // ฟ้าใส: Reset = ธีมมินิมอล + ล้างสีที่ตั้งแยกของฟอร์ม / Survey (รูปปก โฆษณา โลโก้ แบนเนอร์ไม่หาย)
  const reset = () => patch("theme", { ...applyPreset(DEFAULT_PRESET), bg: null, pages: {} });

  return (
    <>
      {/* ฟ้าใส: ===== เลือกหน้าที่จะแต่ง (บนสุด) ===== */}
      <WizardSection
        title={tr("แต่งหน้าไหน", "Which page to style")}
        description={tr("เลือกแล้วด้านล่างจะแสดงเฉพาะการตั้งค่าของหน้านั้น", "Only the settings for the chosen page are shown below")}
      >
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
                <span className="block text-sm font-semibold">{lang === "en" ? x.labelEn : x.label}</span>
                <span className={cn("block text-xs", target === x.value ? "text-background/70" : "text-muted-foreground")}>{lang === "en" ? x.hintEn : x.hint}</span>
              </span>
            </button>
          ))}
        </div>
      </WizardSection>

      {/* ฟ้าใส: ===== Live Preview ของหน้าที่เลือก ===== */}
      {/* ฟ้าใส: Kiosk: ช่องรูปแสดงโฆษณา (เลื่อนวน) · ไม่มีโฆษณา = แสดงรูปปกแทน */}
      <WizardSection title={`Live Preview · ${current.label}`} description={tr("อัปเดตทันทีที่แก้ด้านล่าง", "Updates as you edit below")}>
        {target === "kiosk" ? (
          <div className={cn("mx-auto w-full", landscape ? "max-w-2xl" : "max-w-xs")}>
            {/* ฟ้าใส: ภาพจำลองจอ Kiosk */}
            <KioskPreview d={draft} />
          </div>
        ) : target === "form" ? (
          // ฟ้าใส: ภาพจำลองฟอร์ม
          <FormPreview fields={draft.form.fields} primary={t.primary} eventName={draft.general.nameTh} look={pageLook(t, "form")} />
        ) : (
          // ฟ้าใส: ภาพจำลองแบบประเมิน
          <SurveyPreview
            questions={draft.survey.questions}
            lang="th"
            primary={t.primary}
            title={tr("แบบประเมินงาน ", "Feedback: ") + eventTypeLabel(draft.general.type, draft.general.typeOther, lang)}
            look={pageLook(t, "survey")}
          />
        )}
        {/* ฟ้าใส: แนวตั้ง / แนวนอน + สัดส่วนรูปปก / โฆษณา (เลือกได้ทั้ง 2 แนว) · เฉพาะจอ Kiosk */}
        {target === "kiosk" && (
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3 rounded-xl bg-muted/60 px-4 py-3 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">{tr("จอ Kiosk", "Kiosk screen")}</span>
              {/* ฟ้าใส: แนวตั้ง / แนวนอน */}
              <ToggleGroup
                value={[t.kiosk ?? "portrait"]}
                onValueChange={(v) => v[0] && patch("theme", { kiosk: v[0] as Theme["kiosk"] })}
                variant="outline"
                size="sm"
              >
                <ToggleGroupItem value="portrait">{tr("แนวตั้ง", "Portrait")}</ToggleGroupItem>
                <ToggleGroupItem value="landscape">{tr("แนวนอน", "Landscape")}</ToggleGroupItem>
              </ToggleGroup>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">{tr("สัดส่วนรูปปก / โฆษณา", "Cover / ad ratio")}</span>
              {/* ฟ้าใส: สัดส่วนรูป 16:9 / 3:4 */}
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
              {tr("ตอนนี้มีผลกับ Preview ใน Wizard · จอ Kiosk จริงต้องรอเพื่อนรองรับแนวนอน / รูป 3:4", "Applies to the preview in this wizard for now · the real Kiosk screen doesn't support landscape / 3:4 yet")}
            </p>
          </div>
        )}
      </WizardSection>

      {target === "kiosk" ? (
        <>
  
        {/* ฟ้าใส: ===== โลโก้ ===== */}
        <WizardSection title={tr("โลโก้", "Logo")} description={tr("PNG/SVG พื้นใส · ไม่ใส่ = ใช้ตัวย่อรหัสงาน", "Transparent PNG/SVG · none = event code initials")}>
          {/* ฟ้าใส: ช่องอัปโหลดโลโก้ */}
          <ImageSlot
            asset={t.logo}
            accept="image/png,image/svg+xml,image/jpeg"
            hint={tr("ย่อเหลือ 256 px", "Resized to 256 px")}
            onPick={async (file) => {
              const url = await resizeToDataUrl(await readFileAsDataUrl(file), 256, 256, "image/png"); // ฟ้าใส: โลโก้ใช้ PNG (คงพื้นใส) · ย่อเหลือ 256 px
              patch("theme", { logo: { name: file.name, sizeKB: dataUrlKB(url), dataUrl: url } });
            }}
            onRemove={() => patch("theme", { logo: null })}
            className="size-16"
            contain
          />
        </WizardSection>
  
        {/* ฟ้าใส: ===== รูปภาพ: รูปปก / โฆษณา ===== */}
        <WizardSection
          title={tr("รูปภาพ", "Images")}
          action={
            // ฟ้าใส: สลับแท็บ รูปปก / โฆษณา
            <ToggleGroup value={[media]} onValueChange={(v) => v[0] && setMedia(v[0] as Media)} variant="outline" size="sm">
              <ToggleGroupItem value="cover">{tr("รูปปก", "Cover")}</ToggleGroupItem>
              <ToggleGroupItem value="ads">{tr("โฆษณา", "Ads")}</ToggleGroupItem>
            </ToggleGroup>
          }
        >
          {media === "cover" ? <CoverEditor /> : <AdsEditor />}
        </WizardSection>
  
        {/* ฟ้าใส: ===== ธีมสำเร็จรูป ===== */}
        <WizardSection
          title={tr("ธีมสำเร็จรูป", "Theme presets")}
          action={
            <Button variant="ghost" size="sm" onClick={reset} title={tr("กลับเป็นธีมมินิมอล + ฟอร์ม / Survey ใช้สีเดียวกับ Kiosk (รูปปก โฆษณา และโลโก้ไม่หาย)", "Back to Minimal; form / survey use the Kiosk colors (cover, ads and logo stay)")}>
              <RotateCcw className="size-4" /> Reset
            </Button>
          }
        >
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
            {THEME_PRESETS.map((p) => {
              // ฟ้าใส: ธีมนี้ถูกเลือกอยู่ไหม
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
                  {lang === "en" ? p.nameEn : p.name}
                </button>
              );
            })}
          </div>
        </WizardSection>
        </>
      ) : (
        // ฟ้าใส: ===== ฟอร์ม / Survey: แบนเนอร์หัวหน้า แบบ Google Forms =====
        <WizardSection
          title={tr("แบนเนอร์", "Banner")}
          description={tr(`รูปแนวนอน 4:1 ด้านบนหน้า${current.label} แบบ Google Forms · ไม่ใส่ = ไม่มีแบนเนอร์`, `A 4:1 image at the top of the ${current.label.toLowerCase()} page, like Google Forms · none = no banner`)}
        >
          {/* ฟ้าใส: ช่องแบนเนอร์ของหน้าที่เลือก */}
          <BannerEditor key={target} page={target} />
        </WizardSection>
      )}

      {/* ฟ้าใส: ===== ปรับแต่งเอง (ของหน้าที่เลือก) ===== */}
      <WizardSection
        title={tr("ปรับแต่งเอง", "Customize")}
        description={
          target === "kiosk"
            ? tr("สีของจอ Kiosk และหน้า Event", "Colors of the Kiosk screen and event page")
            : tr(`ตั้งสีหน้า${current.label}แยก หรือใช้สีเดียวกับ Kiosk`, `Give the ${current.label.toLowerCase()} page its own colors, or use the Kiosk colors`)
        }
      >
        {/* ฟ้าใส: ช่องตั้งสีของหน้าที่เลือก */}
        <CustomColors target={target} />
      </WizardSection>
    </>
  );
}

// ฟ้าใส: ============ รูปปก 16:9 (crop ก่อนเก็บ) ============
function CoverEditor() {
  // ฟ้าใส: รูปปกปัจจุบัน
  const cover = useWizardStore((s) => s.draft.general.cover);
  const ratio = useWizardStore((s) => mediaRatioOf(s.draft.theme)); // ฟ้าใส: 16:9 หรือ 3:4
  // ฟ้าใส: ฟังก์ชันบันทึก
  const patch = useWizardStore((s) => s.patch);
  // ฟ้าใส: ขนาดรูปผลลัพธ์ตามสัดส่วน
  const size = MEDIA_SIZE[ratio];
  const coverRatio = cover?.ratio ?? "16:9"; // ฟ้าใส: รูปเก่าไม่มีค่านี้ = 16:9
  // ฟ้าใส: ตัวเลือกข้อความตามภาษา
  const tr = useTr();
  const [cropping, setCropping] = useState<{ src: string; name: string } | null>(null);
  const [error, setError] = useState("");

  // ฟ้าใส: เลือกไฟล์รูปปกแล้ว → ตรวจ แล้วเปิดหน้าต่าง Crop
  const pick = async (file: File) => {
    setError("");
    // ฟ้าใส: รับเฉพาะ JPG / PNG
    if (!/^image\/(png|jpeg)$/.test(file.type)) return setError(tr("รองรับเฉพาะ JPG / PNG", "Only JPG / PNG are supported"));
    // ฟ้าใส: ไฟล์ต้องไม่เกิน 10 MB
    if (file.size > 10 * 1024 * 1024) return setError(tr("ไฟล์ใหญ่เกิน 10 MB", "File is larger than 10 MB"));
    setCropping({ src: await readFileAsDataUrl(file), name: file.name });
  };

  return (
    <div className="space-y-2">
      {/* ฟ้าใส: ขนาดเท่ากับแท็บโฆษณา: ช่องวางไฟล์เตี้ย + รูปที่มีแล้วแสดงเป็นแถว (รูปย่อ + ปุ่ม) */}
      {cover?.dataUrl ? (
        <div className="flex items-center gap-3 rounded-lg border bg-background p-2">
          {/* eslint-disable-next-line @next/next/no-img-element -- data URL ของรูปปกที่ crop แล้ว */}
          <img src={cover.dataUrl} alt={tr("รูปปก", "Cover")} className={cn("w-20 shrink-0 rounded object-cover", coverRatio === "3:4" ? "aspect-[3/4] w-14" : "aspect-video")} />
          <div className="min-w-0 flex-1 text-sm">
            <p className="truncate font-semibold">{cover.name}</p>
            <p className="text-xs text-muted-foreground">{cover.sizeKB} KB · {coverRatio}</p>
            {coverRatio !== ratio && <p className="text-xs text-amber-700">{tr(`รูปนี้เป็น ${coverRatio} · กด Crop ใหม่ให้เป็น ${ratio}`, `This image is ${coverRatio} · re-crop it to ${ratio}`)}</p>}
          </div>
          <Button variant="ghost" size="icon" aria-label={tr("Crop ใหม่", "Re-crop")} onClick={() => setCropping({ src: cover.dataUrl!, name: cover.name })}>
            <Crop className="size-4" />
          </Button>
          <ReplaceButton onFile={pick} />
          <Button variant="ghost" size="icon" className="text-destructive" aria-label={tr("ลบรูปปก", "Remove cover")} onClick={() => patch("general", { cover: null })}>
            <Trash2 className="size-4" />
          </Button>
        </div>
      ) : (
        // ฟ้าใส: ยังไม่มีรูป → กล่องลากไฟล์มาวาง
        <FileDrop
          title={tr("ลากรูปปกมาวาง หรือเลือกไฟล์", "Drop a cover image here, or choose a file")}
          hint={`${ratio} · ${size.w}×${size.h} px · ${tr("ไม่ใส่ก็ได้", "optional")}`}
          onFile={pick}
          className="py-6"
        />
      )}
      {cover && !cover.dataUrl && <p className="text-xs text-amber-700">{cover.name} · {tr("ไม่มีไฟล์รูป อัปโหลดใหม่", "image file missing, upload again")}</p>}
      {error && <p role="alert" className="text-sm font-medium text-destructive">{error}</p>}
      {/* ฟ้าใส: หน้าต่าง Crop รูปปก */}
      <CropDialog
        title={`${tr("Crop รูปปก", "Crop cover")} ${ratio}`}
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

// ฟ้าใส: ปุ่มเปลี่ยนรูป (เปิดหน้าต่างเลือกไฟล์)
function ReplaceButton({ onFile }: { onFile: (f: File) => void }) {
  // ฟ้าใส: ตัวเลือกข้อความตามภาษา
  const tr = useTr();
  // ฟ้าใส: ช่องเลือกไฟล์ที่ซ่อนไว้
  const ref = useRef<HTMLInputElement>(null);
  return (
    <>
      <Button variant="ghost" size="icon" aria-label={tr("เปลี่ยนรูป", "Replace image")} title={tr("เปลี่ยนรูป", "Replace image")} onClick={() => ref.current?.click()}>
        <ImagePlus className="size-4" />
      </Button>
      <input
        ref={ref}
        type="file"
        accept="image/png,image/jpeg"
        hidden
        onChange={(e) => {
          // ฟ้าใส: ไฟล์ที่เลือก
          const f = e.target.files?.[0];
          // ฟ้าใส: มีไฟล์ → ส่งต่อ
          if (f) onFile(f);
          e.target.value = "";
        }}
      />
    </>
  );
}

// ฟ้าใส: ============ แบนเนอร์หัวฟอร์ม / Survey 4:1 (crop ก่อนเก็บ · 1600 × 400 px) ============
function BannerEditor({ page }: { page: PageKey }) {
  // ฟ้าใส: แบนเนอร์ของทุกหน้า
  const banners = useWizardStore((s) => s.draft.theme.banners);
  // ฟ้าใส: ฟังก์ชันบันทึก
  const patch = useWizardStore((s) => s.patch);
  // ฟ้าใส: แบนเนอร์ของหน้านี้
  const banner = banners?.[page] ?? null;
  const [cropping, setCropping] = useState<{ src: string; name: string } | null>(null);
  const [error, setError] = useState("");
  // ฟ้าใส: ขนาดแบนเนอร์ 1600×400
  const size = MEDIA_SIZE["4:1"];
  // ฟ้าใส: ตัวเลือกข้อความตามภาษา
  const tr = useTr();
  // ฟ้าใส: บันทึกแบนเนอร์ของหน้านี้ (หน้าอื่นคงเดิม)
  const save = (next: EventDraft["general"]["cover"]) => patch("theme", { banners: { ...banners, [page]: next } });

  // ฟ้าใส: เลือกไฟล์แบนเนอร์แล้ว → ตรวจ แล้วเปิดหน้าต่าง Crop
  const pick = async (file: File) => {
    setError("");
    // ฟ้าใส: รับเฉพาะ JPG / PNG
    if (!/^image\/(png|jpeg)$/.test(file.type)) return setError(tr("รองรับเฉพาะ JPG / PNG", "Only JPG / PNG are supported"));
    // ฟ้าใส: ไฟล์ต้องไม่เกิน 10 MB
    if (file.size > 10 * 1024 * 1024) return setError(tr("ไฟล์ใหญ่เกิน 10 MB", "File is larger than 10 MB"));
    setCropping({ src: await readFileAsDataUrl(file), name: file.name });
  };

  return (
    <div className="space-y-2">
      {banner?.dataUrl ? (
        <div className="flex items-center gap-3 rounded-lg border bg-background p-2">
          {/* eslint-disable-next-line @next/next/no-img-element -- data URL ของแบนเนอร์ที่ crop แล้ว */}
          <img src={banner.dataUrl} alt={tr("แบนเนอร์", "Banner")} className="aspect-[4/1] w-32 shrink-0 rounded object-cover" />
          <div className="min-w-0 flex-1 text-sm">
            <p className="truncate font-semibold">{banner.name}</p>
            <p className="text-xs text-muted-foreground">{banner.sizeKB} KB · 4:1</p>
          </div>
          <Button variant="ghost" size="icon" aria-label={tr("Crop ใหม่", "Re-crop")} onClick={() => setCropping({ src: banner.dataUrl!, name: banner.name })}>
            <Crop className="size-4" />
          </Button>
          <ReplaceButton onFile={pick} />
          <Button variant="ghost" size="icon" className="text-destructive" aria-label={tr("ลบแบนเนอร์", "Remove banner")} onClick={() => save(null)}>
            <Trash2 className="size-4" />
          </Button>
        </div>
      ) : (
        // ฟ้าใส: ยังไม่มีแบนเนอร์ → กล่องลากไฟล์มาวาง
        <FileDrop
          title={tr("ลากรูปแบนเนอร์มาวาง หรือเลือกไฟล์", "Drop a banner image here, or choose a file")}
          hint={`4:1 · ${size.w}×${size.h} px · ${tr("ไม่ใส่ก็ได้", "optional")}`}
          onFile={pick}
          className="py-6"
        />
      )}
      {error && <p role="alert" className="text-sm font-medium text-destructive">{error}</p>}
      {/* ฟ้าใส: หน้าต่าง Crop แบนเนอร์ 4:1 */}
      <CropDialog
        title={tr("Crop แบนเนอร์ 4:1", "Crop banner 4:1")}
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
