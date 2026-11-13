"use client";

import { useRef } from "react";
import { ImagePlus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { UploadedAsset } from "@/types/event";

interface Props {
  onPick?: (asset: UploadedAsset) => void; // ได้แค่ชื่อ + ขนาด (mock)
  onFile?: (file: File) => void; // ได้ไฟล์จริง (ใช้กับรูปโฆษณาที่ต้อง crop)
  title: string;
  hint?: string;
  accept?: string;
  className?: string;
}

export function FileDrop({ onPick, onFile, title, hint, accept = "image/png,image/jpeg", className }: Props) {
  const ref = useRef<HTMLInputElement>(null);

  const handle = (file?: File) => {
    if (!file) return;
    onFile?.(file);
    onPick?.({ name: file.name, sizeKB: Math.round(file.size / 1024), cropped: false });
    if (ref.current) ref.current.value = ""; // เลือกไฟล์เดิมซ้ำได้
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => ref.current?.click()}
      onKeyDown={(e) => e.key === "Enter" && ref.current?.click()}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        handle(e.dataTransfer.files?.[0]);
      }}
      className={cn(
        "flex cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed bg-muted/30 px-4 py-10 text-center transition hover:bg-muted/60",
        className
      )}
    >
      <ImagePlus className="size-6 text-muted-foreground" />
      <p className="text-sm font-semibold">{title}</p>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      <input ref={ref} type="file" accept={accept} hidden onChange={(e) => handle(e.target.files?.[0])} />
    </div>
  );
}
