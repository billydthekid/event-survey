"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { useWizardStore } from "@/lib/wizard-store";
import { isEventLocked } from "@/lib/utils/date";
import { PHASE_META, getPhase } from "@/lib/utils/event-phase";
import { WizardShell } from "@/components/event-wizard/wizard-shell";
import { StepGeneral } from "@/components/event-wizard/step-general";
import { StepTheme } from "@/components/event-wizard/step-theme";
import { StepAds } from "@/components/event-wizard/step-ads";
import { StepForm } from "@/components/event-wizard/step-form";
import { StepSchedule } from "@/components/event-wizard/step-schedule";
import { StepSurvey } from "@/components/event-wizard/step-survey";
import { StepPreview } from "@/components/event-wizard/step-preview";

const META: Record<number, { title: string; subtitle: string }> = {
  1: { title: "ข้อมูล Event", subtitle: "รายละเอียดที่ผู้เข้าร่วมเห็นบนหน้า Event และจอ Kiosk" },
  2: { title: "Theme", subtitle: "หน้าตาที่ผู้เข้าร่วมจะเห็นบน Kiosk และมือถือ" },
  3: { title: "โฆษณา (Advt)", subtitle: "รูปที่จะแสดงบนจอ Kiosk · ข้ามขั้นนี้ได้ถ้าไม่มีโฆษณา" },
  4: { title: "ฟอร์มลงทะเบียน", subtitle: "ข้อมูลที่ผู้เข้าร่วมต้องกรอกตอนสแกน QR ลงทะเบียน" },
  5: { title: "ช่วงเวลา", subtitle: "กำหนดช่วงเปิด–ปิดรับลงทะเบียน และช่วงเปิดให้ตอบ Survey" },
  6: { title: "Survey", subtitle: "แบบประเมินของ Event นี้ · 1 Event มีได้ 1 Survey" },
  7: { title: "ตรวจและเผยแพร่", subtitle: "ตรวจความครบถ้วนก่อนเปิดให้ผู้เข้าร่วมเห็น" },
};

export default function EditEventPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  // ---- ด่าน 1: รอ store หลัก hydrate แล้วหา event ที่ Super สร้างให้ ----
  const mainHydrated = useStore((s) => s.hydrated);
  const mainEvent = useStore((s) => s.events.find((e) => e.id === id));

  // ---- ด่าน 2: wizard store ----
  const { draft, drafts, step, setStep, publish, load, ensureFromMainStore } = useWizardStore();

  // รอ localStorage hydrate ก่อน กัน hydration mismatch
  const [ready, setReady] = useState(false);
  useEffect(() => {
    // ถ้า store หลักมี event นี้ (เช่น Super สร้าง Draft ให้) → ย้ายเข้า wizard store ก่อน
    if (mainEvent) ensureFromMainStore(mainEvent);
    load(id);
    setReady(true);
  }, [id, mainEvent, load, ensureFromMainStore]);

  if (!ready || !mainHydrated) return null;
  if (!drafts[id]) return <p className="p-8">ไม่พบ Event นี้ (หรือไม่ได้รับมอบหมาย)</p>;
  if (draft.id !== id) return null;

  // ล็อกเมื่อ Event เริ่มแล้ว (เฉพาะที่เผยแพร่แล้ว)
  const locked = draft.status !== "draft" && isEventLocked(draft.general.date, draft.general.startTime);

  return (
    <WizardShell
      eventName={draft.general.nameTh}
      assignedBy={draft.assignedBy}
      status={PHASE_META[getPhase(draft)].th}
      step={step}
      onStep={setStep}
      title={META[step].title}
      subtitle={META[step].subtitle}
      lockDate={draft.general.date}
      lockTime={draft.general.startTime}
      locked={locked}
      onPublish={() => {
        publish();
        router.push("/admin/events");
      }}
    >
      {step === 1 && <StepGeneral />}
      {step === 2 && <StepTheme />}
      {step === 3 && <StepAds />}
      {step === 4 && <StepForm />}
      {step === 5 && <StepSchedule />}
      {step === 6 && <StepSurvey />}
      {step === 7 && <StepPreview />}
    </WizardShell>
  );
}
