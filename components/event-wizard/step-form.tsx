"use client";
// ฟ้าใส: ขั้นที่ 3: ฟอร์มลงทะเบียน — หน้าเดียวเรียงลงมา: เวลาเปิด–ปิดรับลงทะเบียน → ช่องในฟอร์ม (แบบ Google Form)
// ฟ้าใส: - การ์ดทีละช่อง: พิมพ์ชื่อช่อง · ตั้งตัวเลือก (Multiple Choice / Checkboxes / Dropdown) · ทำสำเนา · ลบ
// ฟ้าใส: - ท้ายการ์ด: เปลี่ยนประเภท + Required (เดิมอยู่แผงขวา)
// ฟ้าใส: - ลากที่ ⋮⋮ เพื่อเรียงลำดับ (lib/use-drag-sort.ts)
// ฟ้าใส: - แถบ "เพิ่มช่อง" = 12 ประเภท (lib/form-types.ts) · กดแล้วได้ช่องพร้อมชื่อตัวอย่าง แก้ชื่อได้
// ฟ้าใส: - ฟอร์มไม่บังคับ (ไม่มีช่อง = ไม่รับลงทะเบียน) · ถ้ามีช่องต้องกำหนดเวลาเปิด–ปิดรับก่อนกด "ถัดไป" (stepBlock)

import { useState } from "react";
import { Copy, Eye, GripVertical, Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FieldSample, FormPreview } from "@/components/event/form-preview";
import { pageLook } from "@/lib/theme-presets";
import { useWizardStore } from "@/lib/wizard-store";
import { useDragSort } from "@/lib/use-drag-sort";
import { FORM_KINDS, defaultOptions, formKind } from "@/lib/form-types";
import { useTr, useWizardLang } from "@/lib/wizard-lang";
import { cn } from "@/lib/utils";
import { newId } from "@/lib/utils/id";
import type { FieldKind, FormField } from "@/types/event";
import { TimeWindowFields } from "./time-window-fields";
import { WizardSection } from "./wizard-section";

// ฟ้าใส: ขั้นที่ 3 ฟอร์มลงทะเบียน
export function StepForm() {
  // ฟ้าใส: ช่องทั้งหมดในฟอร์ม
  const fields = useWizardStore((s) => s.draft.form.fields);
  // ฟ้าใส: Event ที่กำลังแก้
  const draft = useWizardStore((s) => s.draft);
  // ฟ้าใส: ฟังก์ชันบันทึก
  const patch = useWizardStore((s) => s.patch);
  // ฟ้าใส: ภาษาที่เลือก
  const lang = useWizardLang();
  // ฟ้าใส: ตัวเลือกข้อความตามภาษา
  const tr = useTr();
  // ฟ้าใส: ภาษาอังกฤษไหม
  const en = lang === "en";
  // ฟ้าใส: บันทึกรายการช่องใหม่ทั้งหมด
  const setFields = (f: FormField[]) => patch("form", { fields: f });

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [justAdded, setJustAdded] = useState<string | null>(null); // ฟ้าใส: ช่องที่เพิ่งเพิ่ม → โฟกัสชื่อให้พิมพ์ต่อได้เลย
  const [previewOpen, setPreviewOpen] = useState(false);

  // ฟ้าใส: แก้ช่องเดียวตาม id
  const update = (id: string, v: Partial<FormField>) => setFields(fields.map((f) => (f.id === id ? { ...f, ...v } : f)));
  // ฟ้าใส: เลือกการ์ดช่อง (ไว้ไฮไลต์)
  const select = (id: string) => setSelectedId(id);
  const add = (kind: FieldKind) => { // ฟ้าใส: เพิ่มช่องใหม่: ประเภท + ชื่อตัวอย่าง + id ใหม่
    // ฟ้าใส: ข้อมูลของประเภทที่เลือก
    const k = formKind(kind);
    // ฟ้าใส: สร้าง id ใหม่
    const id = newId("f");
    setFields([...fields, { id, label: en ? k.exampleEn : k.example, kind, hint: k.th, required: false, options: k.hasOptions ? defaultOptions(lang) : undefined }]);
    setSelectedId(id);
    setJustAdded(id);
  };

  const duplicate = (id: string) => { // ฟ้าใส: ทำสำเนาช่อง: copy + id ใหม่ + insert หลังช่องเดิม
    // ฟ้าใส: ตำแหน่งของช่องที่จะทำสำเนา
    const i = fields.findIndex((f) => f.id === id);
    // ฟ้าใส: id ของสำเนา
    const nid = newId("f");
    // ฟ้าใส: สำเนา (คัดลอกตัวเลือกแยกกัน ไม่ใช้ array ร่วม)
    const copy = { ...fields[i], id: nid, options: fields[i].options ? [...fields[i].options!] : undefined };
    setFields([...fields.slice(0, i + 1), copy, ...fields.slice(i + 1)]);
    setSelectedId(nid);
  };

  const remove = (id: string) => { // ฟ้าใส: ลบช่อง: filter + เลือกช่องถัดไป (หรือ null ถ้าไม่มีเหลือ)
    // ฟ้าใส: รายการที่เหลือหลังลบ
    const next = fields.filter((f) => f.id !== id);
    setFields(next);
    setSelectedId(next[0]?.id ?? null);
  };

  // ฟ้าใส: เปลี่ยนประเภท: ประเภทที่มีตัวเลือกแต่ยังไม่มี → ใส่ตัวเลือกตั้งต้นให้
  const changeKind = (f: FormField, kind: FieldKind) => {
    // ฟ้าใส: ข้อมูลของประเภทใหม่
    const k = formKind(kind);
    update(f.id, { kind, hint: k.th, options: k.hasOptions ? (f.options?.length ? f.options : defaultOptions(lang)) : f.options });
  };

  const sort = useDragSort(fields, setFields); // ฟ้าใส: ลากเรียงช่องในฟอร์ม


  return (
    <>
      {/* ฟ้าใส: ส่วนเวลาเปิด–ปิดรับลงทะเบียน */}
      <WizardSection
        title={tr("เปิดรับลงทะเบียน", "Registration window")}
        description={
          fields.length === 0
            ? tr("ฟอร์มไม่บังคับ · ไม่มีช่องในฟอร์ม = Event นี้ไม่รับลงทะเบียน (ข้ามขั้นนี้ได้)", "The form is optional · no fields = this event takes no registrations (you can skip this step)")
            : tr("ผู้เข้าร่วมลงทะเบียนผ่าน QR และลิงก์ได้เฉพาะช่วงนี้", "Attendees can register via the QR and link only during this time")
        }
      >
        {/* ฟ้าใส: ช่องเลือกเวลาเปิด–ปิดรับ (บังคับเมื่อมีช่องในฟอร์ม) */}
        <TimeWindowFields openKey="regOpen" closeKey="regClose" openLabel={tr("เปิดรับ", "Opens")} closeLabel={tr("ปิดรับ", "Closes")} required={fields.length > 0} />
      </WizardSection>

      {/* ฟ้าใส: ส่วนช่องในฟอร์ม */}
      <WizardSection
        title={tr("ช่องในฟอร์ม", "Form fields")}
        description={tr(`${fields.length} ช่อง · ลากที่ ⋮⋮ เพื่อเรียงลำดับ`, `${fields.length} fields · drag ⋮⋮ to reorder`)}
        action={
          <Button variant="outline" size="sm" onClick={() => setPreviewOpen(true)}>
            <Eye className="size-4" /> {tr("Preview ฟอร์ม", "Preview form")}
          </Button>
        }
      >
        {fields.length === 0 && (
          <p className="rounded-2xl border border-dashed py-12 text-center text-sm text-muted-foreground">
            {tr("ยังไม่มีช่องในฟอร์ม เลือกประเภทจากแถบด้านล่างเพื่อเริ่มสร้าง", "No fields yet. Pick a type from the bar below to start")}
          </p>
        )}

        {fields.map((f, i) => { // ฟ้าใส: การ์ดช่องในฟอร์ม: ชื่อช่อง + ตัวเลือก (ถ้ามี) + ประเภท/Required + ทำสำเนา + ลบ
          // ฟ้าใส: ข้อมูลของประเภทช่องนี้
          const k = formKind(f.kind);
          // ฟ้าใส: การ์ดนี้ถูกเลือกอยู่ไหม
          const isSel = selectedId === f.id;
          // ฟ้าใส: ตัวเลือกของช่อง
          const options = f.options ?? [];
          return (
            // ฟ้าใส: การ์ดของช่อง 1 ช่อง (ลากเรียงได้)
            <section
              key={f.id}
              {...sort.itemProps(i)}
              onClick={() => select(f.id)}
              onFocusCapture={() => select(f.id)}
              className={cn(
                "space-y-3 rounded-2xl border bg-background p-5 transition",
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
                    <k.icon className="size-3.5" />
                  </span>
                  {i + 1} · {k.en}{!en && k.en !== k.th && ` · ${k.th}`}
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="icon" aria-label={tr("ทำสำเนา", "Duplicate")} onClick={(e) => { e.stopPropagation(); duplicate(f.id); }}>
                    <Copy className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={tr("ลบช่องนี้", "Delete this field")}
                    className="bg-red-50 text-red-600 hover:bg-red-100"
                    onClick={(e) => { e.stopPropagation(); remove(f.id); }}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>

              <div className="flex items-baseline gap-1">
                <input
                  value={f.label}
                  onChange={(e) => update(f.id, { label: e.target.value })}
                  placeholder={tr(`พิมพ์ชื่อช่อง เช่น ${k.example}`, `Field name, e.g. ${k.exampleEn}`)}
                  aria-label={tr("ชื่อช่อง", "Field name")}
                  autoFocus={justAdded === f.id}
                  onFocus={(e) => justAdded === f.id && e.currentTarget.select()}
                  className="field-sizing-content min-w-[14ch] max-w-full bg-transparent text-lg font-bold outline-none placeholder:font-normal placeholder:text-muted-foreground/60"
                />
                {f.required && <span className="text-lg font-bold text-destructive">*</span>}
              </div>

              {k.hasOptions ? (
                // ฟ้าใส: ตัวเลือกแก้ในการ์ดได้เลย (แบบ Survey Builder)
                <div className="space-y-2">
                  {options.map((o, n) => (
                    <div key={n} className="group flex max-w-2xl items-center gap-3 rounded-lg border px-4 py-2.5">
                      {f.kind === "dropdown" ? (
                        <span className="w-4 text-center text-xs text-muted-foreground">{n + 1}</span>
                      ) : (
                        <span className={cn("size-4 shrink-0 border", f.kind === "radio" ? "rounded-full" : "rounded")} />
                      )}
                      <input
                        value={o}
                        placeholder={tr(`ตัวเลือก ${n + 1} เช่น รอบเช้า`, `Option ${n + 1}, e.g. Morning session`)}
                        onChange={(e) => update(f.id, { options: options.map((x, m) => (m === n ? e.target.value : x)) })}
                        aria-label={tr(`ตัวเลือก ${n + 1}`, `Option ${n + 1}`)}
                        className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
                      />
                      <button
                        type="button"
                        aria-label={tr("ลบตัวเลือก", "Remove option")}
                        disabled={options.length <= 2}
                        onClick={() => update(f.id, { options: options.filter((_, m) => m !== n) })}
                        className="text-muted-foreground opacity-0 transition hover:text-foreground focus:opacity-100 group-hover:opacity-100 disabled:hidden"
                      >
                        <X className="size-4" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => update(f.id, { options: [...options, tr(`ตัวเลือก ${options.length + 1}`, `Option ${options.length + 1}`)] })}
                    className="text-sm text-primary hover:underline"
                  >
                    + {tr("เพิ่มตัวเลือก", "Add option")}
                  </button>
                </div>
              ) : (
                <FieldSample f={f} className="max-w-md" />
              )}

              {/* ฟ้าใส: ประเภท + Required (เดิมอยู่แผงตั้งค่าด้านขวา) */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-3">
                <label className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">{tr("ประเภท", "Type")}</span>
                  <select
                    value={f.kind}
                    onChange={(e) => changeKind(f, e.target.value as FieldKind)}
                    className="h-8 rounded-lg border bg-background px-2 text-sm"
                  >
                    {FORM_KINDS.map((x) => (
                      <option key={x.value} value={x.value}>
                        {en ? x.en : x.th}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex items-center gap-2 text-sm">
                  Required <span className="text-xs text-muted-foreground">{tr("(ต้องกรอกก่อนส่ง)", "(must be filled in)")}</span>
                  <Switch checked={f.required} onCheckedChange={(v) => update(f.id, { required: v })} />
                </label>
              </div>
            </section>
          );
        })}

        {/* ฟ้าใส: ===== แถบเพิ่มช่อง: 12 ประเภท ===== */}
        <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-dashed p-4">
          <span className="mr-2 text-sm text-muted-foreground">{tr("เพิ่มช่อง", "Add field")}</span>
          {FORM_KINDS.map((k) => (
            <button
              key={k.value}
              type="button"
              title={tr(`${k.en} · เช่น ${k.example}`, `${k.en} · e.g. ${k.exampleEn}`)}
              onClick={() => add(k.value)}
              className="flex items-center gap-1.5 rounded-full bg-muted px-4 py-2 text-sm font-semibold transition hover:bg-foreground/15"
            >
              <Plus className="size-3.5" /> <k.icon className="size-4" /> {en ? k.en : k.th}
            </button>
          ))}
        </div>
      </WizardSection>

      {/* ฟ้าใส: ===== Preview ฟอร์ม (แบบ Google Form) ===== */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-h-[90vh] max-w-md overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{tr("Preview ฟอร์มลงทะเบียน", "Registration form preview")}</DialogTitle>
          </DialogHeader>
          {/* ฟ้าใส: ภาพจำลองฟอร์ม */}
          <FormPreview fields={fields} primary={draft.theme.primary} eventName={draft.general.nameTh} look={pageLook(draft.theme, "form")} />
        </DialogContent>
      </Dialog>
    </>
  );
}
