"use client";
// หน้าต่าง Crop รูปโฆษณาเป็น 16:9 (1920 × 1080 px)
// - ลากรูปเพื่อเลื่อนตำแหน่ง · เลื่อนแถบ Zoom เพื่อขยาย
// - กรอบ 16:9 อยู่กับที่ รูปต้องเต็มกรอบเสมอ (เลื่อนออกนอกกรอบไม่ได้)
// - กด "ใช้รูปนี้" → ตัดด้วย canvas ได้ JPEG 1920×1080 (lib/image-crop.ts)

import { useEffect, useRef, useState } from "react";
import { AlertTriangle, Move, ZoomIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AD_HEIGHT, AD_RATIO, AD_WIDTH, cropToDataUrl, loadImage } from "@/lib/image-crop";

const FRAME_W = 560; // ความกว้างกรอบบนจอ (px) · สูง = 560 × 9/16 = 315
const FRAME_H = Math.round(FRAME_W / AD_RATIO);

interface Props {
  src: string | null; // data URL ของรูปต้นฉบับ (null = ปิด)
  fileName: string;
  onCancel: () => void;
  onDone: (dataUrl: string) => void;
}

export function CropDialog({ src, fileName, onCancel, onDone }: Props) {
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 }); // มุมซ้ายบนของรูป เทียบกับกรอบ
  const drag = useRef<{ px: number; py: number; ox: number; oy: number } | null>(null);

  // โหลดรูปเมื่อเปิด แล้วจัดกึ่งกลาง (setState อยู่ใน callback ของ promise ไม่ใช่ใน effect ตรง ๆ)
  useEffect(() => {
    if (!src) return;
    let alive = true;
    loadImage(src).then((im) => {
      if (!alive) return;
      const s = Math.max(FRAME_W / im.naturalWidth, FRAME_H / im.naturalHeight);
      setImg(im);
      setZoom(1);
      setOffset({ x: (FRAME_W - im.naturalWidth * s) / 2, y: (FRAME_H - im.naturalHeight * s) / 2 });
    });
    return () => {
      alive = false;
    };
  }, [src]);

  // scale = จากพิกเซลรูปจริง → พิกเซลบนจอ (cover กรอบ × zoom)
  const base = img ? Math.max(FRAME_W / img.naturalWidth, FRAME_H / img.naturalHeight) : 1;
  const scale = base * zoom;
  const dw = img ? img.naturalWidth * scale : 0;
  const dh = img ? img.naturalHeight * scale : 0;
  const clamp = (x: number, y: number) => ({
    x: Math.min(0, Math.max(FRAME_W - dw, x)),
    y: Math.min(0, Math.max(FRAME_H - dh, y)),
  });
  const pos = clamp(offset.x, offset.y);
  const small = img !== null && (img.naturalWidth < AD_WIDTH || img.naturalHeight < AD_HEIGHT);

  // zoom รอบจุดกึ่งกลางกรอบ
  const changeZoom = (z: number) => {
    if (!img) return;
    const cx = (FRAME_W / 2 - pos.x) / scale;
    const cy = (FRAME_H / 2 - pos.y) / scale;
    const ns = base * z;
    setZoom(z);
    setOffset({ x: FRAME_W / 2 - cx * ns, y: FRAME_H / 2 - cy * ns });
  };

  const confirm = () => {
    if (!img) return;
    onDone(cropToDataUrl(img, { x: -pos.x / scale, y: -pos.y / scale, width: FRAME_W / scale, height: FRAME_H / scale }));
  };

  return (
    <Dialog open={src !== null} onOpenChange={(o) => !o && onCancel()}>
      <DialogContent className="sm:max-w-[620px]">
        <DialogHeader>
          <DialogTitle>Crop รูปโฆษณา 16:9</DialogTitle>
          <DialogDescription>
            {fileName}
            {img && ` · ต้นฉบับ ${img.naturalWidth} × ${img.naturalHeight} px`} · ผลลัพธ์ {AD_WIDTH} × {AD_HEIGHT} px
          </DialogDescription>
        </DialogHeader>

        <div
          className="relative mx-auto cursor-grab touch-none overflow-hidden rounded-lg bg-slate-900 active:cursor-grabbing"
          style={{ width: FRAME_W, height: FRAME_H, maxWidth: "100%" }}
          onPointerDown={(e) => {
            (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
            drag.current = { px: e.clientX, py: e.clientY, ox: pos.x, oy: pos.y };
          }}
          onPointerMove={(e) => {
            const d = drag.current;
            if (d) setOffset(clamp(d.ox + e.clientX - d.px, d.oy + e.clientY - d.py));
          }}
          onPointerUp={() => (drag.current = null)}
        >
          {img && (
            // eslint-disable-next-line @next/next/no-img-element -- รูปจากเครื่องผู้ใช้ (data URL) ไม่ผ่าน next/image
            <img
              src={img.src}
              alt=""
              draggable={false}
              className="pointer-events-none absolute max-w-none select-none"
              style={{ left: pos.x, top: pos.y, width: dw, height: dh }}
            />
          )}
          {/* เส้นแบ่ง 3 ส่วน ช่วยจัดองค์ประกอบ */}
          <div className="pointer-events-none absolute inset-0 grid grid-cols-3 grid-rows-3">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="border border-white/25" />
            ))}
          </div>
          <span className="pointer-events-none absolute right-2 bottom-2 rounded bg-black/60 px-2 py-0.5 text-xs text-white">16:9</span>
        </div>

        <div className="flex items-center gap-3 text-sm">
          <ZoomIn className="size-4 text-muted-foreground" />
          <input
            type="range"
            min={1}
            max={3}
            step={0.01}
            value={zoom}
            onChange={(e) => changeZoom(Number(e.target.value))}
            aria-label="Zoom"
            className="flex-1"
          />
          <span className="w-12 text-right tabular-nums text-muted-foreground">{zoom.toFixed(1)}×</span>
        </div>
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Move className="size-3.5" /> ลากรูปเพื่อเลือกส่วนที่จะแสดงบนจอ Kiosk
        </p>
        {small && (
          <p className="flex items-center gap-1.5 text-xs text-amber-700">
            <AlertTriangle className="size-3.5" /> รูปเล็กกว่า {AD_WIDTH} × {AD_HEIGHT} px อาจไม่คมชัดบนจอ Kiosk
          </p>
        )}

        <DialogFooter>
          <Button variant="secondary" onClick={onCancel}>
            ยกเลิก
          </Button>
          <Button onClick={confirm} disabled={!img}>
            ใช้รูปนี้
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
