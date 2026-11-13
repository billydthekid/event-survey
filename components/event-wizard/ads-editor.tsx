"use client";
// แท็บ "โฆษณา" ในขั้น Branding: รูปโฆษณาบนจอ Kiosk
// - ใส่ได้หลายรูป (สูงสุด MAX_ADS) · ลากที่ ⋮⋮ เพื่อเรียง · จอ Kiosk เลื่อนวนทุก "seconds" วินาที
// - เลือกไฟล์แล้วเปิดหน้าต่าง Crop 16:9 (1920 × 1080 px) · เก็บเป็น data URL (lib/image-crop.ts)
// - ตัวอย่างการเลื่อนรูปอยู่ที่ Live Preview (KioskPreview ใน components/event/brand-preview.tsx)

import { useState } from "react";
import { Crop, GripVertical, ImageOff, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useWizardStore } from "@/lib/wizard-store";
import { useDragSort } from "@/lib/use-drag-sort";
import { cn } from "@/lib/utils";
import { AD_HEIGHT, AD_WIDTH, dataUrlKB, readFileAsDataUrl } from "@/lib/image-crop";
import type { UploadedAsset } from "@/types/event";
import { FileDrop } from "./file-drop";
import { CropDialog } from "./crop-dialog";

const MAX_ADS = 5;
const MIN_SECONDS = 3;
const MAX_SECONDS = 60;

// รูปที่กำลัง crop: index = null → รูปใหม่ (เพิ่มท้ายรายการ), ตัวเลข → crop รูปเดิมใหม่
type Cropping = { src: string; name: string; index: number | null };

export function AdsEditor() {
  const ads = useWizardStore((s) => s.draft.ads);
  const patch = useWizardStore((s) => s.patch);
  const setItems = (items: UploadedAsset[]) => patch("ads", { items });
  const [cropping, setCropping] = useState<Cropping | null>(null);
  const [error, setError] = useState("");
  const sort = useDragSort(ads.items, setItems);
  const full = ads.items.length >= MAX_ADS;

  const pickFile = async (file: File) => {
    setError("");
    if (!/^image\/(png|jpeg)$/.test(file.type)) return setError("รองรับเฉพาะ JPG / PNG");
    if (file.size > 10 * 1024 * 1024) return setError("ไฟล์ใหญ่เกิน 10 MB");
    if (full) return setError(`ใส่ได้สูงสุด ${MAX_ADS} รูป`);
    setCropping({ src: await readFileAsDataUrl(file), name: file.name, index: null });
  };

  const finishCrop = (dataUrl: string) => {
    if (!cropping) return;
    const item: UploadedAsset = { name: cropping.name, sizeKB: dataUrlKB(dataUrl), cropped: true, dataUrl };
    try {
      if (cropping.index === null) setItems([...ads.items, item]);
      else setItems(ads.items.map((a, i) => (i === cropping.index ? item : a)));
    } catch {
      setError("พื้นที่เก็บรูปในเบราว์เซอร์เต็ม ลองลบรูปเก่าออกก่อน");
    }
    setCropping(null);
  };

  return (
    <div className="space-y-4">
      <FileDrop
        title={full ? `ครบ ${MAX_ADS} รูปแล้ว` : "ลากรูปมาวาง หรือเลือกไฟล์"}
        hint={`16:9 · ${AD_WIDTH}×${AD_HEIGHT} px · สูงสุด ${MAX_ADS} รูป`}
        onFile={pickFile}
        className={cn("py-6", full && "pointer-events-none opacity-50")}
      />
      {error && <p role="alert" className="text-sm font-medium text-destructive">{error}</p>}

      {ads.items.length > 0 && (
        <div className="space-y-2">
          {ads.items.map((a, i) => (
            <div
              key={i}
              {...sort.itemProps(i)}
              className={cn(
                "flex items-center gap-3 rounded-lg border bg-background p-2 transition",
                sort.stateOf(i).dragging && "opacity-40",
                sort.stateOf(i).over && "border-primary ring-2 ring-primary/40"
              )}
            >
              <span {...sort.handleProps(i)} className={cn(sort.handleProps(i).className, "text-muted-foreground")}>
                <GripVertical className="size-4" />
              </span>
              {a.dataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- data URL ของรูปที่ crop แล้ว
                <img src={a.dataUrl} alt="" className="aspect-video w-20 shrink-0 rounded object-cover" />
              ) : (
                <div className="flex aspect-video w-20 shrink-0 items-center justify-center rounded bg-muted text-muted-foreground">
                  <ImageOff className="size-4" />
                </div>
              )}
              <div className="min-w-0 flex-1 text-sm">
                <p className="truncate font-semibold">{a.name}</p>
                <p className={a.dataUrl ? "text-xs text-muted-foreground" : "text-xs text-amber-700"}>
                  {a.dataUrl ? `${a.sizeKB} KB` : "ไม่มีไฟล์รูป · อัปโหลดใหม่"}
                </p>
              </div>
              {a.dataUrl && (
                <Button variant="ghost" size="icon" aria-label="Crop ใหม่" onClick={() => setCropping({ src: a.dataUrl!, name: a.name, index: i })}>
                  <Crop className="size-4" />
                </Button>
              )}
              <Button variant="ghost" size="icon" className="text-destructive" aria-label="ลบรูป" onClick={() => setItems(ads.items.filter((_, k) => k !== i))}>
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2 text-sm">
        <Label htmlFor="ad-seconds" className="font-normal text-muted-foreground">เปลี่ยนรูปทุก</Label>
        <Input
          id="ad-seconds"
          type="number"
          min={MIN_SECONDS}
          max={MAX_SECONDS}
          value={ads.seconds}
          onChange={(e) => patch("ads", { seconds: Number(e.target.value) })}
          onBlur={() => patch("ads", { seconds: Math.min(MAX_SECONDS, Math.max(MIN_SECONDS, Math.round(ads.seconds) || 6)) })}
          className="h-8 w-20"
        />
        <span className="text-muted-foreground">วินาที</span>
      </div>

      <CropDialog src={cropping?.src ?? null} fileName={cropping?.name ?? ""} onCancel={() => setCropping(null)} onDone={finishCrop} />
    </div>
  );
}
