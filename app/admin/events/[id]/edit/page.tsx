"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { useNow } from "@/lib/hooks/useNow";
import { useWizardStore } from "@/lib/wizard-store";
import { useEventAccess } from "@/app/admin/events/[id]/eventAccess";
import { isWizardLocked, toEventPatch, validateDates } from "@/lib/utils/wizard-rules";
import { allowListProblem } from "@/lib/allow-list";
import { PHASE_META, getPhase } from "@/lib/utils/event-phase";
import { STATUS_LABEL } from "@/lib/utils/status";
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

  // ---- ด่านสิทธิ์: กฎเดียวกับ Dashboard / Report / QR / Kiosk (ไม่พบ / ถูกลบ / ไม่ได้รับมอบหมาย → denied) ----
  const access = useEventAccess(id);
  const mainEvent = access.status === "nodata" || access.status === "ok" ? access.event : null;
  const updateEvent = useStore((s) => s.updateEvent);
  const addLog = useStore((s) => s.addLog);

  // ---- wizard store ----
  const { draft, drafts, step, setStep, publish, load, ensureFromMainStore } = useWizardStore();

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

  if (access.status === "loading") return null;
  if (access.status === "denied") return <NoAccess />;
  if (!drafts[id] || !current || !mainEvent) return null;

  const dateErrors = validateDates(current, now);
  // เหตุผลที่ยังเผยแพร่ไม่ได้ (เรียงตามความสำคัญ · ไม่มี = เผยแพร่ได้)
  const publishBlock =
    Object.keys(dateErrors).length > 0
      ? "แก้วันเวลาที่ไม่ถูกต้องก่อน (ขั้นที่ 1 และ 5)"
      : current.survey.questions.length === 0
        ? "ต้องมีคำถาม Survey อย่างน้อย 1 ข้อ (ขั้นที่ 6)" // Survey บังคับมีทุก Event
        : allowListProblem(current);

  return (
    <WizardShell
      eventName={current.general.nameTh}
      assignedBy={current.assignedBy}
      status={locked ? STATUS_LABEL[mainEvent.status].text : PHASE_META[getPhase(current)].th}
      step={step}
      onStep={setStep}
      title={META[step].title}
      subtitle={META[step].subtitle}
      locked={locked}
      publishBlock={publishBlock}
      onPublish={() => {
        if (publishBlock) return;
        publish();
        // เผยแพร่ = Active ทันที (Draft → เผยแพร่ → Active → Ended) และล็อก Wizard ต่อจากนี้
        updateEvent(id, { ...toEventPatch(current), status: "active" });
        addLog("publish_event", "event", id, `เผยแพร่ "${current.general.nameTh}"`);
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
