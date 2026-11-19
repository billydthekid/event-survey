"use client";
// หน้าต่างแจ้งเตือนเรื่อง "ล็อก" ของ Wizard / Survey Builder
// - LockedArea: ครอบเนื้อหาที่ล็อกแล้ว · คลิกหรือพิมพ์ตรงไหนก็ตาม → เด้งหน้าต่าง "Event เผยแพร่แล้ว แก้ไขไม่ได้"
//   (ช่องที่ disabled ไม่ส่ง event คลิกออกมา จึงวางแผ่นใสทับไว้ด้านบนเพื่อรับคลิกแทน)
// - PublishConfirm: สรุปสิ่งที่จะเผยแพร่ + เตือนว่าเผยแพร่แล้วจะแก้ไม่ได้อีก ก่อนยืนยัน

import { useState } from "react";
import { CalendarDays, Lock, QrCode, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useWizardStore } from "@/lib/wizard-store";
import { hasRegistration, hasSurvey } from "@/lib/utils/wizard-rules";
import { fmtDate, useTr, useWizardLang } from "@/lib/wizard-lang";

function LockIcon() {
  return (
    <span className="mx-auto mb-2 flex size-12 items-center justify-center rounded-full bg-amber-100 text-amber-700">
      <Lock className="size-6" />
    </span>
  );
}

export function LockedArea({ locked, children }: { locked: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const tr = useTr();
  if (!locked) return <>{children}</>;

  return (
    <div className="relative">
      <fieldset disabled className="min-w-0 space-y-5 opacity-70">
        {children}
      </fieldset>
      {/* แผ่นใสรับคลิก/แตะ/พิมพ์ทั้งหมดบนเนื้อหาที่ล็อก */}
      <div
        role="button"
        tabIndex={0}
        aria-label={tr("เนื้อหานี้ถูกล็อก", "This content is locked")}
        className="absolute inset-0 z-10 cursor-not-allowed"
        onClick={() => setOpen(true)}
        onKeyDown={() => setOpen(true)}
      />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="text-center sm:max-w-sm">
          <DialogHeader className="items-center text-center">
            <LockIcon />
            <DialogTitle>{tr("Event เผยแพร่แล้ว แก้ไขไม่ได้", "This event is published and can't be edited")}</DialogTitle>
            <DialogDescription>
              {tr("Event ที่เป็น Active หรือ Ended ถูกล็อกทุกขั้นตอน · ดูข้อมูลและผลได้อย่างเดียว · ถ้าต้องแก้ ติดต่อ Admin", "Active or Ended events are locked in every step · you can only view details and results · contact an Admin to make changes")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-center">
            <Button onClick={() => setOpen(false)}>{tr("เข้าใจแล้ว", "Got it")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ถามยืนยันก่อนเผยแพร่ เพราะเผยแพร่แล้วจะแก้ไม่ได้อีก
// แบบ A: สรุปสิ่งที่จะเผยแพร่ (วันเวลา สถานที่ · QR ที่จะได้) + กล่องเตือนเรื่องล็อก + ปุ่ม "เผยแพร่เลย"
// อ่านข้อมูลจาก draft ปัจจุบันใน wizard store (Event ที่กำลังตั้งค่า)
export function PublishConfirm({
  open,
  onOpenChange,
  eventName,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  eventName: string;
  onConfirm: () => void;
}) {
  const d = useWizardStore((s) => s.draft);
  const tr = useTr();
  const lang = useWizardLang();
  const g = d.general;
  const endDate = g.endDate && g.endDate !== g.date ? `${fmtDate(g.endDate, lang)} ` : "";
  const when = g.date ? `${fmtDate(g.date, lang)} · ${g.startTime} – ${endDate}${g.endTime}` : tr("ยังไม่กำหนดวัน", "No date yet");
  const where = g.venue ? (g.mode === "online" ? `Online · ${g.venue}` : g.venue) : "";
  // QR ที่จะได้ตามที่สร้างไว้ (ฟอร์ม / Survey ไม่บังคับ)
  const qrs = [hasRegistration(d) && tr("QR ลงทะเบียน", "Registration QR"), hasSurvey(d) && tr("QR Survey", "Survey QR")].filter(Boolean).join(" + ");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="flex-row items-center gap-3 space-y-0 text-left">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
            <Rocket className="size-5" />
          </span>
          <div className="min-w-0">
            <DialogTitle className="truncate">
              {tr("พร้อมเผยแพร่", "Ready to publish")} &quot;{eventName || tr("Event นี้", "this event")}&quot;
            </DialogTitle>
            <DialogDescription>{tr("ตรวจสรุปด้านล่างก่อนยืนยัน", "Check the summary below before you confirm")}</DialogDescription>
          </div>
        </DialogHeader>

        {/* สรุปสิ่งที่จะเผยแพร่ */}
        <ul className="divide-y border-y text-sm">
          <SummaryRow icon={CalendarDays} title={when} sub={where} />
          <SummaryRow
            icon={QrCode}
            title={qrs || tr("ไม่มี QR", "No QR codes")}
            sub={
              qrs
                ? tr("ได้ QR ทันทีหลังเผยแพร่", "You get the QR codes right after publishing")
                : tr("ไม่มีฟอร์มและ Survey · จอ Kiosk แสดงแค่รายละเอียดงาน", "No form or survey · the Kiosk shows event details only")
            }
          />
        </ul>

        {/* คำเตือนเรื่องล็อก (กล่องเดียวชัด ๆ) */}
        <div role="note" className="flex items-start gap-2.5 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <Lock className="mt-0.5 size-4 shrink-0" />
          <p>
            {tr("สถานะเปลี่ยนเป็น ", "The status becomes ")}
            <strong className="font-semibold">Active</strong>
            {tr(" และ", " and ")}
            <strong className="font-semibold">{tr("แก้ไข Event / Survey ไม่ได้อีก", "the event and survey can't be edited anymore")}</strong>
          </p>
        </div>

        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            {tr("กลับไปแก้ไข", "Go back and edit")}
          </Button>
          <Button onClick={onConfirm}>
            <Rocket className="size-4" /> {tr("เผยแพร่เลย", "Publish now")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SummaryRow({ icon: Icon, title, sub }: { icon: typeof Lock; title: string; sub?: string }) {
  return (
    <li className="flex items-start gap-3 py-2.5">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        <Icon className="size-4" />
      </span>
      <div className="min-w-0">
        <p className="font-medium">{title}</p>
        {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
      </div>
    </li>
  );
}
