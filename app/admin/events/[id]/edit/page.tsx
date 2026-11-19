"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { useNow } from "@/lib/hooks/useNow";
import { useWizardStore } from "@/lib/wizard-store";
import { useEventAccess } from "@/app/admin/events/[id]/eventAccess";
import { firstBlockedStep, isWizardLocked, stepBlock, toEventPatch } from "@/lib/utils/wizard-rules";
import { QrDialog } from "@/components/event/qr-dialog";
import { PHASE_META, getPhase } from "@/lib/utils/event-phase";
import { STATUS_LABEL } from "@/lib/utils/status";
import { STEPS, WizardShell } from "@/components/event-wizard/wizard-shell";
import { StepGeneral } from "@/components/event-wizard/step-general";
import { StepBranding } from "@/components/event-wizard/step-branding";
import { StepForm } from "@/components/event-wizard/step-form";
import { StepSurvey } from "@/components/event-wizard/step-survey";
import { StepPreview } from "@/components/event-wizard/step-preview";

const META: Record<number, { title: string; subtitle: string }> = {
  1: { title: "ข้อมูล Event", subtitle: "รายละเอียดที่ผู้เข้าร่วมเห็นบนหน้า Event และจอ Kiosk" },
  2: { title: "Branding", subtitle: "รูปปก โฆษณา สี และโลโก้ ที่ผู้เข้าร่วมเห็นบนมือถือและจอ Kiosk" },
  3: { title: "ฟอร์มลงทะเบียน", subtitle: "ช่วงเปิดรับ และข้อมูลที่ผู้เข้าร่วมต้องกรอกตอนสแกน QR ลงทะเบียน" },
  4: { title: "Survey", subtitle: "ช่วงเปิดให้ตอบ และแบบประเมินของ Event นี้ · 1 Event มีได้ 1 Survey" },
  5: { title: "Preview และเผยแพร่", subtitle: "หน้าตาที่ผู้เข้าร่วมเห็น ก่อนกดเผยแพร่" },
};

export default function EditEventPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  // ---- ด่านสิทธิ์: กฎเดียวกับ Dashboard / Report / QR / Kiosk (ไม่พบ / ถูกลบ / ไม่ได้รับมอบหมาย → denied) ----
  const access = useEventAccess(id);
  const mainEvent = access.status === "nodata" || access.status === "ok" ? access.event : null;
  const updateEvent = useStore((s) => s.updateEvent);
  const addLog = useStore((s) => s.addLog);

  // ---- wizard store ----
  const { draft, drafts, step: savedStep, setStep, publish, load, ensureFromMainStore } = useWizardStore();

  // ดึง Event จาก store หลักเข้า wizard store (ครั้งแรกที่เปิด) แล้วเลือกเป็น draft ที่กำลังแก้
  // deps ใช้แค่ id + "มีสิทธิ์แล้วหรือยัง" — ไม่ใช้ object ของ Event เพราะ sync ด้านล่างทำให้ object เปลี่ยนทุกครั้งที่พิมพ์
  const allowed = mainEvent !== null;
  // (พร้อมแสดง = draft ที่เลือกเป็น id นี้แล้ว — ดูด้านล่าง ไม่ต้องมี state แยก)
  useEffect(() => {
    if (!allowed) return;
    const ev = useStore.getState().events.find((e) => e.id === id);
    if (ev) ensureFromMainStore(ev);
    load(id);
  }, [id, allowed, load, ensureFromMainStore]);

  const locked = mainEvent ? isWizardLocked(mainEvent.status) : true;
  const current = draft.id === id ? draft : null;

  // ---- sync การแก้ใน Wizard → store หลัก (My Events / Sidebar / Dashboard เห็นค่าล่าสุด) ----
  useEffect(() => {
    if (!current || locked) return;
    updateEvent(id, toEventPatch(current));
  }, [current, locked, id, updateEvent]);

  const now = useNow();
  const [qrOpen, setQrOpen] = useState(false); // popup QR หลังกดเผยแพร่

  if (access.status === "loading") return null;
  if (access.status === "denied") return <NoAccess />;
  if (!drafts[id] || !current || !mainEvent) return null;

  // ---- ขั้นที่แสดง ----
  // ไม่มีเมนูขั้นตอนแล้ว → ต้องผ่านทีละขั้น: ขั้นที่บันทึกไว้ไปได้ไม่เกิน "ขั้นแรกที่ยังไม่ครบ"
  // (เช่น บันทึกไว้ขั้น 4 แต่ลบชื่อ Event ทิ้ง → กลับไปขั้น 1) · ล็อกแล้ว = ดูได้ทุกขั้น
  // ขั้นเกินจำนวน (ข้อมูลเก่าตอน Wizard มี 6 ขั้น) → ขั้นสุดท้าย
  const maxStep = locked ? STEPS.length : firstBlockedStep(current, STEPS.length, now);
  const step = Math.min(Math.max(savedStep, 1), STEPS.length, maxStep);
  const nextBlock = stepBlock(current, step, now);

  // เหตุผลที่ยังเผยแพร่ไม่ได้ = ขั้นแรกที่ยังไม่ครบ (ปกติมาถึงขั้นสุดท้ายได้ก็ครบแล้ว · กันไว้อีกชั้น)
  const publishBlock = maxStep < STEPS.length ? `${stepBlock(current, maxStep, now)} (ขั้นที่ ${maxStep})` : undefined;

  return (
    <>
    <WizardShell
      eventName={current.general.nameTh}
      assignedBy={current.assignedBy}
      status={locked ? STATUS_LABEL[mainEvent.status].text : PHASE_META[getPhase(current)].th}
      step={step}
      onStep={setStep}
      title={META[step].title}
      subtitle={META[step].subtitle}
      locked={locked}
      nextBlock={nextBlock}
      publishBlock={publishBlock}
      onPublish={() => {
        if (publishBlock) return;
        publish();

        // เผยแพร่ = Active ทันที (Draft → เผยแพร่ → Active → Ended) และล็อก Wizard ต่อจากนี้
        updateEvent(id, { ...toEventPatch(current), status: "active" });
        addLog("publish_event", "event", id, `เผยแพร่ "${current.general.nameTh}"`);
        setQrOpen(true); // popup QR ลงทะเบียน + Survey · ปิดแล้วไปหน้า Event ของฉัน
      }}
    >
      {step === 1 && <StepGeneral />}
      {step === 2 && <StepBranding />}
      {step === 3 && <StepForm />}
      {step === 4 && <StepSurvey />}
      {step === 5 && <StepPreview />}
    </WizardShell>

    {/* popup หลังเผยแพร่ อยู่นอก WizardShell → ไม่โดนล็อก (หลังเผยแพร่ Wizard ล็อกทันที) */}
    <QrDialog
      open={qrOpen}
      onOpenChange={(v) => {
        setQrOpen(v);
        if (!v) router.push("/admin/events");
      }}
      justPublished
      eventName={current.general.nameTh}
      code={current.code}
      reg={{ opensAt: current.schedule.regOpen, closesAt: current.schedule.regClose }}
      survey={{ opensAt: current.schedule.surveyOpen, closesAt: current.schedule.surveyClose }}
    />
    </>
  );
}

function NoAccess() {
  return (
    <div className="p-8">
      <p className="font-semibold">ไม่พบ Event นี้ หรือคุณไม่ได้รับมอบหมายให้ดูแล</p>
      <Link href="/admin/events" className="mt-2 inline-block text-sm text-blue-600 hover:underline">
        กลับไป Event ของฉัน
      </Link>
    </div>
  );
}
