"use client";
// ปุ่ม "รีเซ็ต" บนแถบบนของหน้าตั้งค่า Event (ข้างปุ่มภาษา)
// กดแล้วถามยืนยันก่อนเสมอ → ล้างทุกขั้นกลับเป็นตอนก่อนกรอกครั้งแรก (เก็บชื่อ Event ไว้) แล้วพากลับไปขั้นที่ 1
// ข้อมูลที่ล้าง: ข้อมูลทั่วไป · Branding (สี รูปปก โฆษณา โลโก้ แบนเนอร์) · ฟอร์ม · Survey · ช่วงเวลา — ย้อนกลับไม่ได้
// Event ที่เผยแพร่แล้ว (ล็อก) ไม่แสดงปุ่มนี้

import { useState } from "react";
import { RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useWizardStore } from "@/lib/wizard-store";
import { useTr } from "@/lib/wizard-lang";

export function ResetEventButton({ eventId, eventName }: { eventId: string; eventName: string }) {
  const [open, setOpen] = useState(false);
  const resetDraft = useWizardStore((s) => s.resetDraft);
  const router = useRouter();
  const tr = useTr();

  const confirm = () => {
    resetDraft(eventId);
    setOpen(false);
    router.push(`/admin/events/${eventId}/edit/setup-info`); // ขั้นที่ 1 (ชื่อโฟลเดอร์เดียวกับ STEPS ใน wizard-shell)
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 rounded-full border bg-white px-3 py-1.5 text-sm shadow-sm hover:bg-red-50 hover:text-red-700 hover:ring-1 hover:ring-red-200"
      >
        <RotateCcw className="size-3.5" /> {tr("รีเซ็ต", "Reset")}
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="flex-row items-center gap-3 space-y-0 text-left">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-700">
              <RotateCcw className="size-5" />
            </span>
            <div className="min-w-0">
              <DialogTitle>{tr("รีเซ็ตทั้งหมด?", "Reset everything?")}</DialogTitle>
              <DialogDescription className="truncate">{eventName || tr("Event นี้", "This event")}</DialogDescription>
            </div>
          </DialogHeader>

          <div className="space-y-2 text-sm">
            <p>
              {tr(
                "ข้อมูลทุกขั้นจะกลับเป็นตอนก่อนกรอกครั้งแรก แล้วเริ่มใหม่ที่ขั้นที่ 1",
                "Every step goes back to how it was before you started, and you start again at step 1"
              )}
            </p>
            <ul className="list-disc space-y-0.5 pl-5 text-muted-foreground">
              <li>{tr("ข้อมูลทั่วไป วันเวลา สถานที่ ผู้จัด", "General info, date and time, venue, organizer")}</li>
              <li>{tr("Branding: สี โลโก้ รูปปก โฆษณา แบนเนอร์", "Branding: colors, logo, cover, ads, banners")}</li>
              <li>{tr("ฟอร์มลงทะเบียน คำถาม Survey และช่วงเวลาเปิด–ปิด", "Registration form, survey questions and open/close times")}</li>
            </ul>
            <p className="rounded-lg bg-red-50 px-3 py-2 text-red-800">
              {tr("ชื่อ Event ยังอยู่ · ย้อนกลับไม่ได้", "The event name is kept · this can't be undone")}
            </p>
          </div>

          <DialogFooter>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              {tr("ยกเลิก", "Cancel")}
            </Button>
            <Button variant="destructive" onClick={confirm}>
              <RotateCcw className="size-4" /> {tr("รีเซ็ตทั้งหมด", "Reset everything")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
