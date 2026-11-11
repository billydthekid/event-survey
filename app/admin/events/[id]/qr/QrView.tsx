// app/admin/events/[id]/qr/QrView.tsx
// ส่วนแสดงผลของหน้า QR (Client Component เพราะใช้ store, state, คลิปบอร์ด และ html-to-image)
"use client";
import { use, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { ArrowLeft, Copy, Check, Download, QrCode, ShieldAlert } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { toPng } from "html-to-image";
import { useStore } from "@/lib/store";
import { STATUS_LABEL } from "@/lib/utils/status";
import { Event, Lang } from "@/types";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

// ============ พจนานุกรมข้อความ 2 ภาษา (ใช้เฉพาะหน้านี้) ============
const TEXT = {
  th: {
    back: "กลับไป Event ของฉัน",
    title: "QR ลงทะเบียน / Survey",
    subtitle: "พิมพ์ติดหน้างาน หรือส่งลิงก์ให้ผู้เข้าร่วม",
    qrRegister: "QR ลงทะเบียน",
    qrSurvey: "QR Survey",
    download: "ดาวน์โหลด PNG",
    copy: "คัดลอกลิงก์",
    copied: "คัดลอกแล้ว",
    copyFail: "คัดลอกไม่สำเร็จ",
    downloadFail: "ดาวน์โหลดไม่สำเร็จ",
    note: "QR ไม่เปลี่ยนแม้แก้ไขข้อมูล Event · ใช้ซ้ำได้ตลอดงาน",
    notFound: "ไม่พบ Event / ไม่มีสิทธิ์",
    notFoundHint: "Event นี้ไม่มีอยู่ ถูกลบไปแล้ว หรือไม่ได้มอบหมายให้คุณดูแล",
    draft: "ยังไม่มี QR ต้องเผยแพร่ก่อน",
    draftHint: "Event ที่เป็นฉบับร่างยังไม่มีลิงก์ลงทะเบียนและ Survey",
  },
  en: {
    back: "Back to My Events",
    title: "Registration / Survey QR",
    subtitle: "Print it at the venue or share the link with attendees",
    qrRegister: "Registration QR",
    qrSurvey: "Survey QR",
    download: "Download PNG",
    copy: "Copy link",
    copied: "Copied",
    copyFail: "Copy failed",
    downloadFail: "Download failed",
    note: "The QR stays the same even if event details change · reusable for the whole event",
    notFound: "Event not found / No permission",
    notFoundHint: "This event doesn't exist, was deleted, or isn't assigned to you",
    draft: "No QR yet — publish the event first",
    draftHint: "Draft events don't have registration or survey links yet",
  },
};
type Text = (typeof TEXT)["th"];

// อ่าน origin ของเว็บ (เช่น "http://localhost:3000") แบบปลอดภัยกับการ render ฝั่ง server
// - ฝั่ง server ไม่มี window → ได้ "" ไปก่อน
// - ฝั่งเบราว์เซอร์ → ได้ window.location.origin
const noopSubscribe = () => () => {};
function useOrigin() {
  return useSyncExternalStore(
    noopSubscribe,
    () => window.location.origin,
    () => ""
  );
}

// ============ ส่วนหลัก ============
export function QrView({ params }: { params: Promise<{ id: string }> }) {
  // use() รอ Promise ให้เสร็จ แล้วคืนค่าจริง เช่น { id: "e-workshop" }
  // ระหว่างรอ React จะแสดง fallback ของ <Suspense> ใน page.tsx แทน
  const { id } = use(params);

  const user = useStore((s) => s.currentUser);
  const hydrated = useStore((s) => s.hydrated);
  const event = useStore((s) => s.events.find((e) => e.id === id));
  const origin = useOrigin();

  const [lang, setLang] = useState<Lang>("th");
  const t = TEXT[lang];

  // ยังโหลดข้อมูลจาก localStorage ไม่เสร็จ → ยังไม่ตัดสินอะไร (กันขึ้น "ไม่พบ" แวบหนึ่ง)
  if (!hydrated) return null;

  const langToggle = <LangToggle lang={lang} setLang={setLang} />;

  // ด่านที่ 1: ไม่พบ / ถูกลบ / ไม่ได้รับมอบหมาย → ไม่แสดงข้อมูล Event ใดๆ
  const allowed =
    event !== undefined &&
    event.status !== "deleted" &&
    user !== null &&
    event.adminIds.includes(user.id);

  if (!allowed) {
    return (
      <div>
        <div className="flex justify-end">{langToggle}</div>
        <Card className="mt-4 items-center gap-2 rounded-2xl py-12 text-center ring-slate-200">
          <ShieldAlert size={32} className="text-slate-400" />
          <p className="text-lg font-semibold">{t.notFound}</p>
          <p className="text-sm text-slate-500">{t.notFoundHint}</p>
          <BackButton label={t.back} className="mt-3" />
        </Card>
      </div>
    );
  }

  return (
    <div>
      <Header event={event} t={t} langToggle={langToggle} />

      {event.status === "draft" ? (
        // ด่านที่ 2: ฉบับร่าง → ยังไม่มี QR
        <Card className="mt-6 items-center gap-2 rounded-2xl py-12 text-center ring-slate-200">
          <QrCode size={32} className="text-slate-400" />
          <p className="text-lg font-semibold">{t.draft}</p>
          <p className="text-sm text-slate-500">{t.draftHint}</p>
        </Card>
      ) : (
        // scheduled / active / ended → QR 2 ชุด
        <>
          <div className="mt-6 grid max-w-3xl gap-4 sm:grid-cols-2">
            <QrCard
              eventName={event.name.th}
              title={t.qrRegister}
              url={`${origin}/r/${event.code}`}
              fileName={`${event.code}-register.png`}
              t={t}
            />
            <QrCard
              eventName={event.name.th}
              title={t.qrSurvey}
              url={`${origin}/s/${event.code}`}
              fileName={`${event.code}-survey.png`}
              t={t}
            />
          </div>
          <p className="mt-4 text-xs text-slate-500">{t.note}</p>
        </>
      )}
    </div>
  );
}

// ============ ส่วนหัว: ปุ่มกลับ + ชื่อ Event + ป้ายสถานะ ============
function Header({ event, t, langToggle }: { event: Event; t: Text; langToggle: React.ReactNode }) {
  const status = STATUS_LABEL[event.status];
  return (
    <div>
      <div className="flex items-center justify-between">
        <BackButton label={t.back} />
        {langToggle}
      </div>
      <div className="mt-3 flex items-center gap-3">
        <h1 className="text-3xl font-bold">{t.title}</h1>
        <Badge className={status.color}>{status.text}</Badge>
      </div>
      <p className="mt-1 text-sm text-slate-500">
        {event.name.th} · {event.code} · {t.subtitle}
      </p>
    </div>
  );
}

// ============ การ์ด QR 1 ชุด ============
function QrCard({
  eventName,
  title,
  url,
  fileName,
  t,
}: {
  eventName: string;
  title: string;
  url: string;
  fileName: string;
  t: Text;
}) {
  // ref ชี้ไปที่ "กล่องที่จะถ่ายเป็นรูป" (ชื่อ Event + หัวข้อ + QR + ลิงก์)
  const boxRef = useRef<HTMLDivElement>(null);
  // ข้อความแจ้งสั้นๆ ในการ์ด เช่น "คัดลอกแล้ว" (null = ไม่แสดง)
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);

  // แสดงข้อความแจ้ง 2 วินาทีแล้วหายไป
  const flash = (ok: boolean, text: string) => {
    setNotice({ ok, text });
    setTimeout(() => setNotice(null), 2000);
  };

  // คัดลอกลิงก์ลงคลิปบอร์ด
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      flash(true, t.copied);
    } catch {
      flash(false, t.copyFail);
    }
  };

  // แปลงกล่องเป็นรูป PNG แล้วสั่งดาวน์โหลด
  const handleDownload = async () => {
    if (!boxRef.current) return;
    try {
      // toPng คืนค่าเป็น data URL เช่น "data:image/png;base64,iVBORw0..."
      const dataUrl = await toPng(boxRef.current, {
        pixelRatio: 2,            // ความละเอียด 2 เท่า พิมพ์แล้วคมขึ้น
        backgroundColor: "#ffffff",
        skipFonts: true,          // ข้ามการฝังฟอนต์จาก Google Fonts (กัน error ข้ามโดเมน)
      });
      // สร้างลิงก์ <a download> ชั่วคราวแล้วกดให้ เบราว์เซอร์จะดาวน์โหลดไฟล์
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = fileName;      // เช่น "FIG-1017-register.png"
      a.click();
    } catch {
      flash(false, t.downloadFail);
    }
  };

  return (
    <Card className="gap-3 rounded-2xl px-4 ring-slate-200">
      {/* ===== กล่องนี้คือส่วนที่จะกลายเป็นรูป PNG ===== */}
      <div ref={boxRef} className="flex flex-col items-center gap-3 bg-white p-2 text-center">
        <div>
          <p className="text-xs text-slate-500">{eventName}</p>
          <p className="font-semibold">{title}</p>
        </div>
        <div className="rounded-xl border border-slate-200 p-2">
          {/* url ยังว่างตอน render ฝั่ง server → แสดง QR เมื่อได้ origin แล้ว */}
          {url.startsWith("http") && <QRCodeSVG value={url} size={150} marginSize={1} />}
        </div>
        <p className="w-full rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-xs break-all">
          {url}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Button variant="outline" onClick={handleDownload}>
          <Download /> {t.download}
        </Button>
        <Button variant="outline" onClick={handleCopy}>
          <Copy /> {t.copy}
        </Button>
      </div>

      {/* ข้อความแจ้งสั้นๆ (แทน Toast เพราะยังไม่มี Toaster ใน layout) */}
      <p
        aria-live="polite"
        className={`h-4 text-center text-xs ${notice?.ok ? "text-green-600" : "text-red-600"}`}
      >
        {notice && (
          <span className="inline-flex items-center gap-1">
            {notice.ok && <Check size={12} />} {notice.text}
          </span>
        )}
      </p>
    </Card>
  );
}

// ============ ปุ่มกลับไปหน้า Event ของฉัน ============
function BackButton({ label, className }: { label: string; className?: string }) {
  return (
    <Button
      variant="ghost"
      nativeButton={false}
      render={<Link href="/admin/events" />}
      className={`text-blue-600 ${className ?? ""}`}
    >
      <ArrowLeft /> {label}
    </Button>
  );
}

// ============ ปุ่มสลับภาษา TH / EN ============
function LangToggle({ lang, setLang }: { lang: Lang; setLang: (l: Lang) => void }) {
  return (
    <div className="flex overflow-hidden rounded-full bg-white shadow-sm">
      {(["th", "en"] as Lang[]).map((l) => (
        <button
          key={l}
          onClick={() => setLang(l)}
          className={`px-3 py-1 text-sm ${lang === l ? "bg-slate-100 font-semibold" : ""}`}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
