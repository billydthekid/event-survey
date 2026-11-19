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
import { formatThaiDate } from "@/lib/utils/date";
import { hasRegistration, hasSurvey } from "@/lib/utils/wizard-rules";

function LockIcon() {
  return (
    <span className="mx-auto mb-2 flex size-12 items-center justify-center rounded-full bg-amber-100 text-amber-700">
      <Lock className="size-6" />
    </span>
  );
}

export function LockedArea({ locked, children }: { locked: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
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
        aria-label="เนื้อหานี้ถูกล็อก"
        className="absolute inset-0 z-10 cursor-not-allowed"
        onClick={() => setOpen(true)}
        onKeyDown={() => setOpen(true)}
      />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="text-center sm:max-w-sm">
          <DialogHeader className="items-center text-center">
            <LockIcon />
            <DialogTitle>Event เผยแพร่แล้ว แก้ไขไม่ได้</DialogTitle>
            <DialogDescription>
              Event ที่เป็น Active หรือ Ended ถูกล็อกทุกขั้นตอน · ดูข้อมูลและผลได้อย่างเดียว · ถ้าต้องแก้ ติดต่อ Admin
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-center">
            <Button onClick={() => setOpen(false)}>เข้าใจแล้ว</Button>
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
  const g = d.general;
  const endDate = g.endDate && g.endDate !== g.date ? `${formatThaiDate(g.endDate, false)} ` : "";
  const when = g.date ? `${formatThaiDate(g.date, false)} · ${g.startTime} – ${endDate}${g.endTime}` : "ยังไม่กำหนดวัน";
  const where = g.venue ? (g.mode === "online" ? `Online · ${g.venue}` : g.venue) : "";
  // QR ที่จะได้ตามที่สร้างไว้ (ฟอร์ม / Survey ไม่บังคับ)
  const qrs = [hasRegistration(d) && "QR ลงทะเบียน", hasSurvey(d) && "QR Survey"].filter(Boolean).join(" + ");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="flex-row items-center gap-3 space-y-0 text-left">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
            <Rocket className="size-5" />
          </span>
          <div className="min-w-0">
            <DialogTitle className="truncate">พร้อมเผยแพร่ &quot;{eventName || "Event นี้"}&quot;</DialogTitle>
            <DialogDescription>ตรวจสรุปด้านล่างก่อนยืนยัน</DialogDescription>
          </div>
        </DialogHeader>

        {/* สรุปสิ่งที่จะเผยแพร่ */}
        <ul className="divide-y border-y text-sm">
          <SummaryRow icon={CalendarDays} title={when} sub={where} />
          <SummaryRow
            icon={QrCode}
            title={qrs || "ไม่มี QR"}
            sub={qrs ? "ได้ QR ทันทีหลังเผยแพร่" : "ไม่มีฟอร์มและ Survey · จอ Kiosk แสดงแค่รายละเอียดงาน"}
          />
        </ul>

        {/* คำเตือนเรื่องล็อก (กล่องเดียวชัด ๆ) */}
        <div role="note" className="flex items-start gap-2.5 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <Lock className="mt-0.5 size-4 shrink-0" />
          <p>
            สถานะเปลี่ยนเป็น <strong className="font-semibold">Active</strong> และ
            <strong className="font-semibold">แก้ไข Event / Survey ไม่ได้อีก</strong>
          </p>
        </div>

        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            กลับไปแก้ไข
          </Button>
          <Button onClick={onConfirm}>
            <Rocket className="size-4" /> เผยแพร่เลย
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
