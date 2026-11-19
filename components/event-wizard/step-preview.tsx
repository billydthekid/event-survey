"use client";
// ขั้นที่ 5: Preview — ไม่มี Checklist แล้ว (ทุกขั้นถูกบังคับให้ครบก่อนมาถึงขั้นนี้)
// แสดงหน้าตาที่ผู้เข้าร่วมเห็น เรียงลงมาเต็มความกว้าง: จอ Kiosk → ฟอร์มลงทะเบียน → แบบประเมิน

import { FormPreview } from "@/components/event/form-preview";
import { SurveyPreview } from "@/components/event/survey-preview";
import { KioskPreview } from "@/components/event/brand-preview";
import { useWizardStore } from "@/lib/wizard-store";
import { eventTypeLabel } from "@/lib/event-types";
import { WizardSection } from "./wizard-section";

export function StepPreview() {
  const d = useWizardStore((s) => s.draft);
  const g = d.general;

  return (
    <>
      <WizardSection title="จอ Kiosk">
        <div className="mx-auto w-full max-w-sm">
          <KioskPreview d={d} />
        </div>
      </WizardSection>

      <WizardSection title="ฟอร์มลงทะเบียน" description="หน้าที่ผู้เข้าร่วมเห็นเมื่อสแกน QR ลงทะเบียน">
        <div className="mx-auto w-full max-w-md">
          <FormPreview fields={d.form.fields} primary={d.theme.primary} eventName={g.nameTh} />
        </div>
      </WizardSection>

      <WizardSection title="แบบประเมิน" description="หน้าที่ผู้เข้าร่วมเห็นเมื่อสแกน QR Survey">
        <div className="mx-auto w-full max-w-md">
          <SurveyPreview
            questions={d.survey.questions}
            lang="th"
            primary={d.theme.primary}
            title={`แบบประเมินงาน ${eventTypeLabel(g.type, g.typeOther)}`}
          />
        </div>
      </WizardSection>

      <p className="py-4 text-xs text-muted-foreground">กดเผยแพร่แล้ว สถานะจะเปลี่ยนเป็น Active และแก้ไข Event / Survey ไม่ได้อีก</p>
    </>
  );
}
