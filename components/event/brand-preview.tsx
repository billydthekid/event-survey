"use client";
// Live Preview ของ Branding — วาดจาก draft ใน wizard store (อัปเดตทันทีที่แก้)
// - PhonePreview: หน้า Event บนมือถือ (รูปปก, โลโก้, พื้นหลัง, โหมด, สีหลัก)
// - KioskPreview: จอ Kiosk แนวตั้ง (พื้นหลัง, โลโก้, โฆษณาเลื่อนวน, กรอบ QR สีหลัก)
// ใช้ในขั้น Branding (ซ้าย) และขั้น Preview (เต็มจอ)
// หมายเหตุ: ตอนนี้ธีมมีผลเฉพาะใน Wizard · หน้าจริง /r, /s และจอ Kiosk ยังใช้แค่สีหลัก + โหมด

import { useEffect, useState } from "react";
import { ImageIcon, QrCode } from "lucide-react";
import { eventTypeLabel } from "@/lib/event-types";
import { formatThaiDate } from "@/lib/utils/date";
import { previewColors } from "@/lib/theme-presets";
import type { EventDraft } from "@/types/event";

function pageStyle(c: ReturnType<typeof previewColors>): React.CSSProperties {
  return c.pageImage
    ? { backgroundColor: c.page, backgroundImage: `url(${c.pageImage})`, backgroundSize: "cover", backgroundPosition: "center", color: c.text }
    : { backgroundColor: c.page, color: c.text };
}

function Logo({ d, size }: { d: EventDraft; size: number }) {
  const c = previewColors(d.theme);
  if (d.theme.logo?.dataUrl) {
    // eslint-disable-next-line @next/next/no-img-element -- data URL จากเครื่องผู้ใช้
    return <img src={d.theme.logo.dataUrl} alt="" style={{ width: size, height: size }} className="rounded-md object-contain" />;
  }
  return (
    <span
      style={{ width: size, height: size, background: c.button.bg, color: c.button.text, fontSize: size * 0.38 }}
      className="flex items-center justify-center rounded-md font-semibold"
    >
      {d.code.slice(0, 2)}
    </span>
  );
}

export function PhonePreview({ d }: { d: EventDraft }) {
  const g = d.general;
  const c = previewColors(d.theme);
  return (
    <div className="mx-auto w-full max-w-[300px] overflow-hidden rounded-[2rem] border shadow-lg" style={pageStyle(c)}>
      <div className="flex items-center justify-between px-4 pt-4 text-[11px]" style={{ color: c.muted }}>
        <Logo d={d} size={26} />
        <span>TH</span>
      </div>
      <div className="mx-4 mt-3 aspect-video overflow-hidden rounded-xl" style={{ background: c.coverBg }}>
        {g.cover?.dataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- data URL ของรูปปกที่ crop แล้ว
          <img src={g.cover.dataUrl} alt="" className="size-full object-cover" />
        ) : (
          <div className="flex size-full items-center justify-center opacity-50">
            <ImageIcon className="size-6" />
          </div>
        )}
      </div>
      <div className="space-y-1 p-4">
        <span className="inline-block rounded-full px-2 py-0.5 text-[11px] font-medium" style={{ background: c.chip.bg, color: c.chip.text }}>
          {eventTypeLabel(g.type, g.typeOther)}
        </span>
        <p className="text-base font-bold">{g.nameTh || "(ยังไม่ตั้งชื่อ Event)"}</p>
        <p className="text-xs" style={{ color: c.muted }}>
          {formatThaiDate(g.date, false)} · {g.startTime || "--:--"} – {g.endTime || "--:--"}
        </p>
        {g.venue && <p className="text-xs" style={{ color: c.muted }}>{g.venue}</p>}
        <div className="mt-3 rounded-lg py-2.5 text-center text-sm font-semibold" style={{ background: c.button.bg, color: c.button.text }}>
          ลงทะเบียนเข้างาน
        </div>
      </div>
    </div>
  );
}

export function KioskPreview({ d }: { d: EventDraft }) {
  const g = d.general;
  const c = previewColors(d.theme);
  const srcs = d.ads.items.map((a) => a.dataUrl).filter((s): s is string => !!s);
  const [index, setIndex] = useState(0);
  const ms = Math.max(3, d.ads.seconds || 6) * 1000;
  useEffect(() => {
    if (srcs.length < 2) return;
    const t = setInterval(() => setIndex((i) => i + 1), ms);
    return () => clearInterval(t);
  }, [srcs.length, ms]);
  const current = index % Math.max(1, srcs.length);

  return (
    <div className="mx-auto flex aspect-[9/16] w-full max-w-[260px] flex-col gap-3 overflow-hidden rounded-2xl border p-3 shadow-lg" style={pageStyle(c)}>
      <div className="flex items-center gap-2">
        <Logo d={d} size={22} />
        <span className="truncate text-[11px] font-semibold">{g.organizer || "ผู้จัดงาน"}</span>
      </div>
      <div className="relative aspect-video overflow-hidden rounded-xl" style={{ background: c.coverBg }}>
        {srcs.length > 0 ? (
          srcs.map((src, i) => (
            // eslint-disable-next-line @next/next/no-img-element -- data URL
            <img
              key={i}
              src={src}
              alt=""
              className="absolute inset-0 size-full object-cover transition-opacity duration-700"
              style={{ opacity: i === current ? 1 : 0 }}
            />
          ))
        ) : (
          <div className="flex size-full items-center justify-center text-[10px] opacity-60">ยังไม่มีโฆษณา</div>
        )}
      </div>
      <p className="line-clamp-2 text-sm font-bold">{g.nameTh || "(ยังไม่ตั้งชื่อ Event)"}</p>
      <div className="mt-auto rounded-xl p-3" style={{ background: c.button.bg, color: c.button.text }}>
        <div className="flex items-center gap-2">
          <span className="flex size-12 items-center justify-center rounded-md bg-white text-slate-900">
            <QrCode className="size-8" />
          </span>
          <div className="text-[11px] leading-tight">
            <p className="font-semibold">สแกนลงทะเบียน</p>
            <p className="opacity-80">รหัส {d.code}</p>
          </div>
        </div>
      </div>
      {srcs.length > 1 && (
        <p className="text-center text-[10px]" style={{ color: c.muted }}>
          รูป {current + 1}/{srcs.length} · ทุก {Math.round(ms / 1000)} วิ
        </p>
      )}
    </div>
  );
}
