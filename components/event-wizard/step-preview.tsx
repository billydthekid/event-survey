"use client";
// ขั้นที่ 5: Preview — ไม่มี Checklist แล้ว (ทุกขั้นถูกบังคับให้ครบก่อนมาถึงขั้นนี้)
// แสดงหน้าตาที่ผู้เข้าร่วมเห็น เรียงลงมาเต็มความกว้าง: จอ Kiosk → ฟอร์มลงทะเบียน → แบบประเมิน
// ฟอร์ม / Survey ไม่บังคับ → ไม่ได้สร้าง = ขึ้นข้อความว่าไม่มี (แทนตัวอย่างว่าง ๆ)

import { FormPreview } from "@/components/event/form-preview";
import { SurveyPreview } from "@/components/event/survey-preview";
import { KioskPreview } from "@/components/event/brand-preview";
import { useWizardStore } from "@/lib/wizard-store";
import { eventTypeLabel } from "@/lib/event-types";
import { hasRegistration, hasSurvey } from "@/lib/utils/wizard-rules";
import { WizardSection } from "./wizard-section";

export function StepPreview() {
  const d = useWizardStore((s) => s.draft);
  const g = d.general;

  return (
    <>
      <WizardSection
        title="จอ Kiosk"
        description={!hasRegistration(d) && !hasSurvey(d) ? "ไม่มีฟอร์มและ Survey → จอ Kiosk แสดงแค่รายละเอียดงาน ไม่มี QR" : undefined}
      >
        <div className="mx-auto w-full max-w-sm">
          <KioskPreview d={d} />
        </div>
      </WizardSection>

      <WizardSection title="ฟอร์มลงทะเบียน" description="หน้าที่ผู้เข้าร่วมเห็นเมื่อสแกน QR ลงทะเบียน">
        {hasRegistration(d) ? (
          <div className="mx-auto w-full max-w-md">
            <FormPreview fields={d.form.fields} primary={d.theme.primary} eventName={g.nameTh} />
          </div>
        ) : (
          <EmptyPreview text="ไม่ได้เพิ่มฟอร์มลงทะเบียน · Event นี้ไม่รับลงทะเบียน จึงไม่มี Preview ฟอร์ม และไม่มี QR ลงทะเบียน" />
        )}
      </WizardSection>

      <WizardSection title="แบบประเมิน" description="หน้าที่ผู้เข้าร่วมเห็นเมื่อสแกน QR Survey">
        {hasSurvey(d) ? (
          <div className="mx-auto w-full max-w-md">
            <SurveyPreview
              questions={d.survey.questions}
              lang="th"
              primary={d.theme.primary}
              title={`แบบประเมินงาน ${eventTypeLabel(g.type, g.typeOther)}`}
            />
          </div>
        ) : (
          <EmptyPreview text="ไม่ได้เพิ่มคำถาม Survey · Event นี้ไม่มีแบบประเมิน จึงไม่มี Preview Survey และไม่มี QR Survey" />
        )}
      </WizardSection>

      <p className="py-4 text-xs text-muted-foreground">กดเผยแพร่แล้ว สถานะจะเปลี่ยนเป็น Active และแก้ไข Event / Survey ไม่ได้อีก</p>
    </>
  );
}

function EmptyPreview({ text }: { text: string }) {
  return <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">{text}</p>;
}
