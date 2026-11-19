"use client";
// Live Preview ของ Branding — วาดจาก draft ใน wizard store (อัปเดตทันทีที่แก้)
// - PhonePreview: หน้า Event บนมือถือ (รูปปก, โลโก้, พื้นหลัง, โหมด, สีหลัก)
// - KioskPreview: จอ Kiosk แนวตั้ง / แนวนอน (16:9 หรือ 3:4) · พื้นหลัง, โลโก้, โฆษณาเลื่อนวน, กรอบ QR สีหลัก
// ใช้ในขั้น Branding (บนสุด) และขั้น Preview
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
          {/* งานข้ามวัน → แสดงวันจบด้วย */}
          {formatThaiDate(g.date, false)} · {g.startTime || "--:--"} –{" "}
          {g.endDate && g.endDate !== g.date ? `${formatThaiDate(g.endDate, false)} · ` : ""}
          {g.endTime || "--:--"}
        </p>
        {g.venue && <p className="text-xs" style={{ color: c.muted }}>{g.venue}</p>}
        <div className="mt-3 rounded-lg py-2.5 text-center text-sm font-semibold" style={{ background: c.button.bg, color: c.button.text }}>
          ลงทะเบียนเข้างาน
        </div>
      </div>
    </div>
  );
}

// Live Preview จอ Kiosk · theme.kiosk = แนวตั้ง (ค่าเดิม) / แนวนอน · รูป 16:9 หรือ 3:4 ได้ทั้ง 2 แนว
// แนวตั้ง: รูปอยู่บน (16:9 เต็มความกว้าง / 3:4 กว้าง 80% ตรงกลาง) · ชื่องาน · QR ล่างสุด
// แนวนอน + 16:9 (แบบ A): รูปใหญ่ซ้าย · ชื่องาน รายละเอียด QR ขวา
// แนวนอน + 3:4  (แบบ B): รูปแนวตั้งซ้าย · ฝั่งขวากว้าง วาง QR ลงทะเบียน + Survey คู่กันได้
// QR แสดงเฉพาะที่มีจริง (ฟอร์ม / Survey ไม่บังคับ) · ไม่มีทั้งคู่ = รายละเอียดงานอย่างเดียว
export function KioskPreview({ d }: { d: EventDraft }) {
  const g = d.general;
  const c = previewColors(d.theme);
  const srcs = d.ads.items.map((a) => a.dataUrl).filter((s): s is string => !!s);
  const [index, setIndex] = useState(0);
  const ms = Math.max(3, d.ads.seconds || 6) * 1000;
  useEffect(() => {
    if (srcs.length < 2) return;
    const t = setInterval(() => setIndex((i) => i + 1), ms); // ถ้ามีรูปโฆษณามากกว่า 1 รูป → เลื่อนทุก ms วินาที สลับรูปวนไปเรื่อย ๆ
    return () => clearInterval(t);
  }, [srcs.length, ms]);
  const current = index % Math.max(1, srcs.length);
  const hasReg = d.form.fields.length > 0;
  const hasSur = d.survey.questions.length > 0;
  const landscape = d.theme.kiosk === "landscape";
  const ratio = d.theme.mediaRatio ?? "16:9";

  // ===== ชิ้นส่วนที่ใช้ร่วมกันทุกแบบ =====
  const header = (
    <div className="flex items-center gap-2">
      <Logo d={d} size={22} />
      <span className="truncate text-[11px] font-semibold">{g.organizer || "ผู้จัดงาน"}</span>
    </div>
  );

  // ช่องรูป: โฆษณาเลื่อนวน · ไม่มีโฆษณา = รูปปก · aspect มาจากผู้เรียก
  const media = (aspect: string, extra = "") => (
    <div className={`relative overflow-hidden rounded-xl ${aspect} ${extra}`} style={{ background: c.coverBg }}>
      {srcs.length > 0 ? (
        srcs.map((src, i) => (
          // eslint-disable-next-line @next/next/no-img-element -- data URL
          <img
            key={i}
            src={src}
            alt=""
            className="absolute inset-0 size-full object-cover transition-opacity duration-700" // เลื่อนรูปโฆษณาแบบ crossfade
            style={{ opacity: i === current ? 1 : 0 }}
          />
        ))
      ) : g.cover?.dataUrl ? (
        // ไม่มีโฆษณา → แสดงรูปปกแทน (ใน Preview เท่านั้น)
        // eslint-disable-next-line @next/next/no-img-element -- data URL ของรูปปก
        <img src={g.cover.dataUrl} alt="" className="absolute inset-0 size-full object-cover" />
      ) : (
        <div className="flex size-full items-center justify-center text-[10px] opacity-60">ยังไม่มีโฆษณา / รูปปก</div>
      )}
    </div>
  );

  const qr = (label: string, sub: string, solid = true) => (
    <div
      className="flex flex-1 items-center gap-2 rounded-xl p-3"
      style={solid ? { background: c.button.bg, color: c.button.text } : { border: `1px solid ${c.muted}` }}
    >
      <span className="flex size-12 shrink-0 items-center justify-center rounded-md bg-white text-slate-900">
        <QrCode className="size-8" />
      </span>
      <div className="min-w-0 text-[11px] leading-tight">
        <p className="font-semibold">{label}</p>
        <p className="opacity-80">{sub}</p>
      </div>
    </div>
  );

  const details = (
    <div className="space-y-1 text-[11px] leading-snug" style={{ color: c.muted }}>
      <p>
        {formatThaiDate(g.date, false)} · {g.startTime || "--:--"} – {g.endTime || "--:--"}
      </p>
      {g.venue && <p className="line-clamp-2">{g.venue}</p>}
    </div>
  );

  // QR หลัก 1 อัน (แนวตั้ง / แบบ A): ลงทะเบียนก่อน · ไม่มีฟอร์ม = Survey · ไม่มีทั้งคู่ = กล่องรายละเอียดงาน
  const mainQr = hasReg
    ? qr("สแกนลงทะเบียน", `รหัส ${d.code}`)
    : hasSur
      ? qr("สแกนตอบแบบประเมิน", `รหัส ${d.code}`)
      : <div className="rounded-xl border p-3" style={{ borderColor: c.muted }}>{details}</div>;

  const dots = srcs.length > 1 && (
    <p className="text-center text-[10px]" style={{ color: c.muted }}>
      รูป {current + 1}/{srcs.length} · ทุก {Math.round(ms / 1000)} วิ
    </p>
  );

  const typeChip = (
    <span className="inline-block w-fit rounded-full px-2 py-0.5 text-[10px] font-medium" style={{ background: c.chip.bg, color: c.chip.text }}>
      {eventTypeLabel(g.type, g.typeOther)}
    </span>
  );
  const name = (size: string) => <p className={`line-clamp-2 font-bold ${size}`}>{g.nameTh || "(ยังไม่ตั้งชื่อ Event)"}</p>;

  // ===== แนวนอน + 3:4 (แบบ B) =====
  if (landscape && ratio === "3:4") {
    return (
      <div className="mx-auto flex aspect-video w-full max-w-[640px] gap-4 overflow-hidden rounded-2xl border p-4 shadow-lg" style={pageStyle(c)}>
        {media("aspect-[3/4] h-full shrink-0")}
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          {header}
          <div className="mt-2 space-y-1.5">
            {typeChip}
            {name("text-xl")}
            {(hasReg || hasSur) && details}
          </div>
          <div className="mt-auto flex gap-2">
            {hasReg && qr("สแกนลงทะเบียน", d.code)}
            {hasSur && qr("ตอบแบบประเมิน", "หลังจบงาน", !hasReg)}
            {!hasReg && !hasSur && <div className="flex-1 rounded-xl border p-3" style={{ borderColor: c.muted }}>{details}</div>}
          </div>
          {dots}
        </div>
      </div>
    );
  }

  // ===== แนวนอน + 16:9 (แบบ A) =====
  if (landscape) {
    return (
      <div className="mx-auto flex aspect-video w-full max-w-[640px] gap-4 overflow-hidden rounded-2xl border p-4 shadow-lg" style={pageStyle(c)}>
        <div className="flex min-w-0 flex-[1.6] flex-col justify-center gap-3">
          {header}
          {media("aspect-video w-full")}
          {dots}
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          {typeChip}
          {name("text-base")}
          {(hasReg || hasSur) && details}
          <div className="mt-auto">{mainQr}</div>
        </div>
      </div>
    );
  }

  // ===== แนวตั้ง (เดิม) =====
  return (
    <div className="mx-auto flex aspect-[9/16] w-full max-w-[260px] flex-col gap-3 overflow-hidden rounded-2xl border p-3 shadow-lg" style={pageStyle(c)}>
      {header}
      {ratio === "3:4" ? media("mx-auto aspect-[3/4] w-4/5 shrink-0") : media("aspect-video shrink-0")}
      {name("text-sm")}
      <div className="mt-auto">{mainQr}</div>
      {dots}
    </div>
  );
}
