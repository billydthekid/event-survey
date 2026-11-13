// lib/image-crop.ts
// ตัด (crop) รูปในเบราว์เซอร์ด้วย <canvas> แล้วเก็บเป็น data URL (ยังไม่มี API อัปโหลดจริง)
// รูปโฆษณาบน Kiosk = 16:9 ขนาด 1920 × 1080 px บีบอัดเป็น JPEG เพื่อไม่ให้ localStorage เต็ม (~200–400 KB ต่อรูป)

export const AD_WIDTH = 1920;
export const AD_HEIGHT = 1080;
export const AD_RATIO = AD_WIDTH / AD_HEIGHT; // 16:9

export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });
}

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("โหลดรูปไม่ได้"));
    img.src = src;
  });
}

/** พื้นที่ของรูปต้นฉบับที่จะตัด (หน่วย px ของรูปต้นฉบับ) */
export interface CropRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** ตัดรูปตาม rect แล้วย่อ/ขยายเป็น 1920×1080 → data URL (JPEG) */
export function cropToDataUrl(img: HTMLImageElement, rect: CropRect, quality = 0.85): string {
  const canvas = document.createElement("canvas");
  canvas.width = AD_WIDTH;
  canvas.height = AD_HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("เบราว์เซอร์ไม่รองรับ canvas");
  ctx.fillStyle = "#FFFFFF"; // PNG พื้นใส → พื้นขาว (JPEG ไม่มีความโปร่งใส)
  ctx.fillRect(0, 0, AD_WIDTH, AD_HEIGHT);
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, rect.x, rect.y, rect.width, rect.height, 0, 0, AD_WIDTH, AD_HEIGHT);
  return canvas.toDataURL("image/jpeg", quality);
}

/** ขนาดไฟล์โดยประมาณของ data URL (KB) */
export const dataUrlKB = (url: string) => Math.round((url.length * 3) / 4 / 1024);

/**
 * ย่อรูปให้อยู่ในกรอบ maxW × maxH (ไม่ตัด ไม่ขยาย) → data URL
 * โลโก้ใช้ PNG (คงพื้นใส) · รูปพื้นหลังใช้ JPEG (ไฟล์เล็ก)
 */
export async function resizeToDataUrl(
  src: string,
  maxW: number,
  maxH: number,
  type: "image/png" | "image/jpeg" = "image/jpeg",
  quality = 0.82
): Promise<string> {
  const img = await loadImage(src);
  const scale = Math.min(1, maxW / img.naturalWidth, maxH / img.naturalHeight);
  const w = Math.max(1, Math.round(img.naturalWidth * scale));
  const h = Math.max(1, Math.round(img.naturalHeight * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("เบราว์เซอร์ไม่รองรับ canvas");
  if (type === "image/jpeg") {
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, w, h);
  }
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, 0, 0, w, h);
  return canvas.toDataURL(type, quality);
}
