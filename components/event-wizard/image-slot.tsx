"use client";
// ช่องรูปเล็ก (โลโก้ / พื้นหลัง) ใช้ในขั้น Branding: กรอบรูปย่อ + ปุ่มอัปโหลด / เปลี่ยน / ลบ
// แยกออกมาจาก step-branding.tsx เพื่อใช้ซ้ำในส่วนตั้งสีของฟอร์ม / Survey (custom-colors.tsx)

import { useRef, useState } from "react";
import { ImagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { UploadedAsset } from "@/types/event";

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
