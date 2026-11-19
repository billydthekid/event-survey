"use client";
// ขั้นที่ 4: Survey — หน้าเดียวเรียงลงมา (แบบเดียวกับขั้นฟอร์มลงทะเบียน): เวลาเปิด–ปิดรับคำตอบ → คำถาม
// Survey Builder เดิม (/survey/builder) ย้ายมาอยู่ตรงนี้แล้ว:
// - การ์ดทีละคำถาม: พิมพ์คำถามในการ์ด (ภาษาไทย) · แก้ตัวเลือก / ตาราง / สเกล (QuestionEditor) · ทำสำเนา · ลบ
// - ท้ายการ์ด: เปลี่ยนประเภท · คะแนนเต็ม (ให้ดาว / สเกล) · Required (เดิมอยู่แผงขวา)
// - ลากที่ ⋮⋮ เพื่อเรียงลำดับ (lib/use-drag-sort.ts) · แถบ "เพิ่มคำถาม" = 12 ประเภท (lib/survey-types.ts)
// - Survey ไม่บังคับ (ไม่มีคำถาม = ไม่มี Survey) · ถ้ามีคำถามต้องกำหนดเวลาก่อนกด "ถัดไป" (stepBlock)

import { useState } from "react";
import { Copy, GripVertical, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { ratingOf } from "@/components/event/survey-preview";
import { QuestionEditor } from "@/components/event/survey-question-editor";
import { useWizardStore } from "@/lib/wizard-store";
import { useDragSort } from "@/lib/use-drag-sort";
import { QTYPES, defaultsFor, normalizeQuestion, qtype } from "@/lib/survey-types";
import { newId } from "@/lib/utils/id";
import { cn } from "@/lib/utils";
import type { RatingMax, SurveyQType, SurveyQuestion } from "@/types/event";
import { TimeWindowFields } from "./time-window-fields";
import { WizardSection } from "./wizard-section";
import { useTr, useWizardLang } from "@/lib/wizard-lang";

export function StepSurvey() {
  const draft = useWizardStore((s) => s.draft);
  const patch = useWizardStore((s) => s.patch);
  const lang = useWizardLang();
  const tr = useTr();
  const en = lang === "en";
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // ข้อมูลเก่า (rating ตัวเลข) → linear · แก้ครั้งถัดไปจะถูกบันทึกเป็นแบบใหม่
  const qs = draft.survey.questions.map(normalizeQuestion);
  const setQs = (next: SurveyQuestion[]) => patch("survey", { questions: next });
  const update = (qid: string, v: Partial<SurveyQuestion>) => setQs(qs.map((q) => (q.id === qid ? { ...q, ...v } : q)));
  const sort = useDragSort(qs, setQs); // ลากเรียงคำถาม

  const add = (type: SurveyQType) => { // เพิ่มคำถามใหม่: ประเภท + ค่าตั้งต้นของประเภทนั้น + id ใหม่
    const nid = newId("q");
    setQs([...qs, { id: nid, type, titleTh: "", titleEn: "", required: false, options: [], ...defaultsFor(type, undefined, lang) }]);
    setSelectedId(nid);
  };

  const duplicate = (qid: string) => { // ทำสำเนา: copy + id ใหม่ + insert หลังคำถามเดิม
    const i = qs.findIndex((q) => q.id === qid);
    const nid = newId("q");
    const src = qs[i];
    const copy = { ...src, id: nid, options: [...src.options], rows: src.rows ? [...src.rows] : undefined };
    setQs([...qs.slice(0, i + 1), copy, ...qs.slice(i + 1)]);
    setSelectedId(nid);
  };

  const remove = (qid: string) => setQs(qs.filter((q) => q.id !== qid));
  const changeType = (q: SurveyQuestion, type: SurveyQType) => update(q.id, { type, ...defaultsFor(type, q, lang) });


  return (
    <>
      <WizardSection
        title={tr("เปิดตอบ Survey", "Survey window")}
        description={
          qs.length === 0
            ? tr("Survey ไม่บังคับ · ไม่มีคำถาม = Event นี้ไม่มี Survey (ข้ามขั้นนี้ได้)", "The survey is optional · no questions = no survey for this event (you can skip this step)")
            : tr("ผู้เข้าร่วมตอบแบบประเมินผ่าน QR Survey ได้เฉพาะช่วงนี้", "Attendees can answer via the survey QR only during this time")
        }
      >
        <TimeWindowFields
          openKey="surveyOpen"
          closeKey="surveyClose"
          openLabel={tr("เปิดให้ตอบ", "Opens")}
          closeLabel={tr("ปิดรับคำตอบ", "Closes")}
          required={qs.length > 0}
        />
      </WizardSection>

      {/* พิมพ์คำถามภาษาไทยอย่างเดียว (ตัดปุ่มสลับ TH / EN ออกแล้ว · titleEn เดิมยังเก็บไว้) */}
      <WizardSection title={tr("คำถาม", "Questions")} description={tr(`${qs.length} คำถาม · ลากที่ ⋮⋮ เพื่อเรียงลำดับ`, `${qs.length} questions · drag ⋮⋮ to reorder`)}>
        {qs.length === 0 && (
          <p className="rounded-2xl border border-dashed py-12 text-center text-sm text-muted-foreground">
            {tr("ยังไม่มีคำถาม เลือกประเภทจากแถบด้านล่างเพื่อเริ่มสร้าง", "No questions yet. Pick a type from the bar below to start")}
          </p>
        )}

        {qs.map((q, i) => {
          const meta = qtype(q.type);
          const isSel = selectedId === q.id;
          const scale = q.type === "rating" || q.type === "linear";
          return (
            <section
              key={q.id}
              {...sort.itemProps(i)}
              onClick={() => setSelectedId(q.id)}
              onFocusCapture={() => setSelectedId(q.id)}
              className={cn(
                "space-y-4 rounded-2xl border bg-background p-5 transition",
                isSel && "border-primary ring-1 ring-primary",
                sort.stateOf(i).dragging && "opacity-40",
                sort.stateOf(i).over && "ring-2 ring-primary/50"
              )}
            >
              <div className="flex items-center justify-between">
                <p className="flex items-center gap-2 text-xs font-medium text-primary">
                  <span {...sort.handleProps(i)} className={cn(sort.handleProps(i).className, "text-muted-foreground")}>
                    <GripVertical className="size-4" />
                  </span>
                  <span className="flex size-6 items-center justify-center rounded-md bg-primary/10">
                    <meta.icon className="size-3.5" />
                  </span>
                  {i + 1} · {en ? meta.en : meta.th}
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="icon" aria-label={tr("ทำสำเนา", "Duplicate")} onClick={(e) => { e.stopPropagation(); duplicate(q.id); }}>
                    <Copy className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={tr("ลบคำถามนี้", "Delete this question")}
                    className="bg-red-50 text-red-600 hover:bg-red-100"
                    onClick={(e) => { e.stopPropagation(); remove(q.id); }}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>

              {/* ชื่อคำถาม พิมพ์แก้ในการ์ดได้เลย */}
              <div className="flex items-baseline gap-1">
                <input
                  value={q.titleTh}
                  onChange={(e) => update(q.id, { titleTh: e.target.value })}
                  placeholder={tr("พิมพ์คำถาม…", "Type your question…")}
                  aria-label={tr("ชื่อคำถาม", "Question")}
                  className="field-sizing-content min-w-[10ch] max-w-full bg-transparent text-lg font-bold outline-none placeholder:font-normal placeholder:text-muted-foreground/60"
                />
                {q.required && <span className="text-lg font-bold text-destructive">*</span>}
              </div>

              {/* ช่องตอบ: แก้ตัวเลือก / แถว-คอลัมน์ของตาราง / คำกำกับสเกล ในการ์ดได้เลย */}
              <QuestionEditor q={q} primary={draft.theme.primary} update={(v) => update(q.id, v)} />

              {/* ประเภท + คะแนนเต็ม + Required (เดิมอยู่แผงตั้งค่าด้านขวาของ Survey Builder) */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-3">
                <div className="flex flex-wrap items-center gap-3">
                  <label className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">{tr("ประเภท", "Type")}</span>
                    <select
                      value={q.type}
                      onChange={(e) => changeType(q, e.target.value as SurveyQType)}
                      className="h-8 rounded-lg border bg-background px-2 text-sm"
                    >
                      {QTYPES.map((qt) => (
                        <option key={qt.value} value={qt.value}>
                          {en ? qt.en : qt.th}
                        </option>
                      ))}
                    </select>
                  </label>
                  {scale && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground">{q.type === "rating" ? tr("จำนวนดาว", "Stars") : tr("คะแนนเต็ม", "Max score")}</span>
                      <ToggleGroup
                        value={[String(ratingOf(q).max)]}
                        onValueChange={(v) => v[0] && update(q.id, { ratingMax: Number(v[0]) as RatingMax })}
                        variant="outline"
                        size="sm"
                      >
                        <ToggleGroupItem value="5">1–5</ToggleGroupItem>
                        <ToggleGroupItem value="10">1–10</ToggleGroupItem>
                      </ToggleGroup>
                    </div>
                  )}
                </div>
                <label className="flex items-center gap-2 text-sm">
                  Required <span className="text-xs text-muted-foreground">{tr("(ต้องตอบก่อนส่ง)", "(must be answered)")}</span>
                  <Switch checked={q.required} onCheckedChange={(v) => update(q.id, { required: v })} />
                </label>
              </div>
            </section>
          );
        })}

        {/* ===== แถบเพิ่มคำถาม: 12 ประเภท ===== */}
        <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-dashed p-4">
          <span className="mr-2 text-sm text-muted-foreground">{tr("เพิ่มคำถาม", "Add question")}</span>
          {QTYPES.map((qt) => (
            <button
              key={qt.value}
              type="button"
              onClick={() => add(qt.value)}
              className="flex items-center gap-1.5 rounded-full bg-muted px-4 py-2 text-sm font-semibold transition hover:bg-foreground/15"
            >
              <qt.icon className="size-4" /> {en ? qt.en : qt.th}
            </button>
          ))}
        </div>
      </WizardSection>
    </>
  );
}
