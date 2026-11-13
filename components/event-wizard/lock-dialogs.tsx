"use client";
// หน้าต่างแจ้งเตือนเรื่อง "ล็อก" ของ Wizard / Survey Builder
// - LockedArea: ครอบเนื้อหาที่ล็อกแล้ว · คลิกหรือพิมพ์ตรงไหนก็ตาม → เด้งหน้าต่าง "Event เผยแพร่แล้ว แก้ไขไม่ได้"
//   (ช่องที่ disabled ไม่ส่ง event คลิกออกมา จึงวางแผ่นใสทับไว้ด้านบนเพื่อรับคลิกแทน)
// - PublishConfirm: ถามยืนยันก่อนเผยแพร่ เพราะเผยแพร่แล้วจะแก้ไม่ได้อีก

import { useState } from "react";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

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
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="text-center sm:max-w-sm">
        <DialogHeader className="items-center text-center">
          <LockIcon />
          <DialogTitle>เผยแพร่ &quot;{eventName || "Event นี้"}&quot;?</DialogTitle>
          <DialogDescription>
            หลังเผยแพร่ Event จะเป็น Active และ<strong className="text-foreground">ถูกล็อกทันที</strong> แก้ไขข้อมูล Event และ Survey ไม่ได้อีก
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="sm:justify-center">
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            กลับไปตรวจอีกครั้ง
          </Button>
          <Button onClick={onConfirm}>
            <Lock className="size-4" /> ยืนยันเผยแพร่
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
