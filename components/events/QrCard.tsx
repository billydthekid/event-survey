// components/events/QrCard.tsx
// การ์ด QR 1 ใบ (หน้า Event ④) — รูป QR + ลิงก์ + ปุ่ม PNG / SVG / Copy link
// ใช้ 2 ใบ: QR ลงทะเบียน (/r/<code>) และ QR แบบสอบถาม (/s/<code>) — ลิงก์แบบเดียวกับหน้า QR ของฝั่งผู้จัดงาน
"use client";
import { useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";

interface QrCardProps {
  title: string;
  url: string;          // ลิงก์เต็ม เช่น "http://localhost:3000/r/FIG-1017" (ว่าง = ยังไม่รู้ origin)
  fileBase: string;     // ชื่อไฟล์ตอนดาวน์โหลด (ไม่ต้องใส่นามสกุล) เช่น "QR-ลงทะเบียน-FIG-1017"
  disabledText?: string; // มีค่า = ยังไม่มี QR (เช่น Event ฉบับร่าง) → แสดงข้อความนี้แทน
}

// ---------- ดาวน์โหลดไฟล์ ----------
// สร้างลิงก์ <a download> ชั่วคราวแล้วกดให้เอง
function download(href: string, name: string) {
  const a = document.createElement("a");
  a.href = href;
  a.download = name;
  a.click();
}

const PNG_SIZE = 512;   // ขนาดรูป PNG ที่ดาวน์โหลด (px)

export function QrCard({ title, url, fileBase, disabledText }: QrCardProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [copied, setCopied] = useState<"ok" | "fail" | null>(null);

  // แปลง <svg> บนหน้าจอเป็นข้อความ (ใช้ทั้ง SVG และ PNG)
  const svgText = () => (svgRef.current ? new XMLSerializer().serializeToString(svgRef.current) : "");

  // SVG: เอาข้อความ svg ใส่ Blob แล้วดาวน์โหลด
  const handleSvg = () => {
    const blob = new Blob([svgText()], { type: "image/svg+xml" });
    const href = URL.createObjectURL(blob);
    download(href, `${fileBase}.svg`);
    URL.revokeObjectURL(href);
  };

  // PNG: โหลด svg เป็นรูป → วาดลง canvas พื้นขาว → แปลงเป็น PNG
  const handlePng = () => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = PNG_SIZE;
      canvas.height = PNG_SIZE;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, PNG_SIZE, PNG_SIZE);
      ctx.drawImage(img, 0, 0, PNG_SIZE, PNG_SIZE);
      download(canvas.toDataURL("image/png"), `${fileBase}.png`);
    };
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgText())}`;
  };

  // Copy link: คลิปบอร์ดอาจใช้ไม่ได้ (เช่น ไม่ใช่ https) → แจ้ง "คัดลอกไม่สำเร็จ"
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied("ok");
    } catch {
      setCopied("fail");
    }
    setTimeout(() => setCopied(null), 2000);
  };

  const ready = !disabledText && url !== "";
  const btn = "rounded-lg bg-slate-100 px-3 py-2 text-sm font-semibold hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <div className="flex gap-4 rounded-xl bg-white p-5 shadow-sm">
      {/* ---------- รูป QR ---------- */}
      <div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-lg border border-slate-100 bg-white p-1.5">
        {ready ? (
          <QRCodeSVG ref={svgRef} value={url} size={100} marginSize={1} title={title} />
        ) : (
          <span className="text-center text-xs text-slate-400">ยังไม่มี QR</span>
        )}
      </div>

      {/* ---------- ลิงก์ + ปุ่ม ---------- */}
      <div className="min-w-0 flex-1">
        <h2 className="font-bold">{title}</h2>
        <p className="mt-3 truncate rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-500" suppressHydrationWarning>
          {disabledText ?? url}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button onClick={handlePng} disabled={!ready} className={btn}>PNG</button>
          <button onClick={handleSvg} disabled={!ready} className={btn}>SVG</button>
          <button onClick={handleCopy} disabled={!ready} className={`${btn} text-blue-600`}>
            {copied === "ok" ? "คัดลอกแล้ว" : copied === "fail" ? "คัดลอกไม่สำเร็จ" : "Copy link"}
          </button>
        </div>
      </div>
    </div>
  );
}
