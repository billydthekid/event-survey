"use client";

import { useState } from "react";
import Link from "next/link";
import { Lock, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { LockedArea, PublishConfirm } from "./lock-dialogs";
import { SaveStatus } from "./save-status";
import { ResetEventButton } from "./reset-event-button";
import { setMyLang } from "@/app/admin/settings/accountActions";
import { useTr, useWizardLang } from "@/lib/wizard-lang";

// ฟ้าใส: ไม่มีเมนูขั้นตอนด้านบนแล้ว: เดินได้ทีละขั้นด้วยปุ่ม "ถัดไป" (ล็อกจนกว่าขั้นนั้นจะครบ) / "ย้อนกลับ"
// ฟ้าใส: ช่วงเวลาเปิด–ปิด ย้ายไปอยู่ในขั้นฟอร์มลงทะเบียน และขั้น Survey แล้ว
// ฟ้าใส: slug = ชื่อโฟลเดอร์หน้าของขั้นนั้น (app/admin/events/[id]/edit/<slug>/page.tsx) · ขึ้นต้น "setup-" กันชื่อซ้ำกับหน้าของเพื่อน
export const STEPS = [
  { n: 1, label: "ข้อมูลทั่วไป", labelEn: "General info", slug: "setup-info" },
  { n: 2, label: "Branding", labelEn: "Branding", slug: "setup-branding" },
  { n: 3, label: "ฟอร์มลงทะเบียน", labelEn: "Registration form", slug: "setup-form" },
  { n: 4, label: "Survey", labelEn: "Survey", slug: "setup-survey" },
  { n: 5, label: "Preview", labelEn: "Preview", slug: "setup-preview" },
] as const;

/** ฟ้าใส: URL ของขั้นที่ n เช่น stepHref("e-career", 2) → "/admin/events/e-career/edit/setup-branding" */
export function stepHref(eventId: string, n: number): string {
  // ฟ้าใส: ข้อมูลของขั้นที่ n (จำกัดให้อยู่ระหว่าง 1–5)
  const s = STEPS[Math.min(Math.max(n, 1), STEPS.length) - 1];
  return `/admin/events/${eventId}/edit/${s.slug}`;
}

// ฟ้าใส: ค่าที่หน้าตั้งค่าส่งเข้ามาให้กรอบ
interface Props {
  eventId: string; // ฟ้าใส: ใช้ดูการบันทึกอัตโนมัติของ Event นี้ (SaveStatus)
  eventName: string;
  /** ฟ้าใส: ชื่อผู้สร้าง Event (ว่าง = ไม่แสดง) */
  createdBy: string;
  status: string; // ฟ้าใส: ข้อความในป้ายสถานะ เช่น "Draft", "กำลังจัดงาน"
  statusCls: string; // ฟ้าใส: สีของป้ายสถานะ (class ของ Tailwind)
  step: number;
  // ฟ้าใส: เปลี่ยนขั้น
  onStep: (n: number) => void;
  title: string;
  subtitle: string;
  locked: boolean;
  /** ฟ้าใส: มีค่า = ขั้นนี้ยังไม่ครบ ไปขั้นถัดไปไม่ได้ (แสดงเหตุผลข้างปุ่ม) */
  nextBlock?: string;
  /** ฟ้าใส: มีค่า = ยังเผยแพร่ไม่ได้ (แสดงเหตุผลข้างปุ่ม) */
  publishBlock?: string;
  // ฟ้าใส: กดยืนยันเผยแพร่
  onPublish: () => void;
  children: React.ReactNode;
}

// ฟ้าใส: กรอบของหน้าตั้งค่า Event ทุกขั้น
export function WizardShell(p: Props) {
  // ฟ้าใส: ขั้นแรก → ปุ่มซ้ายเป็น ยกเลิก
  const isFirst = p.step === 1;
  // ฟ้าใส: ขั้นสุดท้าย → ปุ่มขวาเป็น เผยแพร่
  const isLast = p.step === STEPS.length;
  const next = STEPS[p.step]; // ฟ้าใส: step ถัดไป (index = step)
  const [confirmOpen, setConfirmOpen] = useState(false);
  // ฟ้าใส: ภาษาที่เลือก
  const lang = useWizardLang();
  // ฟ้าใส: ตัวเลือกข้อความตามภาษา
  const tr = useTr();

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-gradient-to-b from-[#E9E8F6] to-[#F6F6FB]">
      {/* ฟ้าใส: Top bar */}
      <header className="flex items-center justify-between border-b bg-background px-6 py-3">
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="icon"
            aria-label={tr("ปิด", "Close")}
            nativeButton={false}
            render={<Link href="/admin/events" />}
          >
            <X className="size-4" />
          </Button>
          {/* ฟ้าใส: ชื่อ Event เด่น + ป้ายสถานะ · บรรทัดล่าง "ตั้งค่า Event · สร้างโดย …" (ไม่รู้ผู้สร้าง = ไม่แสดงส่วนนั้น) */}
          <div className="min-w-0 leading-tight">
            <div className="flex items-center gap-2">
              <p className="truncate font-semibold">{p.eventName || tr("(ยังไม่ตั้งชื่อ Event)", "(Untitled event)")}</p>
              <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium", p.statusCls)}>{p.status}</span>
            </div>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              {tr("ตั้งค่า Event", "Event settings")}{p.createdBy && tr(` · สร้างโดย ${p.createdBy}`, ` · Created by ${p.createdBy}`)}
            </p>
          </div>
        </div>
        {/* ฟ้าใส: เปลี่ยนทุกครั้งที่แก้: กำลังบันทึก… → บันทึกแล้ว */}
        <div className="flex items-center gap-3">
          {/* ฟ้าใส: ป้ายบันทึกอัตโนมัติ */}
          <SaveStatus eventId={p.eventId} locked={p.locked} />
          {/* ฟ้าใส: รีเซ็ตทุกขั้นกลับเป็นตอนก่อนกรอก (ถามยืนยันก่อน) · Event ที่ล็อกแล้วไม่มีปุ่มนี้ */}
          {!p.locked && <ResetEventButton eventId={p.eventId} eventName={p.eventName} />}
          {/* ฟ้าใส: ปุ่มภาษา ไทย / EN — ค่าเดียวกับหน้า Dashboard (currentUser.lang) เปลี่ยนแล้วเปลี่ยนทั้งแอป */}
          <button
            type="button"
            onClick={() => setMyLang(lang === "th" ? "en" : "th")}
            aria-label={lang === "th" ? "เปลี่ยนเป็นภาษาอังกฤษ" : "Switch to Thai"}
            className="rounded-full border bg-white px-4 py-1.5 text-sm shadow-sm hover:ring-1 hover:ring-slate-300"
          >
            {lang === "th" ? "ไทย" : "EN"}
          </button>
        </div>
      </header>

      {/* ฟ้าใส: Body */}
      {/* ฟ้าใส: key = step → เปลี่ยนขั้นแล้วกล่องเลื่อนสร้างใหม่ เริ่มที่บนสุดของหน้าเสมอ */}
      <main key={p.step} className="flex-1 overflow-y-auto px-6 py-5">
        <div className="mx-auto max-w-3xl space-y-5">
          {/* ฟ้าใส: Title + แถบความคืบหน้า (ดูอย่างเดียว กดข้ามขั้นไม่ได้) */}
          <div>
            <p className="text-xs text-muted-foreground">{tr(`ขั้นที่ ${p.step} จาก ${STEPS.length}`, `Step ${p.step} of ${STEPS.length}`)}</p>
            <div className="mt-2 flex gap-1.5" aria-hidden>
              {STEPS.map((s) => (
                <span key={s.n} className={cn("h-1 flex-1 rounded-full", s.n <= p.step ? "bg-primary" : "bg-primary/15")} />
              ))}
            </div>
            <h1 className="mt-4 text-3xl font-bold tracking-tight">{p.title}</h1>
            <p className="text-sm text-muted-foreground">{p.subtitle}</p>
          </div>

          {/* ฟ้าใส: แบนเนอร์ล็อก: แสดงเฉพาะเมื่อ Event ถูกล็อกแล้ว (Draft ไม่แสดง) */}
          {p.locked && (
            <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-900">
              <Lock className="size-4 shrink-0" />
              <span>{tr("Event เผยแพร่แล้ว (Active / Ended) · ทุกขั้นตอนถูกล็อก · การเปลี่ยนผู้ดูแลหรือลบ Event ต้องผ่าน Admin", "This event is published (Active / Ended) · all steps are locked · changing admins or deleting the event goes through an Admin")}</span>
            </div>
          )}

          {/* ฟ้าใส: ล็อกแล้ว: ทุกช่อง disabled + คลิกตรงไหนก็เด้งหน้าต่างแจ้งว่าแก้ไม่ได้ */}
          {/* ฟ้าใส: เนื้อหาทั้งขั้นอยู่ในแผ่นเดียว เรียงช่องลงมาทีละส่วน (ไม่แบ่งการ์ดซ้าย/ขวาแล้ว) */}
          <LockedArea locked={p.locked}>
            <div className="min-w-0 divide-y rounded-2xl border bg-background px-6 sm:px-8">{p.children}</div>
          </LockedArea>
        </div>
      </main>

      {/* ฟ้าใส: Footer: ปุ่มอยู่ตรงกลาง กว้างเท่าเนื้อหา (max-w-3xl เดียวกับด้านบน) */}
      <footer className="border-t bg-background px-6 py-3">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
        {isFirst ? (
          <Button variant="secondary" nativeButton={false} render={<Link href="/admin/events" />}>
            {tr("ยกเลิก", "Cancel")}
          </Button>
        ) : (
          <Button variant="secondary" onClick={() => p.onStep(p.step - 1)}>
            {tr("ย้อนกลับ", "Back")}
          </Button>
        )}
        {isLast ? (
          <div className="flex items-center gap-3">
            {p.publishBlock && !p.locked && <span className="text-sm text-destructive">{p.publishBlock}</span>}
            <Button onClick={() => setConfirmOpen(true)} disabled={p.locked || !!p.publishBlock}>
              {tr("เผยแพร่ Event", "Publish event")}
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            {p.nextBlock && !p.locked && <span className="text-sm text-destructive">{p.nextBlock}</span>}
            {/* ฟ้าใส: ล็อกแล้วเดินดูทุกขั้นได้ (แก้ไม่ได้อยู่แล้ว) · ยังไม่ล็อก = ต้องกรอกขั้นนี้ให้ครบก่อน */}
            <Button onClick={() => p.onStep(p.step + 1)} disabled={!p.locked && !!p.nextBlock}>
              {tr("ถัดไป", "Next")}: {next && (lang === "en" ? next.labelEn : next.label)}
            </Button>
          </div>
        )}
        </div>
      </footer>

      {/* ฟ้าใส: popup ยืนยันเผยแพร่ */}
      <PublishConfirm
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        eventName={p.eventName}
        onConfirm={() => {
          setConfirmOpen(false);
          p.onPublish();
        }}
      />
    </div>
  );
}
