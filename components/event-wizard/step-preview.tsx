"use client";

import { AlertTriangle, Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useWizardStore } from "@/lib/wizard-store";
import { formatThaiDate } from "@/lib/utils/date";
import { eventTypeLabel } from "@/lib/event-types";

interface Row {
  label: string;
  value: string;
  ok: boolean;
}

export function StepPreview() {
  const d = useWizardStore((s) => s.draft);
  const g = d.general;

  // ข้อมูลทั่วไป "ครบ" = ช่องที่มีดอกจัน (*) ในขั้นที่ 1 กรอกแล้วทุกช่อง → ถ้าไม่ครบ บอกว่าขาดช่องไหน
  const missing = [
    !g.nameTh && "ชื่อ Event",
    !g.descTh && "รายละเอียด",
    g.type === "other" && !g.typeOther?.trim() && "ประเภทงาน",
    !g.organizer && "ผู้จัด",
    !g.date && "วันที่จัด",
    (!g.startTime || !g.endTime) && "เวลา",
    !g.venue && (g.mode === "onsite" ? "สถานที่" : "ลิงก์เข้าร่วม"),
  ].filter((x): x is string => !!x);
  const adCount = d.ads.items.length;
  const adNoFile = d.ads.items.filter((a) => !a.dataUrl).length;
  const rows: Row[] = [
    { label: "ข้อมูลทั่วไป", value: missing.length ? `ยังไม่ครบ: ${missing.join(", ")}` : "ครบ", ok: missing.length === 0 },
    { label: "Theme", value: `${{ light: "Light", dark: "Dark", bold: "Bold" }[d.theme.mode]} · ${d.theme.primary} / ${d.theme.secondary}`, ok: true },
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
            {eventTypeLabel(g.type, g.typeOther)}
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
