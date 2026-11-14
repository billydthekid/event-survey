// app/admin/events/[id]/survey/page.tsx
// หน้า "Survey" ของ Event (กดจากเมนู Survey ใน Sidebar): สรุป Survey + รายการคำถาม
// กด "แก้ไข Survey" → /survey/builder (Survey Builder)
"use client";
import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Lock, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SurveyPreview } from "@/components/event/survey-preview";
import { normalizeQuestion, qtype } from "@/lib/survey-types";
import { getSurveyState } from "@/lib/utils/event-phase";
import { formatThaiShortDateTime } from "@/lib/utils/date";
import { cn } from "@/lib/utils";
import { SurveyDenied, lockBannerText, useSurveyDraft } from "./surveyAccess";

export default function SurveySummaryPage() {
  const { id } = useParams<{ id: string }>();
  const state = useSurveyDraft(id);
  const [previewOpen, setPreviewOpen] = useState(false);

  if (state.state === "loading") return null;
  if (state.state === "denied") return <SurveyDenied />;
  const { draft: d, locked, access } = state;

  const qs = d.survey.questions;
  const requiredCount = qs.filter((q) => q.required).length;
  const enMissing = qs.some((q) => !q.titleEn);
  const survey = getSurveyState(d);

  // คำตอบ: มีข้อมูลเฉพาะ Event ที่เริ่มแล้ว (ด่านเดียวกับ Report) — ไม่มี → "–"
  const responses = access.status === "ok" ? access.data.responses : [];
  const regs = access.status === "ok" ? access.data.registrations.length : 0;
  const hasData = access.status === "ok";

  const statusSub =
    survey.key === "open"
      ? `ปิดรับ ${formatThaiShortDateTime(d.schedule.surveyClose)}`
      : survey.key === "closed"
        ? `ปิดรับเมื่อ ${formatThaiShortDateTime(d.schedule.surveyClose)}`
        : d.schedule.surveyOpen
          ? `เปิดให้ตอบ ${formatThaiShortDateTime(d.schedule.surveyOpen)}`
          : "ยังไม่กำหนดเวลา";

  const stats = [
    { label: "สถานะ", value: survey.label, valueCls: survey.cls, sub: statusSub },
    { label: "จำนวนคำถาม", value: `${qs.length} ข้อ`, sub: `บังคับตอบ ${requiredCount} ข้อ` },
    {
      label: "คำตอบ",
      value: hasData ? String(responses.length) : "–",
      sub: hasData ? `จากผู้ลงทะเบียน ${regs} คน` : survey.key === "open" || survey.key === "closed" ? "ยังไม่มีคำตอบ" : "ยังไม่เปิดให้ตอบ",
    },
    {
      label: "ภาษา",
      value: "TH · EN",
      sub: qs.length === 0 ? "—" : enMissing ? "EN ยังไม่ได้แปล" : "EN ครบ",
      subCls: qs.length > 0 && enMissing ? "text-amber-700" : qs.length > 0 ? "text-emerald-700" : undefined,
    },
  ];

  return (
    // ครอบตัวแปรสีหลักเป็นน้ำเงินตามดีไซน์ (เฉพาะหน้านี้)
    <div className="space-y-5 [--primary:oklch(0.546_0.245_262.881)] [--primary-foreground:oklch(1_0_0)] [--ring:oklch(0.546_0.245_262.881)]">
      {/* หัวหน้า */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Survey</h1>
          <p className="mt-1 text-sm text-slate-500">แบบประเมินงาน {d.general.nameTh} · 1 Event มีได้ 1 Survey</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="bg-white" onClick={() => setPreviewOpen(true)}>
            <Smartphone className="size-4" /> Preview มือถือ
          </Button>
          <Button nativeButton={false} render={<Link href={`/admin/events/${id}/survey/builder`} />}>
            {locked ? "ดู Survey" : "แก้ไข Survey"}
          </Button>
        </div>
      </div>

      {/* แบนเนอร์ล็อก: แสดงเฉพาะเมื่อล็อกแล้ว */}
      {locked && (
        <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-900">
          <Lock className="size-4 shrink-0" />
          {lockBannerText(d, locked)}
        </div>
      )}

      {/* การ์ดสรุป 4 ใบ */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
            <p className="text-xs text-slate-500">{s.label}</p>
            <p className={cn("mt-2 text-2xl font-bold", s.valueCls)}>{s.value}</p>
            <p className={cn("mt-3 text-xs text-slate-500", s.subCls)}>{s.sub}</p>
          </div>
        ))}
      </div>

      {/* รายการคำถาม */}
      <div className="rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
        <h2 className="border-b px-6 py-5 text-lg font-semibold">คำถาม</h2>
        {qs.length === 0 ? (
          <p className="px-6 py-10 text-center text-sm text-slate-500">ยังไม่มีคำถาม กด &quot;แก้ไข Survey&quot; เพื่อเริ่มสร้าง</p>
        ) : (
          <ul className="divide-y">
            {qs.map((q, i) => {
              // จำนวนคนที่ตอบข้อนี้ (answers ใช้ id ของคำถามเป็น key)
              const answered = responses.filter((r) => r.answers[q.id] !== undefined).length;
              return (
                <li key={q.id} className="flex items-center gap-4 px-6 py-4">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-sm font-semibold text-blue-600">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">
                      {q.titleTh || <span className="font-normal text-slate-400">(ยังไม่ตั้งชื่อคำถาม)</span>}
                      {q.required && <span className="ml-1 text-red-600">*</span>}
                    </p>
                    <p className="flex items-center gap-1.5 text-xs text-slate-500">
                      <TypeIcon type={normalizeQuestion(q).type} />
                      {qtype(normalizeQuestion(q).type).en} · {qtype(normalizeQuestion(q).type).th}
                      {(normalizeQuestion(q).type === "linear" || q.type === "rating") && ` 1–${q.ratingMax ?? 5}`}
                    </p>
                  </div>
                  <span className="shrink-0 text-sm text-slate-500">{answered > 0 ? `${answered} คำตอบ` : "ยังไม่มีคำตอบ"}</span>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Preview มือถือ */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-h-[90vh] max-w-md overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Preview มือถือ</DialogTitle>
          </DialogHeader>
          <SurveyPreview questions={qs} lang="th" primary={d.theme.primary} title={`แบบประเมินงาน ${d.general.nameTh}`} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ไอคอนประเภทคำถาม (ชุดเดียวกับ Survey Builder)
function TypeIcon({ type }: { type: Parameters<typeof qtype>[0] }) {
  const Icon = qtype(type).icon;
  return <Icon className="size-3.5" />;
}
