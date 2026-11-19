"use client";
// หน้าต่าง Crop รูปปก / โฆษณา ตามสัดส่วน: 16:9 (1920 × 1080 px) หรือ 3:4 (1080 × 1440 px) สำหรับจอ Kiosk แนวนอน
// - ลากรูปเพื่อเลื่อนตำแหน่ง · เลื่อนแถบ Zoom เพื่อขยาย
// - กรอบตามสัดส่วนอยู่กับที่ รูปต้องเต็มกรอบเสมอ (เลื่อนออกนอกกรอบไม่ได้)
// - กด "ใช้รูปนี้" → ตัดด้วย canvas ได้ JPEG ตามขนาดของสัดส่วน (lib/image-crop.ts)

import { useEffect, useRef, useState } from "react";
import { AlertTriangle, Move, ZoomIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MEDIA_SIZE, cropToDataUrl, loadImage } from "@/lib/image-crop";
import type { CropRatio } from "@/types/event";

// ขนาดกรอบบนจอ (px): 16:9 = 560 × 315 · 3:4 = 315 × 420
const FRAME: Record<CropRatio, { w: number; h: number }> = {
  "4:1": { w: 560, h: 140 }, // แบนเนอร์
  "16:9": { w: 560, h: 315 },
  "3:4": { w: 315, h: 420 },
};

interface Props {
  src: string | null; // data URL ของรูปต้นฉบับ (null = ปิด)
  title?: string; // ค่าเริ่มต้น "Crop รูปโฆษณา <สัดส่วน>"
  ratio?: CropRatio; // ไม่ส่ง = 16:9
  fileName: string;
  onCancel: () => void;
  onDone: (dataUrl: string) => void;
}

export function CropDialog({ src, title, ratio = "16:9", fileName, onCancel, onDone }: Props) {
  const FRAME_W = FRAME[ratio].w;
  const FRAME_H = FRAME[ratio].h;
  const { w: OUT_W, h: OUT_H } = MEDIA_SIZE[ratio];
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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- จัดกึ่งกลางใหม่เมื่อเปลี่ยนรูป / สัดส่วน (FRAME_W/H มาจาก ratio)
  }, [src, ratio]);

  // scale = จากพิกเซลรูปจริง → พิกเซลบนจอ (cover กรอบ × zoom)
  const base = img ? Math.max(FRAME_W / img.naturalWidth, FRAME_H / img.naturalHeight) : 1; // scale ของรูปเต็มกรอบ ภาพเต็มกรอบตอนเปิด
  const scale = base * zoom;
  const dw = img ? img.naturalWidth * scale : 0;
  const dh = img ? img.naturalHeight * scale : 0;
  const clamp = (x: number, y: number) => ({ // ป้องกันลากออกนอกกรอบ ล็อกขอบไม่ให้เห็นช่องว่าง
    x: Math.min(0, Math.max(FRAME_W - dw, x)),
    y: Math.min(0, Math.max(FRAME_H - dh, y)),
  });
  const pos = clamp(offset.x, offset.y);
  const small = img !== null && (img.naturalWidth < OUT_W || img.naturalHeight < OUT_H);

  // zoom รอบจุดกึ่งกลางกรอบ
  const changeZoom = (z: number) => { // ซูมรอบจุดกลาง
    if (!img) return;
    const cx = (FRAME_W / 2 - pos.x) / scale;
    const cy = (FRAME_H / 2 - pos.y) / scale;
    const ns = base * z;
    setZoom(z);
    setOffset({ x: FRAME_W / 2 - cx * ns, y: FRAME_H / 2 - cy * ns });
  };

  const confirm = () => { // ตัดรูปแล้วส่งกลับ data URL กด "ใช้รูปนี้"
    if (!img) return;
    onDone(cropToDataUrl(img, { x: -pos.x / scale, y: -pos.y / scale, width: FRAME_W / scale, height: FRAME_H / scale }, ratio));
  };

  return (
    <Dialog open={src !== null} onOpenChange={(o) => !o && onCancel()}>
      <DialogContent className="sm:max-w-[620px]">
        <DialogHeader>
          <DialogTitle>{title ?? `Crop รูปโฆษณา ${ratio}`}</DialogTitle>
          <DialogDescription>
            {fileName}
            {img && ` · ต้นฉบับ ${img.naturalWidth} × ${img.naturalHeight} px`} · ผลลัพธ์ {OUT_W} × {OUT_H} px
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
          <span className="pointer-events-none absolute right-2 bottom-2 rounded bg-black/60 px-2 py-0.5 text-xs text-white">{ratio}</span>
        </div>

        <div className="flex items-center gap-3 text-sm">
          <ZoomIn className="size-4 text-muted-foreground" />
          <input
            type="range" // zoom แถบซูม 1–3 เท่า
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
          <Move className="size-3.5" /> ลากรูปเพื่อเลือกส่วนที่จะแสดง
        </p>
        {small && (
          <p className="flex items-center gap-1.5 text-xs text-amber-700">
            <AlertTriangle className="size-3.5" /> รูปเล็กกว่า {OUT_W} × {OUT_H} px อาจไม่คมชัด
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
