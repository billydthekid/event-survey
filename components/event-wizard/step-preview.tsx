"use client";

import { AlertTriangle, Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useWizardStore } from "@/lib/wizard-store";
import { formatThaiDate } from "@/lib/utils/date";

interface Row {
  label: string;
  value: string;
  ok: boolean;
}

export function StepPreview() {
  const d = useWizardStore((s) => s.draft);
  const g = d.general;

  const generalOk = !!(g.nameTh && g.descTh && g.organizer && g.date && g.venue);
  const rows: Row[] = [
    { label: "ข้อมูลทั่วไป", value: generalOk ? "ครบ" : "ยังไม่ครบ", ok: generalOk },
    { label: "Theme", value: `${{ light: "Light", dark: "Dark", bold: "Bold" }[d.theme.mode]} · ${d.theme.primary}`, ok: true },
    d.ad
      ? { label: "โฆษณา", value: d.ad.cropped ? "1 รูป" : "1 รูปยังไม่ได้ Crop", ok: !!d.ad.cropped }
      : { label: "โฆษณา", value: "ไม่มี (ข้ามได้)", ok: true },
    { label: "ฟอร์มลงทะเบียน", value: `${d.form.fields.length} ช่อง`, ok: d.form.fields.length > 0 },
    {
      label: "ช่วงเวลา",
      value: `${formatThaiDate(d.schedule.regOpen.slice(0, 10), false)} – ${formatThaiDate(d.schedule.surveyClose.slice(0, 10), false)}`,
      ok: !!(d.schedule.regOpen && d.schedule.regClose),
    },
    d.survey.questions.some((q) => !q.titleEn)
      ? { label: "Survey", value: "EN ยังไม่แปล (ไม่บังคับ)", ok: false }
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
            กดเผยแพร่แล้ว สถานะจะเปลี่ยนเป็น Scheduled และ Super Admin จะได้รับการแจ้งเตือน
          </p>
        </CardContent>
      </Card>

      {/* Preview มือถือ */}
      <div>
        <p className="mb-2 text-sm font-semibold">Preview มือถือ</p>
        <div className="mx-auto w-full max-w-sm rounded-[2rem] border bg-background p-4 shadow-lg">
          <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
            <span className="rounded border border-dashed px-1">{d.theme.logo ? d.theme.logo.name : "Logo"}</span>
            <span>TH</span>
          </div>
          <div
            className="flex h-32 items-center justify-center rounded-xl text-xs text-muted-foreground"
            style={{ backgroundColor: d.theme.secondary }}
          >
            {g.cover ? g.cover.name : "รูปปก"}
          </div>
          <span className="mt-3 inline-block rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium">
            {{ seminar: "สัมมนา", workshop: "Workshop", training: "อบรม", jobfair: "Job Fair", openhouse: "Open House" }[g.type]}
          </span>
          <h3 className="mt-1 text-lg font-bold">{g.nameTh}</h3>
          <p className="mt-1 text-xs">{formatThaiDate(g.date, false)} · {g.startTime} – {g.endTime}</p>
          <p className="text-xs">{g.venue}{g.spot && ` · ${g.spot}`}</p>
          <p className="mt-2 text-xs text-muted-foreground">{g.descTh}</p>
          <button
            type="button"
            style={{ backgroundColor: d.theme.primary }}
            className="mt-4 w-full rounded-lg py-2.5 text-sm font-semibold text-white"
          >
            ลงทะเบียนเข้างาน
          </button>
        </div>
      </div>
    </div>
  );
}
