"use client";
// ฟ้าใส: ช่องรูปเล็ก (โลโก้ / พื้นหลัง) ใช้ในขั้น Branding: กรอบรูปย่อ + ปุ่มอัปโหลด / เปลี่ยน / ลบ
// ฟ้าใส: แยกออกมาจาก step-branding.tsx เพื่อใช้ซ้ำในส่วนตั้งสีของฟอร์ม / Survey (custom-colors.tsx)

import { useRef, useState } from "react";
import { ImagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { UploadedAsset } from "@/types/event";
import { useTr } from "@/lib/wizard-lang";

// ฟ้าใส: ช่องรูปเล็ก: กรอบรูป + ปุ่มอัปโหลด / เปลี่ยน / ลบ
export function ImageSlot({
  asset,
  hint,
  onPick,
  onRemove,
  className,
  accept = "image/png,image/jpeg",
  contain,
}: {
  asset: UploadedAsset | null;
  hint: string;
  // ฟ้าใส: เลือกไฟล์แล้ว
  onPick: (f: File) => Promise<void>;
  // ฟ้าใส: กดลบ
  onRemove: () => void;
  className?: string;
  accept?: string;
  contain?: boolean;
}) {
  // ฟ้าใส: ช่องเลือกไฟล์ที่ซ่อนไว้
  const ref = useRef<HTMLInputElement>(null);
  // ฟ้าใส: ตัวเลือกข้อความตามภาษา
  const tr = useTr();
  const [error, setError] = useState("");
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={() => ref.current?.click()}
        className={cn("flex shrink-0 items-center justify-center overflow-hidden rounded-lg border border-dashed bg-muted/40 text-muted-foreground", className)}
        aria-label={tr("เลือกรูป", "Choose an image")}
      >
        {asset?.dataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- data URL
          <img src={asset.dataUrl} alt="" className={cn("size-full", contain ? "object-contain p-1" : "object-cover")} />
        ) : (
          <ImagePlus className="size-5" />
        )}
      </button>
      <div className="min-w-0 text-sm">
        <p className="truncate">{asset ? asset.name : tr("ยังไม่มีรูป", "No image yet")}</p>
        <p className="text-xs text-muted-foreground">{asset?.dataUrl ? `${asset.sizeKB} KB · ` : ""}{hint}</p>
        {error && <p className="text-xs text-destructive">{error}</p>}
        <div className="mt-1 flex gap-2">
          <Button size="sm" variant="outline" onClick={() => ref.current?.click()}>
            {asset ? tr("เปลี่ยน", "Change") : tr("อัปโหลด", "Upload")}
          </Button>
          {asset && (
            <Button size="sm" variant="ghost" className="text-destructive" onClick={onRemove}>
              {tr("ลบ", "Remove")}
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
          // ฟ้าใส: ไฟล์ที่เลือก
          const f = e.target.files?.[0];
          e.target.value = "";
          // ฟ้าใส: ไม่ได้เลือก → ไม่ทำอะไร
          if (!f) return;
          setError("");
          // ฟ้าใส: ไฟล์ต้องไม่เกิน 10 MB
          if (f.size > 10 * 1024 * 1024) return setError(tr("ไฟล์ใหญ่เกิน 10 MB", "File is larger than 10 MB"));
          try {
            await onPick(f);
          } catch {
            setError(tr("อ่านรูปไม่ได้ หรือพื้นที่เก็บรูปเต็ม", "Couldn't read the image, or storage is full"));
          }
        }}
      />
    </div>
  );
}
