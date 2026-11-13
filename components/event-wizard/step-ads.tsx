"use client";
// ขั้นที่ 3: รูปโฆษณาบนจอ Kiosk
// - ใส่ได้หลายรูป (สูงสุด MAX_ADS) · จอ Kiosk เลื่อนวนทีละรูปทุก "seconds" วินาที
// - ทุกรูปต้อง Crop เป็น 16:9 ขนาด 1920 × 1080 px ก่อน (เลือกไฟล์แล้วหน้าต่าง Crop เปิดเอง)
// - เก็บรูปที่ crop แล้วเป็น data URL ใน wizard store (localStorage) — ดู lib/image-crop.ts

import { useEffect, useState } from "react";
import { Crop, GripVertical, ImageOff, Trash2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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

export function StepAds() {
  const ads = useWizardStore((s) => s.draft.ads);
  const patch = useWizardStore((s) => s.patch);
  const setItems = (items: UploadedAsset[]) => patch("ads", { items });
  const [cropping, setCropping] = useState<Cropping | null>(null);
  const [error, setError] = useState("");

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
      // localStorage เต็ม (zustand persist เขียนไม่ได้)
      setError("พื้นที่เก็บรูปในเบราว์เซอร์เต็ม ลองลบรูปเก่าออกก่อน");
    }
    setCropping(null);
  };

  const sort = useDragSort(ads.items, setItems); // ลากที่ ⋮⋮ เพื่อเรียงลำดับ

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <div className="space-y-5">
        <Card>
          <CardContent className="pt-6">
            <FileDrop
              title={full ? `ครบ ${MAX_ADS} รูปแล้ว` : "ลากรูปมาวาง หรือเลือกไฟล์"}
              hint={`JPG / PNG · สัดส่วน 16:9 · ขนาด ${AD_WIDTH} × ${AD_HEIGHT} px · สูงสุด ${MAX_ADS} รูป · เลือกแล้วจะเปิดหน้าต่าง Crop`}
              onFile={pickFile}
              className={full ? "pointer-events-none opacity-50" : undefined}
            />
            {error && <p role="alert" className="mt-3 text-sm font-medium text-destructive">{error}</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">การเลื่อนรูปบน Kiosk</CardTitle>
            <CardDescription>มีหลายรูป → แสดงวนทีละรูปอัตโนมัติ</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <Label htmlFor="ad-seconds" className="shrink-0">เปลี่ยนรูปทุก</Label>
              <Input
                id="ad-seconds"
                type="number"
                min={MIN_SECONDS}
                max={MAX_SECONDS}
                value={ads.seconds}
                onChange={(e) => patch("ads", { seconds: Number(e.target.value) })}
                onBlur={() => patch("ads", { seconds: Math.min(MAX_SECONDS, Math.max(MIN_SECONDS, Math.round(ads.seconds) || 6)) })}
                className="w-24"
              />
              <span className="text-sm text-muted-foreground">วินาที ({MIN_SECONDS}–{MAX_SECONDS})</span>
            </div>
          </CardContent>
        </Card>

      </div>

      <div className="space-y-5">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">รูปโฆษณา ({ads.items.length}/{MAX_ADS} รูป)</CardTitle>
          <CardDescription>เรียงตามลำดับที่จะแสดงบนจอ · ลากที่ ⋮⋮ เพื่อเรียง</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {ads.items.length === 0 && <p className="text-sm text-muted-foreground">ยังไม่มีโฆษณา · ข้ามขั้นนี้ได้</p>}
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
              <span className="w-4 text-center text-xs text-muted-foreground">{i + 1}</span>
              {a.dataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- data URL ของรูปที่ crop แล้ว
                <img src={a.dataUrl} alt="" className="aspect-video w-24 shrink-0 rounded object-cover" />
              ) : (
                <div className="flex aspect-video w-24 shrink-0 items-center justify-center rounded bg-muted text-muted-foreground">
                  <ImageOff className="size-4" />
                </div>
              )}
              <div className="min-w-0 flex-1 text-sm">
                <p className="truncate font-semibold">{a.name}</p>
                <p className={a.dataUrl ? "text-xs text-emerald-700" : "text-xs text-amber-700"}>
                  {a.dataUrl ? `Crop 16:9 แล้ว · ${AD_WIDTH}×${AD_HEIGHT} · ${a.sizeKB} KB` : "ข้อมูลตัวอย่าง (ไม่มีไฟล์รูป) · อัปโหลดใหม่"}
                </p>
              </div>
              {a.dataUrl && (
                <Button variant="secondary" size="sm" onClick={() => setCropping({ src: a.dataUrl!, name: a.name, index: i })}>
                  <Crop className="size-4" /> Crop
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="text-destructive"
                aria-label="ลบรูป"
                onClick={() => setItems(ads.items.filter((_, k) => k !== i))}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

        {/* ตัวอย่างบนจอ Kiosk อยู่ใต้รายการรูป */}
        {ads.items.some((a) => a.dataUrl) && <AdPreview items={ads.items} seconds={ads.seconds} />}
      </div>

      <CropDialog
        src={cropping?.src ?? null}
        fileName={cropping?.name ?? ""}
        onCancel={() => setCropping(null)}
        onDone={finishCrop}
      />
    </div>
  );
}

// ตัวอย่างการเลื่อนรูปแบบเดียวกับจอ Kiosk
function AdPreview({ items, seconds }: { items: UploadedAsset[]; seconds: number }) {
  const srcs = items.map((a) => a.dataUrl).filter((s): s is string => !!s);
  const [index, setIndex] = useState(0);
  const ms = Math.max(MIN_SECONDS, seconds || 6) * 1000;
  useEffect(() => {
    if (srcs.length < 2) return;
    const t = setInterval(() => setIndex((i) => i + 1), ms);
    return () => clearInterval(t);
  }, [srcs.length, ms]);
  const current = index % Math.max(1, srcs.length);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">ตัวอย่างบน Kiosk</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative aspect-video overflow-hidden rounded-xl bg-muted">
          {srcs.map((src, i) => (
            // eslint-disable-next-line @next/next/no-img-element -- data URL
            <img
              key={i}
              src={src}
              alt=""
              className="absolute inset-0 size-full object-cover transition-opacity duration-700"
              style={{ opacity: i === current ? 1 : 0 }}
            />
          ))}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          รูปที่ {current + 1}/{srcs.length} · เปลี่ยนทุก {Math.round(ms / 1000)} วินาที
        </p>
      </CardContent>
    </Card>
  );
}
