"use client";
// ปุ่ม "QR" บนการ์ด Event ที่เผยแพร่แล้ว (หน้า Event ของฉัน) → เปิด popup QR เดียวกับหลังกดเผยแพร่
// ไว้ให้ผู้จัดกลับมาดาวน์โหลด QR / โปสเตอร์ ภายหลัง ถ้าตอนเผยแพร่กด "ไว้ทีหลัง"

import { useState } from "react";
import { QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWizardStore } from "@/lib/wizard-store";
import type { Event } from "@/types";
import { hasRegistration, hasSurvey } from "@/lib/utils/wizard-rules";
import { QrDialog } from "./qr-dialog";

export function EventQrButton({ event }: { event: Event }) {
  const [open, setOpen] = useState(false);
  const draft = useWizardStore((s) => s.drafts[event.id]); // ช่วงเวลาที่ตั้งใน Wizard (ใหม่กว่า store หลัก)

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)} aria-label="QR ลงทะเบียน / Survey">
        <QrCode className="size-4" /> QR
      </Button>
      {open && (
        <QrDialog
          open={open}
          onOpenChange={setOpen}
          eventName={draft?.general.nameTh || event.name.th}
          code={event.code}
          // ฟอร์ม / Survey ไม่บังคับ: Wizard ไม่มีช่อง / ไม่มีคำถาม → ไม่มี QR นั้น (ไม่มีร่างใน Wizard = แสดงทั้งคู่เหมือนเดิม)
          reg={
            draft && !hasRegistration(draft)
              ? null
              : { opensAt: draft?.schedule.regOpen || event.registration.opensAt, closesAt: draft?.schedule.regClose || event.registration.closesAt }
          }
          survey={
            draft && !hasSurvey(draft)
              ? null
              : { opensAt: draft?.schedule.surveyOpen || event.surveyWindow.opensAt, closesAt: draft?.schedule.surveyClose || event.surveyWindow.closesAt }
          }
        />
      )}
    </>
  );
}
