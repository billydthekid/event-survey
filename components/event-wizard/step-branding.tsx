"use client";
// ขั้นที่ 2: Branding (เดิม Theme + โฆษณา)
// หน้าเดียวเรียงลงมา: Live Preview จอ Kiosk (บนสุด · ช่องรูป = โฆษณา, ไม่มีโฆษณา = รูปปก)
// + เลือกจอ Kiosk แนวตั้ง / แนวนอน และสัดส่วนรูปปก / โฆษณา 16:9 หรือ 3:4 (เลือกได้ทั้ง 2 แนว)
// → โลโก้ · รูปภาพ [รูปปก | โฆษณา] · ธีมสำเร็จรูป 6 แบบ + Reset · ปรับแต่งเอง แยกแท็บ Kiosk / ฟอร์ม / Survey
//   (สีหลัก, สีตัวอักษร, พื้นหลัง สี/รูป · custom-colors.tsx) · Live Preview ด้านบนเปลี่ยนตามแท็บที่เลือก
// · โหมด (Light/Dark/Bold) มาจากธีมสำเร็จรูปเท่านั้น
// รูปทุกแบบเก็บเป็น data URL ใน wizard store (localStorage) — ยังไม่มี server
// ธีมตอนนี้มีผลใน Wizard (Preview) · หน้าจริง /r, /s, Kiosk ยังใช้แค่สีหลัก + โหมด (ไฟล์ของเพื่อน)

import { useRef, useState } from "react";
import { Check, Crop, ImagePlus, RotateCcw, Trash2 } from "lucide-react";
import { FormPreview } from "@/components/event/form-preview";
import { SurveyPreview } from "@/components/event/survey-preview";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { KioskPreview } from "@/components/event/brand-preview";
import { useWizardStore } from "@/lib/wizard-store";
import { MEDIA_SIZE, dataUrlKB, mediaRatioOf, readFileAsDataUrl, resizeToDataUrl } from "@/lib/image-crop";
import { ImageSlot } from "./image-slot";
import { DEFAULT_PRESET, THEME_PRESETS, applyPreset, pageLook } from "@/lib/theme-presets";
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

const TARGET_NAME: Record<ColorTarget, string> = { kiosk: "จอ Kiosk", form: "ฟอร์มลงทะเบียน", survey: "Survey" };

export function StepBranding() {
  const draft = useWizardStore((s) => s.draft);
  const patch = useWizardStore((s) => s.patch);
  const t = draft.theme;
  const [media, setMedia] = useState<Media>("cover");
  const landscape = t.kiosk === "landscape";
  const ratio = mediaRatioOf(t); // สัดส่วนที่ใช้ crop รูปปก / โฆษณา ตอนนี้
  const [target, setTarget] = useState<ColorTarget>("kiosk"); // แท็บของ "ปรับแต่งเอง" = หน้าที่ Live Preview แสดง

  // Reset = ธีมมินิมอล + ล้างสีที่ตั้งแยกของฟอร์ม / Survey (รูปปก โฆษณา โลโก้ไม่หาย)
  const reset = () => patch("theme", { ...applyPreset(DEFAULT_PRESET), bg: null, pages: {} });

  return (
    <>
      {/* ===== Live Preview (บนสุด) ===== */}
      {/* ช่องรูปแสดงโฆษณา (เลื่อนวน) · ไม่มีโฆษณา = แสดงรูปปกแทน */}
      <WizardSection title={`Live Preview · ${TARGET_NAME[target]}`} description="อัปเดตทันทีที่แก้ด้านล่าง · เปลี่ยนหน้าได้ที่แท็บของ ปรับแต่งเอง">
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
        {/* แนวตั้ง / แนวนอน + สัดส่วนรูปปก / โฆษณา (เลือกได้ทั้ง 2 แนว) · แสดงเฉพาะตอนดู Preview จอ Kiosk */}
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
          {/* สัดส่วนรูป: เลือกได้ทั้งแนวตั้งและแนวนอน */}
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

      {/* ===== ปรับแต่งเอง: แยกตามหน้า Kiosk / ฟอร์ม / Survey (Live Preview ด้านบนเปลี่ยนตามแท็บ) ===== */}
      <WizardSection
        title="ปรับแต่งเอง"
        description="เลือกหน้าที่จะตั้งสี · ฟอร์มกับ Survey ตั้งสีแยกจาก Kiosk ได้"
        action={
          <ToggleGroup value={[target]} onValueChange={(v) => v[0] && setTarget(v[0] as ColorTarget)} variant="outline" size="sm">
            <ToggleGroupItem value="kiosk">Kiosk</ToggleGroupItem>
            <ToggleGroupItem value="form">ฟอร์ม</ToggleGroupItem>
            <ToggleGroupItem value="survey">Survey</ToggleGroupItem>
          </ToggleGroup>
        }
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
