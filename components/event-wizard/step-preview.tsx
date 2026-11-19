"use client";
// ขั้นที่ 5: Preview — ไม่มี Checklist แล้ว (ทุกขั้นถูกบังคับให้ครบก่อนมาถึงขั้นนี้)
// แสดงหน้าตาที่ผู้เข้าร่วมเห็น เรียงลงมาเต็มความกว้าง: จอ Kiosk → ฟอร์มลงทะเบียน → แบบประเมิน
// ฟอร์ม / Survey ไม่บังคับ → ไม่ได้สร้าง = ขึ้นข้อความว่าไม่มี (แทนตัวอย่างว่าง ๆ)

import { Lock } from "lucide-react";
import { FormPreview } from "@/components/event/form-preview";
import { SurveyPreview } from "@/components/event/survey-preview";
import { KioskPreview } from "@/components/event/brand-preview";
import { useWizardStore } from "@/lib/wizard-store";
import { eventTypeLabel } from "@/lib/event-types";
import { hasRegistration, hasSurvey } from "@/lib/utils/wizard-rules";
import { pageLook } from "@/lib/theme-presets";
import { WizardSection } from "./wizard-section";
import { useTr, useWizardLang } from "@/lib/wizard-lang";

export function StepPreview() {
  const d = useWizardStore((s) => s.draft);
  const g = d.general;
  const lang = useWizardLang();
  const tr = useTr();

  return (
    <>
      <WizardSection
        title={tr("จอ Kiosk", "Kiosk screen")}
        description={
          !hasRegistration(d) && !hasSurvey(d)
            ? tr("ไม่มีฟอร์มและ Survey → จอ Kiosk แสดงแค่รายละเอียดงาน ไม่มี QR", "No form or survey → the Kiosk shows event details only, no QR")
            : undefined
        }
      >
        <div className={d.theme.kiosk === "landscape" ? "mx-auto w-full max-w-2xl" : "mx-auto w-full max-w-sm"}>
          <KioskPreview d={d} />
        </div>
      </WizardSection>

      <WizardSection
        title={tr("ฟอร์มลงทะเบียน", "Registration form")}
        description={tr("หน้าที่ผู้เข้าร่วมเห็นเมื่อสแกน QR ลงทะเบียน", "What attendees see after scanning the registration QR")}
      >
        {hasRegistration(d) ? (
          <div className="mx-auto w-full max-w-md">
            <FormPreview fields={d.form.fields} primary={d.theme.primary} eventName={g.nameTh} look={pageLook(d.theme, "form")} />
          </div>
        ) : (
          <EmptyPreview
            text={tr(
              "ไม่ได้เพิ่มฟอร์มลงทะเบียน · Event นี้ไม่รับลงทะเบียน จึงไม่มี Preview ฟอร์ม และไม่มี QR ลงทะเบียน",
              "No registration form added · this event takes no registrations, so there's no form preview or registration QR"
            )}
          />
        )}
      </WizardSection>

      <WizardSection
        title={tr("แบบประเมิน", "Survey")}
        description={tr("หน้าที่ผู้เข้าร่วมเห็นเมื่อสแกน QR Survey", "What attendees see after scanning the survey QR")}
      >
        {hasSurvey(d) ? (
          <div className="mx-auto w-full max-w-md">
            <SurveyPreview
              questions={d.survey.questions}
              lang="th"
              primary={d.theme.primary}
              look={pageLook(d.theme, "survey")}
              title={tr("แบบประเมินงาน ", "Feedback: ") + eventTypeLabel(g.type, g.typeOther, lang)}
            />
          </div>
        ) : (
          <EmptyPreview
            text={tr(
              "ไม่ได้เพิ่มคำถาม Survey · Event นี้ไม่มีแบบประเมิน จึงไม่มี Preview Survey และไม่มี QR Survey",
              "No survey questions added · this event has no survey, so there's no survey preview or survey QR"
            )}
          />
        )}
      </WizardSection>

      {/* คำเตือนสำคัญก่อนกดเผยแพร่: เน้นด้วยกล่องสีส้ม + ไอคอนกุญแจ */}
      <div className="py-5">
        <div role="note" className="flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <Lock className="mt-0.5 size-4 shrink-0" />
          <p>
            <span className="font-semibold">{tr("ตรวจให้ครบก่อนกดเผยแพร่", "Check everything before publishing")}</span>
            {tr(" · เผยแพร่แล้วสถานะจะเปลี่ยนเป็น ", " · once published the status becomes ")}
            <span className="font-semibold">Active</span>
            {tr(" และ", " and ")}
            <span className="font-semibold">{tr("แก้ไข Event / Survey ไม่ได้อีก", "the event and survey can't be edited anymore")}</span>
          </p>
        </div>
      </div>
    </>
  );
}

function EmptyPreview({ text }: { text: string }) {
  return <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">{text}</p>;
}
