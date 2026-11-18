// app/admin/events/[id]/kiosk/KioskView.tsx
// จอ Kiosk เต็มจอ เปิดทิ้งไว้ที่หน้างานให้ผู้เข้าร่วมสแกน QR (ดีไซน์ตาม Figma K1–K5)
// (Client Component เพราะใช้ store, state, นาฬิกา และ Fullscreen API ของเบราว์เซอร์)
//
// ไฟล์นี้ดูแล: ตรวจสิทธิ์ · เลือกภาษา · เลือกแนวตั้ง/แนวนอนตามจอ + ย่อ/ขยายให้เต็มจอ · ปุ่มเต็มจอ/ออก
// หน้าตาจอจริงอยู่ใน KioskScreen.tsx · การตัดสินว่าแสดงหน้าไหนอยู่ใน kioskModel.ts
"use client";
import { use, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ShieldAlert } from "lucide-react";
import { useStore } from "@/lib/store";
import { useWizardStore } from "@/lib/wizard-store";
import { useNow } from "@/lib/hooks/useNow";
import { Lang } from "@/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { buildKioskModel, getKioskScene } from "./kioskModel";
import { KioskScreen, pageColor, type KioskLayout } from "./KioskScreen";

// ============ ข้อความของปุ่ม/หน้าแจ้งเตือนฝั่ง admin ============
const TEXT = {
  th: {
    fullscreen: "เต็มจอ",
    exitFullscreen: "ออกจากเต็มจอ",
    exit: "ออกจาก Kiosk",
    back: "ไปที่ Event ที่ได้รับมอบหมาย",
    backHome: "กลับภาพรวมทุก Event",
    backDashboard: "กลับไป Dashboard",
    draft: "เผยแพร่ก่อนจึงเปิด Kiosk ได้",
    draftHint: "Event นี้ยังเป็นฉบับร่าง",
    notFound: "ไม่พบ Event / ไม่มีสิทธิ์",
    notFoundHint: "Event นี้ไม่มีอยู่ ถูกลบไปแล้ว หรือไม่ได้มอบหมายให้คุณดูแล",
  },
  en: {
    fullscreen: "Fullscreen",
    exitFullscreen: "Exit fullscreen",
    exit: "Exit Kiosk",
    back: "Go to assigned event",
    backHome: "Back to all events",
    backDashboard: "Back to Dashboard",
    draft: "Publish the event before opening Kiosk",
    draftHint: "This event is still a draft",
    notFound: "Event not found / No permission",
    notFoundHint: "This event doesn't exist, was deleted, or isn't assigned to you",
  },
};

// ผืนผ้าใบออกแบบที่ 1080×1920 (Full HD แนวตั้ง) และ 1920×1080 (Full HD แนวนอน)
const CANVAS_W = 1080;
const CANVAS_H = 1920;
const PORTRAIT_MIN_H = 1400; // จอแนวตั้งที่เตี้ยสุดที่ยังวางรูป + ชื่องาน + QR ได้ครบ (3:4 = 1440)
const LANDSCAPE_H = 1080;
const LANDSCAPE_RATIO = 1.2; // กว้าง/สูง ตั้งแต่ค่านี้ใช้เลย์เอาต์แนวนอน

// ============ hooks อ่านค่าจากเบราว์เซอร์ (ฝั่ง server ไม่มี window/document) ============
const noopSubscribe = () => () => {};

function useOrigin() {
  return useSyncExternalStore(noopSubscribe, () => window.location.origin, () => "");
}

function subscribeFullscreen(onChange: () => void) {
  document.addEventListener("fullscreenchange", onChange);
  return () => document.removeEventListener("fullscreenchange", onChange);
}
function useIsFullscreen() {
  return useSyncExternalStore(subscribeFullscreen, () => document.fullscreenElement !== null, () => false);
}

// ขนาดพื้นที่ที่มองเห็น "กว้างxสูง" (string เพื่อให้ useSyncExternalStore เทียบค่าได้)
// ใช้ documentElement.clientWidth/Height ไม่ใช้ window.innerWidth:
// บนมือถือ ถ้าหน้าข้างใต้กว้างเกินจอ innerWidth จะใหญ่กว่าจอจริง (เช่น 438 แทน 412) → จอ Kiosk ล้นขอบขวา/ล่าง
function subscribeResize(onChange: () => void) {
  window.addEventListener("resize", onChange);
  return () => window.removeEventListener("resize", onChange);
}
function useViewport() {
  const raw = useSyncExternalStore(
    subscribeResize,
    () => `${document.documentElement.clientWidth}x${document.documentElement.clientHeight}`,
    () => `${CANVAS_W}x${CANVAS_H}`
  );
  const [w, h] = raw.split("x").map(Number);
  return { w, h };
}

// ปุ่ม admin โผล่เมื่อขยับเมาส์/แตะจอ แล้วซ่อนเองใน 3 วินาที (ผู้เข้าร่วมจะเห็นแค่โปสเตอร์)
function useAutoHide(ms = 3000) {
  const [visible, setVisible] = useState(true);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const poke = () => {
    setVisible(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setVisible(false), ms);
  };
  useEffect(() => {
    timer.current = setTimeout(() => setVisible(false), ms);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [ms]);
  return { visible, poke };
}

// ล็อก scroll ของหน้าที่อยู่ข้างใต้ (Sidebar/Topbar ของ /admin, /super) ระหว่างเปิดจอ Kiosk
// ไม่งั้นล้อเมาส์/ลากนิ้ว จะเลื่อนหน้าข้างใต้ และบนมือถือจอ Kiosk จะขยับตาม
function useLockPageScroll() {
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const prev = [html.style.overflow, body.style.overflow, html.style.overscrollBehavior];
    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    html.style.overscrollBehavior = "none";
    window.scrollTo(0, 0);
    return () => {
      [html.style.overflow, body.style.overflow, html.style.overscrollBehavior] = prev;
    };
  }, []);
}

// ============ ส่วนหลัก ============
export function KioskView({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params); // เช่น { id: "e-workshop" }

  const user = useStore((s) => s.currentUser);
  const hydrated = useStore((s) => s.hydrated);
  const event = useStore((s) => s.events.find((e) => e.id === id));
  const registeredCount = useStore((s) => s.registrations.filter((r) => r.eventId === id).length); // ใช้ตัดสิน "ที่นั่งเต็ม"
  const draft = useWizardStore((s) => s.drafts[id]); // ข้อมูลจาก Wizard (ถ้า Event Admin เคยแก้)
  const origin = useOrigin();
  const isFullscreen = useIsFullscreen();
  const { w: vw, h: vh } = useViewport();
  const now = useNow(1000); // นาฬิกา + นับถอยหลัง
  const controls = useAutoHide();
  const router = useRouter();
  useLockPageScroll();

  // ภาษา: ค่าตั้งต้นจากบัญชี admin / ผู้เข้าร่วมกดสลับที่จอได้ (ไม่เปลี่ยนภาษาในบัญชี)
  const [override, setOverride] = useState<Lang | null>(null);
  const lang: Lang = override ?? user?.lang ?? "th";
  const t = TEXT[lang];

  const rootRef = useRef<HTMLDivElement>(null);

  // ต้องถูกเรียกจากการคลิกของผู้ใช้เท่านั้น เบราว์เซอร์ถึงจะยอม
  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await rootRef.current?.requestFullscreen();
    } catch {
      // บางเบราว์เซอร์/บาง iframe ไม่อนุญาต → ใช้งานแบบไม่เต็มจอต่อได้
    }
  };

  // จอนี้เปิดได้ 2 ทาง: Event Admin (/admin/events/<id>/kiosk) และ Super Admin (/super/events/<id>/kiosk)
  // ปุ่มกลับ/ออก พากลับฝั่งของตัวเอง
  const isSuper = user?.role === "admin";
  const dashboardHref = isSuper ? `/super/events/${id}/dashboard` : `/admin/events/${id}`;
  const homeHref = isSuper ? "/super" : "/admin";

  const handleExit = async () => {
    if (document.fullscreenElement) await document.exitFullscreen().catch(() => {});
    router.push(dashboardHref); // ออกจาก Kiosk → กลับ Dashboard ของ Event นี้
  };

  if (!hydrated) return null;

  // Super Admin เปิดได้ทุก Event (ไม่ต้องเป็นผู้ดูแล) / Event Admin เปิดได้เฉพาะงานที่ได้รับมอบหมาย
  const allowed =
    event !== undefined &&
    event.status !== "deleted" &&
    user !== null &&
    (isSuper || event.adminIds.includes(user.id));

  // ---- กรณีเปิดจอไม่ได้: แสดงการ์ดแจ้ง admin (ไม่ใช่โปสเตอร์) ----
  if (!allowed || event.status === "draft") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-50 p-8">
        <Card className="w-full max-w-lg items-center gap-2 rounded-3xl py-12 text-center ring-slate-200">
          {!allowed && <ShieldAlert size={40} className="text-slate-400" />}
          <p className="text-2xl font-semibold">{allowed ? t.draft : t.notFound}</p>
          <p className="text-slate-500">{allowed ? t.draftHint : t.notFoundHint}</p>
          {/* ไม่มีสิทธิ์ → หน้าแรกของฝั่งตัวเอง | ยังเป็น Draft → Dashboard ของ Event นี้ */}
          <Button
            variant="ghost"
            nativeButton={false}
            render={<Link href={allowed ? dashboardHref : homeHref} />}
            className="mt-3 text-blue-600"
          >
            <ArrowLeft /> {allowed ? t.backDashboard : isSuper ? t.backHome : t.back}
          </Button>
        </Card>
      </div>
    );
  }

  const model = buildKioskModel(event, draft);
  const sceneInfo = getKioskScene(model, now, registeredCount);

  // ย่อ/ขยายผืนผ้าใบให้เต็มจอพอดี (ไม่มีขอบว่าง ไม่มี scroll) — เลือกเลย์เอาต์จากสัดส่วนจอ:
  // - แนวนอน (กว้าง ≥ 1.2 เท่าของสูง เช่น 16:9) → ผืนสูง 1080 px กว้างตามจอ (16:9 = 1920 × 1080)
  // - แนวตั้ง (9:16, 3:4, 1:1)                → ผืนกว้างอย่างน้อย 1080 px และสูงอย่างน้อย 1400 px
  //   9:16 = 1080 × 1920 · 3:4 = 1080 × 1440 · 1:1 = 1400 × 1400 (รูปโฆษณาหดเองเมื่อจอเตี้ย)
  const layout: KioskLayout = vw / vh >= LANDSCAPE_RATIO ? "landscape" : "portrait";
  const scale = layout === "landscape" ? vh / LANDSCAPE_H : Math.min(vw / CANVAS_W, vh / PORTRAIT_MIN_H);
  const canvasW = vw / scale;
  const canvasH = vh / scale;

  return (
    <div
      ref={rootRef}
      onPointerMove={controls.poke}
      onPointerDown={controls.poke}
      // overflow-clip (ไม่ใช่ hidden): กล่อง hidden ยังถูกเลื่อนได้ (โฟกัสปุ่ม / ลากเลือกข้อความ) → หัวจอหายขึ้นไป
      // clip ตัดส่วนเกินทิ้งเฉย ๆ เลื่อนไม่ได้เลย
      className="fixed inset-0 z-50 overflow-clip"
      style={{ background: pageColor(model) }}
    >
      <div style={{ width: canvasW, height: canvasH, transform: `scale(${scale})`, transformOrigin: "top left" }}>
        <KioskScreen
          model={model}
          info={sceneInfo}
          layout={layout}
          lang={lang}
          setLang={setOverride}
          now={now}
          origin={origin}
          admin={{
            visible: controls.visible,
            isFullscreen,
            onToggleFullscreen: toggleFullscreen,
            onExit: handleExit,
            labels: { fullscreen: t.fullscreen, exitFullscreen: t.exitFullscreen, exit: t.exit },
          }}
        />
      </div>
    </div>
  );
}
