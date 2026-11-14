"use client";

import { useState } from "react";
import { AlertTriangle, Check, Maximize2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FormPreview } from "@/components/event/form-preview";
import { SurveyPreview } from "@/components/event/survey-preview";
import { KioskPreview, PhonePreview } from "@/components/event/brand-preview";
import { THEME_PRESETS } from "@/lib/theme-presets";
import { useWizardStore } from "@/lib/wizard-store";
import { formatThaiDate } from "@/lib/utils/date";
import { eventTypeLabel } from "@/lib/event-types";
import { missingGeneral } from "@/lib/utils/wizard-rules";

interface Row {
  label: string;
  value: string;
  ok: boolean;
}

export function StepPreview() {
  const d = useWizardStore((s) => s.draft);
  const g = d.general;
  const [fullOpen, setFullOpen] = useState(false);

  // ข้อมูลทั่วไป "ครบ" = ช่องที่มีดอกจัน (*) ในขั้นที่ 1 กรอกแล้วทุกช่อง → ถ้าไม่ครบ บอกว่าขาดช่องไหน
  const missing = missingGeneral(d); // ช่องบังคับ (*) ที่ยังไม่กรอก — กันปุ่มเผยแพร่ด้วย (edit/page.tsx)
  const adCount = d.ads.items.length;
  const adNoFile = d.ads.items.filter((a) => !a.dataUrl).length;
  const rows: Row[] = [
    { label: "ข้อมูลทั่วไป", value: missing.length ? `ยังไม่ครบ: ${missing.join(", ")}` : "ครบ", ok: missing.length === 0 },
    { label: "Branding", value: `${THEME_PRESETS.find((p) => p.id === d.theme.preset)?.name ?? "ปรับแต่งเอง"} · ${{ light: "Light", dark: "Dark", bold: "Bold" }[d.theme.mode]} · ${d.theme.primary}${d.general.cover?.dataUrl ? " · มีรูปปก" : ""}`, ok: true },
    adCount === 0
      ? { label: "โฆษณา", value: "ไม่มี (ข้ามได้)", ok: true }
      : {
          label: "โฆษณา",
          value: adNoFile ? `${adCount} รูป · ${adNoFile} รูปยังไม่มีไฟล์` : `${adCount} รูป · เปลี่ยนทุก ${d.ads.seconds} วิ`,
          ok: adNoFile === 0,
        },
    { label: "ฟอร์มลงทะเบียน", value: `${d.form.fields.length} ช่อง`, ok: d.form.fields.length > 0 },
    {
      label: "ช่วงเวลา",
      value: `${formatThaiDate(d.schedule.regOpen.slice(0, 10), false)} – ${formatThaiDate(d.schedule.surveyClose.slice(0, 10), false)}`,
      ok: !!(d.schedule.regOpen && d.schedule.regClose),
    },
    // Survey บังคับมีทุก Event: ยังไม่มีคำถาม = เผยแพร่ไม่ได้
    d.survey.questions.length === 0
      ? { label: "Survey", value: "ยังไม่มีคำถาม (บังคับอย่างน้อย 1 ข้อ)", ok: false }
      : d.survey.questions.some((q) => !q.titleEn)
        ? { label: "Survey", value: `${d.survey.questions.length} คำถาม · EN ยังไม่แปล (ไม่บังคับ)`, ok: false }
        : { label: "Survey", value: `${d.survey.questions.length} คำถาม`, ok: true },
  ];

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Card className="self-start">
        <CardHeader>
          <CardTitle className="text-base">ตรวจความพร้อมก่อนเผยแพร่</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="divide-y">
            {rows.map((r) => (
              <li key={r.label} className="flex items-center gap-3 py-3 text-sm">
                <span className={`flex size-6 items-center justify-center rounded-full ${r.ok ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                  {r.ok ? <Check className="size-3.5" /> : <AlertTriangle className="size-3.5" />}
                </span>
                <span className="flex-1">{r.label}</span>
                <span className={r.ok ? "text-muted-foreground" : "font-semibold text-amber-700"}>{r.value}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 border-t pt-3 text-xs text-muted-foreground">
            กดเผยแพร่แล้ว สถานะจะเปลี่ยนเป็น Active และแก้ไข Event / Survey ไม่ได้อีก
          </p>
        </CardContent>
      </Card>

      {/* Preview มือถือ · กดเพื่อดูเต็มจอ */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm font-semibold">Preview มือถือ</p>
          <span className="text-xs text-muted-foreground">กดที่หน้าจอเพื่อดูเต็มจอ</span>
        </div>
        <button
          type="button"
          onClick={() => setFullOpen(true)}
          aria-label="ดู Preview เต็มจอ"
          className="group relative block w-full rounded-[2rem] text-left focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          <PhonePreview d={d} />
          <span className="absolute inset-0 flex items-center justify-center rounded-[2rem] bg-black/0 opacity-0 transition group-hover:bg-black/30 group-hover:opacity-100">
            <span className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold shadow">
              <Maximize2 className="size-4" /> ดูเต็มจอ
            </span>
          </span>
        </button>
      </div>

      {/* Preview เต็มจอ: หน้า Event · ฟอร์มลงทะเบียน · แบบประเมิน (หน้าตาแบบที่ผู้เข้าร่วมเห็น) */}
      <Dialog open={fullOpen} onOpenChange={setFullOpen}>
        <DialogContent className="flex h-[94vh] w-[96vw] max-w-none flex-col sm:max-w-none">
          <DialogHeader>
            <DialogTitle>Preview เต็มจอ · {g.nameTh || "(ยังไม่ตั้งชื่อ)"}</DialogTitle>
          </DialogHeader>
          <div className="grid min-h-0 flex-1 gap-6 overflow-y-auto rounded-xl bg-muted/40 p-6 md:grid-cols-2 xl:grid-cols-4">
            <PreviewColumn title="จอ Kiosk">
              <KioskPreview d={d} />
            </PreviewColumn>
            <PreviewColumn title="หน้า Event">
              <PhonePreview d={d} />
            </PreviewColumn>
            <PreviewColumn title="ฟอร์มลงทะเบียน (QR ลงทะเบียน)">
              <FormPreview fields={d.form.fields} primary={d.theme.primary} eventName={g.nameTh} />
            </PreviewColumn>
            <PreviewColumn title="แบบประเมิน (QR Survey)">
              <SurveyPreview
                questions={d.survey.questions}
                lang="th"
                primary={d.theme.primary}
                title={`แบบประเมินงาน ${eventTypeLabel(g.type, g.typeOther)}`}
              />
            </PreviewColumn>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PreviewColumn({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <p className="text-center text-sm font-semibold text-muted-foreground">{title}</p>
      {children}
    </div>
  );
}
