"use client";


import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowDown, ArrowLeft, ArrowUp, Calendar, ChevronDown, Copy, Lock, Smartphone, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SurveyPreview } from "@/components/event/survey-preview";
import { useWizardStore } from "@/lib/wizard-store";
import { useHydrated } from "@/lib/use-hydrated";
import { QTYPES, qtype } from "@/lib/survey-types";
import { PHASE_META, getPhase } from "@/lib/utils/event-phase";
import { formatThaiDate, isEventLocked } from "@/lib/utils/date";
import { newId } from "@/lib/utils/id";
import { cn } from "@/lib/utils";
import type { SurveyQType, SurveyQuestion } from "@/types/event";
import { eventTypeLabel } from "@/lib/event-types";


const defaultOptions = (type: SurveyQType) => (qtype(type).hasOptions ? ["ตัวเลือก 1", "ตัวเลือก 2"] : []);

export default function SurveyBuilderPage() {
  const { id } = useParams<{ id: string }>();
  const ready = useHydrated();
  const d = useWizardStore((s) => s.drafts[id]);
  const patchEvent = useWizardStore((s) => s.patchEvent);

  const [editLang, setEditLang] = useState<"th" | "en">("th");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  if (!ready) return null;
  if (!d) return <p className="p-8">ไม่พบ Event นี้</p>;

  const qs = d.survey.questions;
  const locked = d.status !== "draft" && isEventLocked(d.general.date, d.general.startTime);
  const selected = qs.find((q) => q.id === (selectedId ?? qs[0]?.id)) ?? null;
  const selectedIndex = selected ? qs.findIndex((q) => q.id === selected.id) : -1;

  const setQs = (next: SurveyQuestion[]) => patchEvent(id, "survey", { questions: next });
  const update = (qid: string, v: Partial<SurveyQuestion>) => setQs(qs.map((q) => (q.id === qid ? { ...q, ...v } : q)));

  const add = (type: SurveyQType) => {
    const nid = newId("q");
    setQs([...qs, { id: nid, type, titleTh: "", titleEn: "", required: false, options: defaultOptions(type) }]);
    setSelectedId(nid);
  };

  const duplicate = (qid: string) => {
    const i = qs.findIndex((q) => q.id === qid);
    const nid = newId("q");
    setQs([...qs.slice(0, i + 1), { ...qs[i], id: nid, options: [...qs[i].options] }, ...qs.slice(i + 1)]);
    setSelectedId(nid);
  };

  const remove = (qid: string) => {
    const next = qs.filter((q) => q.id !== qid);
    setQs(next);
    setSelectedId(next[0]?.id ?? null);
  };

  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= qs.length) return;
    const next = [...qs];
    [next[i], next[j]] = [next[j], next[i]];
    setQs(next);
  };

  const changeType = (q: SurveyQuestion, type: SurveyQType) =>
    update(q.id, { type, options: qtype(type).hasOptions && q.options.length < 2 ? defaultOptions(type) : q.options });

  const minutes = Math.max(1, Math.round(qs.length * 0.7));
  const surveyTitle = `แบบประเมินงาน ${eventTypeLabel(d.general.type, d.general.typeOther)}`;
  const field = editLang === "th" ? "titleTh" : "titleEn";

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#F5F5FA]">
      {/* Top bar */}
      <header className="flex items-center justify-between border-b bg-background px-6 py-3">
        <div className="flex items-center gap-3">
          <Button variant="secondary" size="icon" aria-label="กลับ" nativeButton={false} render={<Link href="/admin/events" />}>
            <ArrowLeft className="size-4" />
          </Button>
          <div className="leading-tight">
            <p className="text-xs text-muted-foreground">Survey · {PHASE_META[getPhase(d)].th}</p>
            <p className="font-semibold">{d.general.nameTh}</p>
          </div>
          <span className="ml-2 text-xs text-emerald-700">✓ บันทึกแล้ว</span>
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            เปิดใช้ Survey
            <Switch checked={d.survey.enabled} disabled={locked} onCheckedChange={(v) => patchEvent(id, "survey", { enabled: v })} />
          </label>
          <ToggleGroup value={[editLang]} onValueChange={(v) => v[0] && setEditLang(v[0] as "th" | "en")} variant="outline" size="sm">
            <ToggleGroupItem value="th">TH</ToggleGroupItem>
            <ToggleGroupItem value="en">EN</ToggleGroupItem>
          </ToggleGroup>
          <Button variant="outline" onClick={() => setPreviewOpen(true)}>
            <Smartphone className="size-4" /> Preview มือถือ
          </Button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        {/* คอลัมน์หลัก */}
        <main className="flex-1 overflow-y-auto px-6 py-6">
          <div className="mx-auto max-w-5xl space-y-5">
            <div className="flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm text-blue-900">
              <Lock className="size-4 shrink-0" />
              {locked
                ? "Event เริ่มแล้ว · Survey ถูกล็อก ดูผลและ Export ได้อย่างเดียว"
                : `แก้ไขได้ถึง ${formatThaiDate(d.general.date, false)} ${d.general.startTime} · เมื่อ Event เริ่ม Survey จะถูกล็อกพร้อม Event`}
            </div>

            <div>
              <h1 className="text-3xl font-bold tracking-tight">{surveyTitle}</h1>
              <p className="mt-1 text-sm text-muted-foreground">ใช้เวลาประมาณ {minutes} นาที · 1 Event มีได้ 1 Survey</p>
            </div>

            <fieldset disabled={locked} className="min-w-0 space-y-4">
              {qs.length === 0 && (
                <p className="rounded-2xl border border-dashed bg-background py-12 text-center text-sm text-muted-foreground">
                  ยังไม่มีคำถาม เลือกประเภทด้านล่างเพื่อเริ่มสร้าง
                </p>
              )}

              {qs.map((q, i) => {
                const isSel = selected?.id === q.id;
                const meta = qtype(q.type);
                const value = q[field];
                return (
                  <section
                    key={q.id}
                    onClick={() => setSelectedId(q.id)}
                    onFocusCapture={() => setSelectedId(q.id)}
                    className={cn("space-y-4 rounded-2xl border bg-background p-5 transition", isSel && "border-2 border-primary")}
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium text-primary">{i + 1} · {meta.th}</p>
                      <div className="flex gap-2">
                        <Button variant="outline" size="icon" aria-label="ทำสำเนา" onClick={() => duplicate(q.id)}>
                          <Copy className="size-4" />
                        </Button>
                        <Button variant="ghost" size="icon" aria-label="ลบ" className="bg-red-50 text-red-600 hover:bg-red-100" onClick={() => remove(q.id)}>
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </div>

                    {/* ชื่อคำถาม พิมพ์แก้ในการ์ดได้เลย */}
                    <div className="flex items-baseline gap-1">
                      <input
                        value={value}
                        onChange={(e) => update(q.id, { [field]: e.target.value })}
                        placeholder={editLang === "en" ? q.titleTh || "Type your question…" : "พิมพ์คำถาม…"}
                        aria-label="ชื่อคำถาม"
                        className="field-sizing-content min-w-[10ch] max-w-full bg-transparent text-xl font-bold outline-none placeholder:font-normal placeholder:text-muted-foreground/60"
                      />
                      {q.required && <span className="text-xl font-bold text-destructive">*</span>}
                    </div>

                    {/* ตัวอย่างช่องตอบ */}
                    {q.type === "rating" && (
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <span key={n} className="flex size-10 items-center justify-center rounded-lg border text-sm font-semibold">{n}</span>
                        ))}
                      </div>
                    )}
                    {q.type === "short" && (
                      <div className="max-w-md rounded-lg border px-4 py-2.5 text-sm text-muted-foreground">ผู้ตอบพิมพ์คำตอบสั้น ๆ ที่นี่…</div>
                    )}
                    {q.type === "long" && (
                      <div className="h-24 rounded-lg border px-4 py-3 text-sm text-muted-foreground">ผู้ตอบพิมพ์คำตอบที่นี่…</div>
                    )}
                    {q.type === "date" && (
                      <div className="flex max-w-xs items-center justify-between rounded-lg border px-4 py-2.5 text-sm text-muted-foreground">
                        dd / mm / yyyy <Calendar className="size-4" />
                      </div>
                    )}
                    {meta.hasOptions && (
                      <div className="space-y-2">
                        {q.options.map((o, k) => (
                          <div key={k} className="group flex max-w-2xl items-center gap-3 rounded-lg border px-4 py-2.5">
                            {q.type === "dropdown" ? (
                              <span className="w-4 text-center text-xs text-muted-foreground">{k + 1}</span>
                            ) : (
                              <span className={cn("size-4 shrink-0 border", q.type === "single" ? "rounded-full" : "rounded")} />
                            )}
                            <input
                              value={o}
                              onChange={(e) => update(q.id, { options: q.options.map((x, n) => (n === k ? e.target.value : x)) })}
                              aria-label={`ตัวเลือก ${k + 1}`}
                              className="min-w-0 flex-1 bg-transparent text-sm outline-none"
                            />
                            <button
                              type="button"
                              aria-label="ลบตัวเลือก"
                              disabled={q.options.length <= 2}
                              onClick={() => update(q.id, { options: q.options.filter((_, n) => n !== k) })}
                              className="text-muted-foreground opacity-0 transition hover:text-foreground focus:opacity-100 group-hover:opacity-100 disabled:hidden"
                            >
                              <X className="size-4" />
                            </button>
                          </div>
                        ))}
                        {q.type === "dropdown" && (
                          <p className="flex items-center gap-1 text-xs text-muted-foreground"><ChevronDown className="size-3.5" /> ผู้ตอบเลือกจากรายการนี้</p>
                        )}
                        <button
                          type="button"
                          onClick={() => update(q.id, { options: [...q.options, `ตัวเลือก ${q.options.length + 1}`] })}
                          className="text-sm text-primary hover:underline"
                        >
                          + เพิ่มตัวเลือก
                        </button>
                      </div>
                    )}
                  </section>
                );
              })}

              {/* เพิ่มคำถาม */}
              <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-dashed bg-background/60 p-4">
                <span className="mr-2 text-sm text-muted-foreground">เพิ่มคำถาม</span>
                {QTYPES.map((qt) => (
                  <button
                    key={qt.value}
                    type="button"
                    onClick={() => add(qt.value)}
                    className="rounded-full bg-muted px-4 py-2 text-sm font-semibold hover:bg-muted/70"
                  >
                    {qt.th}
                  </button>
                ))}
              </div>
            </fieldset>
          </div>
        </main>

        {/* แผงตั้งค่าคำถามที่เลือก */}
        <aside className="hidden w-[360px] shrink-0 overflow-y-auto border-l bg-background p-6 lg:block">
          {selected ? (
            <fieldset disabled={locked} className="space-y-6">
              <div>
                <p className="text-xs text-primary">คำถามที่ {selectedIndex + 1}</p>
                <h2 className="text-xl font-bold">ตั้งค่า</h2>
              </div>

              <div className="flex items-center justify-between border-b pb-5">
                <div>
                  <p className="text-sm font-semibold">Required</p>
                  <p className="text-xs text-muted-foreground">ต้องตอบก่อนส่ง</p>
                </div>
                <Switch checked={selected.required} onCheckedChange={(v) => update(selected.id, { required: v })} />
              </div>

              <div className="space-y-2 border-b pb-5">
                <label htmlFor="qtype" className="text-sm font-semibold">ประเภทคำตอบ</label>
                <select
                  id="qtype"
                  value={selected.type}
                  onChange={(e) => changeType(selected, e.target.value as SurveyQType)}
                  className="h-11 w-full rounded-lg border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {QTYPES.map((qt) => (
                    <option key={qt.value} value={qt.value}>{qt.th}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2 border-b pb-5">
                <p className="text-sm font-semibold">ภาษา</p>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">ไทย</span>
                  <span className={cn("font-semibold", selected.titleTh ? "text-emerald-700" : "text-amber-700")}>
                    {selected.titleTh ? "ครบ" : "ยังไม่ได้กรอก"}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">English</span>
                  <span className={cn("font-semibold", selected.titleEn ? "text-emerald-700" : "text-amber-700")}>
                    {selected.titleEn ? "ครบ" : "ยังไม่ได้แปล"}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-semibold">ลำดับ</p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled={selectedIndex === 0} onClick={() => move(selectedIndex, -1)}>
                    <ArrowUp className="size-4" /> ย้ายขึ้น
                  </Button>
                  <Button variant="outline" size="sm" disabled={selectedIndex === qs.length - 1} onClick={() => move(selectedIndex, 1)}>
                    <ArrowDown className="size-4" /> ย้ายลง
                  </Button>
                </div>
              </div>
            </fieldset>
          ) : (
            <p className="text-sm text-muted-foreground">เลือกคำถามเพื่อตั้งค่า</p>
          )}

          <div className="mt-6 space-y-1 rounded-xl bg-muted/60 p-4 text-xs text-muted-foreground">
            <p className="font-semibold text-foreground">สิทธิ์ของคุณ</p>
            <p>แก้ไขคำถามได้จนกว่า Event จะเริ่ม · หลังจากนั้นดูผลและ Export ได้อย่างเดียว · การลบ Survey ทำได้โดย Super Admin เท่านั้น</p>
          </div>
        </aside>
      </div>

      {/* Preview มือถือ */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-h-[90vh] max-w-md overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Preview มือถือ ({editLang.toUpperCase()})</DialogTitle>
          </DialogHeader>
          <SurveyPreview questions={qs} lang={editLang} primary={d.theme.primary} title={surveyTitle} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
