// app/admin/events/[id]/kiosk/KioskView.tsx
// จอ Kiosk เต็มจอ เปิดทิ้งไว้ที่หน้างานให้ผู้เข้าร่วมสแกน QR (ดีไซน์ตาม Figma K1–K5)
// (Client Component เพราะใช้ store, state, นาฬิกา และ Fullscreen API ของเบราว์เซอร์)
//
// ไฟล์นี้ดูแล: ตรวจสิทธิ์ · เลือกภาษา · ย่อ/ขยายผืนผ้าใบ 1080 px ให้พอดีจอ · ปุ่มเต็มจอ/ออก
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
import { KioskScreen, pageColor } from "./KioskScreen";

// ============ ข้อความของปุ่ม/หน้าแจ้งเตือนฝั่ง admin ============
const TEXT = {
  th: {
    fullscreen: "เต็มจอ",
    exitFullscreen: "ออกจากเต็มจอ",
    exit: "ออกจาก Kiosk",
    back: "กลับไป Event ของฉัน",
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
    draft: "Publish the event before opening Kiosk",
    draftHint: "This event is still a draft",
    notFound: "Event not found / No permission",
    notFoundHint: "This event doesn't exist, was deleted, or isn't assigned to you",
  },
};

// ผืนผ้าใบออกแบบที่ 1080×1920 (Full HD แนวตั้ง)
const CANVAS_W = 1080;
const CANVAS_H = 1920;

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

// ขนาดหน้าต่าง "กว้างxสูง" (string เพื่อให้ useSyncExternalStore เทียบค่าได้)
function subscribeResize(onChange: () => void) {
  window.addEventListener("resize", onChange);
  return () => window.removeEventListener("resize", onChange);
}
function useViewport() {
  const raw = useSyncExternalStore(
    subscribeResize,
    () => `${window.innerWidth}x${window.innerHeight}`,
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

// ============ ส่วนหลัก ============
export function KioskView({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params); // เช่น { id: "e-workshop" }

  const user = useStore((s) => s.currentUser);
  const hydrated = useStore((s) => s.hydrated);
  const event = useStore((s) => s.events.find((e) => e.id === id));
  const draft = useWizardStore((s) => s.drafts[id]); // ข้อมูลจาก Wizard (ถ้า Event Admin เคยแก้)
  const origin = useOrigin();
  const isFullscreen = useIsFullscreen();
  const { w: vw, h: vh } = useViewport();
  const now = useNow(1000); // นาฬิกา + นับถอยหลัง
  const controls = useAutoHide();
  const router = useRouter();

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

  const handleExit = async () => {
    if (document.fullscreenElement) await document.exitFullscreen().catch(() => {});
    router.push("/admin/events");
  };

  if (!hydrated) return null;

  const allowed =
    event !== undefined && event.status !== "deleted" && user !== null && event.adminIds.includes(user.id);

  // ---- กรณีเปิดจอไม่ได้: แสดงการ์ดแจ้ง admin (ไม่ใช่โปสเตอร์) ----
  if (!allowed || event.status === "draft") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-50 p-8">
        <Card className="w-full max-w-lg items-center gap-2 rounded-3xl py-12 text-center ring-slate-200">
          {!allowed && <ShieldAlert size={40} className="text-slate-400" />}
          <p className="text-2xl font-semibold">{allowed ? t.draft : t.notFound}</p>
          <p className="text-slate-500">{allowed ? t.draftHint : t.notFoundHint}</p>
          <Button variant="ghost" nativeButton={false} render={<Link href="/admin/events" />} className="mt-3 text-blue-600">
            <ArrowLeft /> {t.back}
          </Button>
        </Card>
      </div>
    );
  }

  const model = buildKioskModel(event, draft);
  const { scene, showRegister, showSurvey } = getKioskScene(model, now);

  // ย่อ/ขยายผืนผ้าใบให้พอดีจอ:
  // - จอแนวตั้งที่สูงกว่า 9:16 → กว้างเต็มจอ และผืนผ้าใบยืดสูงขึ้น (ไม่มีขอบ)
  // - จอแนวนอน (เช่น ทดสอบบน notebook) → สูงเต็มจอ วางกลาง ขอบซ้าย-ขวาเป็นสีพื้นหลัง
  const scale = Math.min(vw / CANVAS_W, vh / CANVAS_H);
  const canvasH = vh / scale;

  return (
    <div
      ref={rootRef}
      onPointerMove={controls.poke}
      onPointerDown={controls.poke}
      className="fixed inset-0 z-50 flex justify-center overflow-hidden"
      style={{ background: pageColor(model) }}
    >
      <div style={{ width: CANVAS_W * scale, height: vh }}>
        <div
          style={{ width: CANVAS_W, height: canvasH, transform: `scale(${scale})`, transformOrigin: "top left" }}
        >
          <KioskScreen
            model={model}
            scene={scene}
            showRegister={showRegister}
            showSurvey={showSurvey}
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
    </div>
  );
}
