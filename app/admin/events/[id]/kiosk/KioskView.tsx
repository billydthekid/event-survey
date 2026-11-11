// app/admin/events/[id]/kiosk/KioskView.tsx
// จอ Kiosk เต็มจอ เปิดทิ้งไว้ที่หน้างานให้ผู้เข้าร่วมสแกน QR
// (Client Component เพราะใช้ store, state และ Fullscreen API ของเบราว์เซอร์)
"use client";
import { use, useRef, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CalendarDays, MapPin, Maximize, Minimize, ShieldAlert, Ticket, X } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useStore } from "@/lib/store";
import { STATUS_LABEL } from "@/lib/utils/status";
import { Event, Lang } from "@/types";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

// ============ พจนานุกรมข้อความ 2 ภาษา (ใช้เฉพาะหน้านี้) ============
const TEXT = {
  th: {
    fullscreen: "เต็มจอ",
    exitFullscreen: "ออกจากเต็มจอ",
    exit: "ออกจาก Kiosk",
    back: "กลับไป Event ของฉัน",
    scanRegister: "สแกนเพื่อลงทะเบียน",
    scanSurvey: "สแกนเพื่อตอบแบบสอบถาม",
    noDate: "ยังไม่กำหนดวัน",
    noVenue: "ยังไม่ระบุสถานที่",
    ended: "งานสิ้นสุดแล้ว ขอบคุณที่ร่วมงาน",
    endedHint: "ปิดรับลงทะเบียนแล้ว",
    draft: "เผยแพร่ก่อนจึงเปิด Kiosk ได้",
    draftHint: "Event นี้ยังเป็นฉบับร่าง",
    notFound: "ไม่พบ Event / ไม่มีสิทธิ์",
    notFoundHint: "Event นี้ไม่มีอยู่ ถูกลบไปแล้ว หรือไม่ได้มอบหมายให้คุณดูแล",
  },
  en: {
    fullscreen: "Fullscreen",
    exitFullscreen: "Exit fullscreen",
    exit: "Exit Kiosk",
    back: "Back to My Events",
    scanRegister: "Scan to register",
    scanSurvey: "Scan to take the survey",
    noDate: "Date not set",
    noVenue: "Venue not set",
    ended: "This event has ended. Thank you for joining!",
    endedHint: "Registration is closed",
    draft: "Publish the event before opening Kiosk",
    draftHint: "This event is still a draft",
    notFound: "Event not found / No permission",
    notFoundHint: "This event doesn't exist, was deleted, or isn't assigned to you",
  },
};
type Text = (typeof TEXT)["th"];

// ============ hooks อ่านค่าจากเบราว์เซอร์ (ฝั่ง server ไม่มี window/document) ============
const noopSubscribe = () => () => {};

// origin ของเว็บ เช่น "http://localhost:3000"
function useOrigin() {
  return useSyncExternalStore(noopSubscribe, () => window.location.origin, () => "");
}

// ตอนนี้อยู่ในโหมดเต็มจอหรือไม่ — อัปเดตเองทุกครั้งที่เข้า/ออกเต็มจอ (รวมถึงกด Esc)
function subscribeFullscreen(onChange: () => void) {
  document.addEventListener("fullscreenchange", onChange);
  return () => document.removeEventListener("fullscreenchange", onChange);
}
function useIsFullscreen() {
  return useSyncExternalStore(subscribeFullscreen, () => document.fullscreenElement !== null, () => false);
}

// ============ ส่วนหลัก ============
export function KioskView({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params); // เช่น { id: "e-workshop" }

  const user = useStore((s) => s.currentUser);
  const hydrated = useStore((s) => s.hydrated);
  const event = useStore((s) => s.events.find((e) => e.id === id));
  const origin = useOrigin();
  const isFullscreen = useIsFullscreen();
  const router = useRouter();

  const [lang, setLang] = useState<Lang>("th");
  const t = TEXT[lang];

  // rootRef = กล่องเต็มจอทั้งหน้า (ตัวที่จะสั่ง requestFullscreen)
  const rootRef = useRef<HTMLDivElement>(null);

  // ปุ่มเต็มจอ: ต้องถูกเรียกจากการคลิกของผู้ใช้เท่านั้น เบราว์เซอร์ถึงจะยอม
  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await rootRef.current?.requestFullscreen();
      }
    } catch {
      // บางเบราว์เซอร์/บาง iframe ไม่อนุญาต → ไม่ทำอะไร ใช้งานแบบไม่เต็มจอต่อได้
    }
  };

  // ปุ่มออก: ออกจากเต็มจอก่อน (ถ้าอยู่) แล้วกลับหน้า Event ของฉัน
  const handleExit = async () => {
    if (document.fullscreenElement) {
      await document.exitFullscreen().catch(() => {});
    }
    router.push("/admin/events");
  };

  // ยังโหลดข้อมูลจาก localStorage ไม่เสร็จ → ยังไม่ตัดสินอะไร
  if (!hydrated) return null;

  // ด่านตรวจสิทธิ์ (เหมือนหน้า QR)
  const allowed =
    event !== undefined &&
    event.status !== "deleted" &&
    user !== null &&
    event.adminIds.includes(user.id);

  // แถบบน: โลโก้ + TH/EN + เต็มจอ + ออก
  const topBar = (
    <header className="flex items-center justify-between px-8 py-5">
      <div className="flex items-center gap-2 font-bold">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">
          <Ticket size={18} />
        </div>
        Event<span className="-ml-2 text-blue-600">Survey</span>
      </div>
      <div className="flex items-center gap-2">
        <LangToggle lang={lang} setLang={setLang} />
        <Button variant="outline" onClick={toggleFullscreen} className="bg-white">
          {isFullscreen ? <Minimize /> : <Maximize />}
          {isFullscreen ? t.exitFullscreen : t.fullscreen}
        </Button>
        {/* ปุ่มออก: เล็กและสีจาง เพราะผู้เข้าร่วมก็เห็นจอนี้ */}
        <Button variant="ghost" size="sm" onClick={handleExit} className="text-slate-400">
          <X /> {t.exit}
        </Button>
      </div>
    </header>
  );

  return (
    // fixed inset-0 = ติดกับขอบจอทั้ง 4 ด้าน → ปิดทับ Sidebar/Topbar ของ admin
    // z-50 = อยู่ชั้นบนสุด
    <div
      ref={rootRef}
      className="fixed inset-0 z-50 flex flex-col overflow-auto"
      style={{ background: "linear-gradient(180deg, #E6E3F6 0%, #E3ECFB 30%, #F4F2F7 100%)" }}
    >
      {topBar}

      <main className="flex flex-1 flex-col items-center justify-center px-8 pb-12">
        {!allowed ? (
          // ไม่พบ / ถูกลบ / ไม่มีสิทธิ์ → ไม่แสดงข้อมูล Event
          <MessageCard
            icon={<ShieldAlert size={40} className="text-slate-400" />}
            title={t.notFound}
            hint={t.notFoundHint}
            action={
              <Button variant="ghost" nativeButton={false} render={<Link href="/admin/events" />} className="mt-3 text-blue-600">
                <ArrowLeft /> {t.back}
              </Button>
            }
          />
        ) : event.status === "draft" ? (
          <MessageCard title={t.draft} hint={t.draftHint} />
        ) : (
          <KioskContent event={event} lang={lang} t={t} origin={origin} />
        )}
      </main>
    </div>
  );
}

// ============ เนื้อหา Kiosk (scheduled / active / ended) ============
function KioskContent({ event, lang, t, origin }: { event: Event; lang: Lang; t: Text; origin: string }) {
  const status = STATUS_LABEL[event.status];
  const ended = event.status === "ended";
  const screen = event.kiosk.screen; // "register" | "survey" | "both"

  // เลือกว่าจะแสดง QR ใบไหน
  // - QR ลงทะเบียน: screen เป็น register หรือ both และงานยังไม่จบ (จบแล้ว = ปิดรับ)
  // - QR Survey: screen เป็น survey หรือ both (งานจบแล้วก็ยังตอบได้)
  const showRegister = !ended && (screen === "register" || screen === "both");
  const showSurvey = screen === "survey" || screen === "both";

  // ชื่องาน: ถ้าเลือก EN และมีชื่ออังกฤษ ใช้ชื่ออังกฤษ ไม่งั้นใช้ชื่อไทย
  const name = lang === "en" && event.name.en ? event.name.en : event.name.th;
  const time = event.startTime ? ` · ${event.startTime} – ${event.endTime}` : "";

  return (
    <div className="flex w-full max-w-4xl flex-col items-center text-center">
      <Badge className={`h-6 px-3 text-sm ${status.color}`}>{status.text}</Badge>
      <h1 className="mt-4 text-5xl font-bold">{name}</h1>
      <div className="mt-4 flex flex-wrap justify-center gap-x-6 gap-y-1 text-lg text-slate-600">
        <span className="inline-flex items-center gap-2">
          <CalendarDays size={20} /> {event.date ? event.date + time : t.noDate}
        </span>
        <span className="inline-flex items-center gap-2">
          <MapPin size={20} /> {event.venue || t.noVenue}
        </span>
      </div>

      {/* งานจบแล้ว → ข้อความแทน QR ลงทะเบียน */}
      {ended && (
        <Card className="mt-8 w-full max-w-md items-center gap-1 rounded-3xl py-6 ring-slate-200">
          <p className="text-2xl font-semibold">{t.ended}</p>
          <p className="text-slate-500">{t.endedHint}</p>
        </Card>
      )}

      {(showRegister || showSurvey) && (
        <div className="mt-8 flex flex-wrap justify-center gap-6">
          {showRegister && <KioskQr title={t.scanRegister} url={`${origin}/r/${event.code}`} />}
          {showSurvey && <KioskQr title={t.scanSurvey} url={`${origin}/s/${event.code}`} />}
        </div>
      )}
    </div>
  );
}

// ============ การ์ด QR ขนาดใหญ่ ============
function KioskQr({ title, url }: { title: string; url: string }) {
  return (
    <Card className="w-80 items-center gap-4 rounded-3xl px-6 py-6 ring-slate-200">
      <p className="text-xl font-semibold text-blue-700">{title}</p>
      <div className="rounded-2xl border border-slate-200 bg-white p-3">
        {/* รอ origin ฝั่งเบราว์เซอร์ก่อน กัน QR ฝังลิงก์ผิด */}
        {url.startsWith("http") ? (
          <QRCodeSVG value={url} size={240} marginSize={1} />
        ) : (
          <div className="h-60 w-60" />
        )}
      </div>
      <p className="text-sm break-all text-slate-500">{url}</p>
    </Card>
  );
}

// ============ การ์ดข้อความ (ไม่มีสิทธิ์ / ฉบับร่าง) ============
function MessageCard({
  icon,
  title,
  hint,
  action,
}: {
  icon?: React.ReactNode;
  title: string;
  hint: string;
  action?: React.ReactNode;
}) {
  return (
    <Card className="w-full max-w-lg items-center gap-2 rounded-3xl py-12 text-center ring-slate-200">
      {icon}
      <p className="text-2xl font-semibold">{title}</p>
      <p className="text-slate-500">{hint}</p>
      {action}
    </Card>
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
