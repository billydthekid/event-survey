"use client";
// ขั้นที่ 3: ฟอร์มลงทะเบียน — หน้าเดียวเรียงลงมา: เวลาเปิด–ปิดรับลงทะเบียน → ช่องในฟอร์ม (แบบ Google Form)
// - การ์ดทีละช่อง: พิมพ์ชื่อช่อง · ตั้งตัวเลือก (Multiple Choice / Checkboxes / Dropdown) · ทำสำเนา · ลบ
// - ท้ายการ์ด: เปลี่ยนประเภท + Required (เดิมอยู่แผงขวา)
// - ลากที่ ⋮⋮ เพื่อเรียงลำดับ (lib/use-drag-sort.ts)
// - แถบ "เพิ่มช่อง" = 12 ประเภท (lib/form-types.ts) · กดแล้วได้ช่องพร้อมชื่อตัวอย่าง แก้ชื่อได้
// - ฟอร์มไม่บังคับ (ไม่มีช่อง = ไม่รับลงทะเบียน) · ถ้ามีช่องต้องกำหนดเวลาเปิด–ปิดรับก่อนกด "ถัดไป" (stepBlock)

import { useState } from "react";
import { Copy, Eye, GripVertical, Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FieldSample, FormPreview } from "@/components/event/form-preview";
import { pageLook } from "@/lib/theme-presets";
import { useWizardStore } from "@/lib/wizard-store";
import { useDragSort } from "@/lib/use-drag-sort";
import { DEFAULT_OPTIONS, FORM_KINDS, formKind } from "@/lib/form-types";
import { cn } from "@/lib/utils";
import { newId } from "@/lib/utils/id";
import type { FieldKind, FormField } from "@/types/event";
import { TimeWindowFields } from "./time-window-fields";
import { WizardSection } from "./wizard-section";

export function StepForm() {
  const fields = useWizardStore((s) => s.draft.form.fields);
  const draft = useWizardStore((s) => s.draft);
  const patch = useWizardStore((s) => s.patch);
  const setFields = (f: FormField[]) => patch("form", { fields: f });

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [justAdded, setJustAdded] = useState<string | null>(null); // ช่องที่เพิ่งเพิ่ม → โฟกัสชื่อให้พิมพ์ต่อได้เลย
  const [previewOpen, setPreviewOpen] = useState(false);

  const update = (id: string, v: Partial<FormField>) => setFields(fields.map((f) => (f.id === id ? { ...f, ...v } : f)));
  const select = (id: string) => setSelectedId(id);
  const add = (kind: FieldKind) => { // เพิ่มช่องใหม่: ประเภท + ชื่อตัวอย่าง + id ใหม่
    const k = formKind(kind);
    const id = newId("f");
    setFields([...fields, { id, label: k.example, kind, hint: k.th, required: false, options: k.hasOptions ? [...DEFAULT_OPTIONS] : undefined }]);
    setSelectedId(id);
    setJustAdded(id);
  };

  const duplicate = (id: string) => { // ทำสำเนาช่อง: copy + id ใหม่ + insert หลังช่องเดิม
    const i = fields.findIndex((f) => f.id === id);
    const nid = newId("f");
    const copy = { ...fields[i], id: nid, options: fields[i].options ? [...fields[i].options!] : undefined };
    setFields([...fields.slice(0, i + 1), copy, ...fields.slice(i + 1)]);
    setSelectedId(nid);
  };

  const remove = (id: string) => { // ลบช่อง: filter + เลือกช่องถัดไป (หรือ null ถ้าไม่มีเหลือ)
    const next = fields.filter((f) => f.id !== id);
    setFields(next);
    setSelectedId(next[0]?.id ?? null);
  };

  // เปลี่ยนประเภท: ประเภทที่มีตัวเลือกแต่ยังไม่มี → ใส่ตัวเลือกตั้งต้นให้
  const changeKind = (f: FormField, kind: FieldKind) => {
    const k = formKind(kind);
    update(f.id, { kind, hint: k.th, options: k.hasOptions ? (f.options?.length ? f.options : [...DEFAULT_OPTIONS]) : f.options });
  };

  const sort = useDragSort(fields, setFields); // ลากเรียงช่องในฟอร์ม


  return (
    <>
      <WizardSection
        title="เปิดรับลงทะเบียน"
        description={
          fields.length === 0
            ? "ฟอร์มไม่บังคับ · ไม่มีช่องในฟอร์ม = Event นี้ไม่รับลงทะเบียน (ข้ามขั้นนี้ได้)"
            : "ผู้เข้าร่วมลงทะเบียนผ่าน QR และลิงก์ได้เฉพาะช่วงนี้"
        }
      >
        <TimeWindowFields openKey="regOpen" closeKey="regClose" openLabel="เปิดรับ" closeLabel="ปิดรับ" required={fields.length > 0} />
      </WizardSection>

      <WizardSection
        title="ช่องในฟอร์ม"
        description={`${fields.length} ช่อง · ลากที่ ⋮⋮ เพื่อเรียงลำดับ`}
        action={
          <Button variant="outline" size="sm" onClick={() => setPreviewOpen(true)}>
            <Eye className="size-4" /> Preview ฟอร์ม
          </Button>
        }
      >
        {fields.length === 0 && (
          <p className="rounded-2xl border border-dashed py-12 text-center text-sm text-muted-foreground">
            ยังไม่มีช่องในฟอร์ม เลือกประเภทจากแถบด้านล่างเพื่อเริ่มสร้าง
          </p>
        )}

        {fields.map((f, i) => { // การ์ดช่องในฟอร์ม: ชื่อช่อง + ตัวเลือก (ถ้ามี) + ประเภท/Required + ทำสำเนา + ลบ
          const k = formKind(f.kind);
          const isSel = selectedId === f.id;
          const options = f.options ?? [];
          return (
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
                  {i + 1} · {k.en}{k.en !== k.th && ` · ${k.th}`}
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="icon" aria-label="ทำสำเนา" onClick={(e) => { e.stopPropagation(); duplicate(f.id); }}>
                    <Copy className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="ลบช่องนี้"
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
                  placeholder={`พิมพ์ชื่อช่อง เช่น ${k.example}`}
                  aria-label="ชื่อช่อง"
                  autoFocus={justAdded === f.id}
                  onFocus={(e) => justAdded === f.id && e.currentTarget.select()}
                  className="field-sizing-content min-w-[14ch] max-w-full bg-transparent text-lg font-bold outline-none placeholder:font-normal placeholder:text-muted-foreground/60"
                />
                {f.required && <span className="text-lg font-bold text-destructive">*</span>}
              </div>

              {k.hasOptions ? (
                // ตัวเลือกแก้ในการ์ดได้เลย (แบบ Survey Builder)
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
                        onChange={(e) => update(f.id, { options: options.map((x, m) => (m === n ? e.target.value : x)) })}
                        aria-label={`ตัวเลือก ${n + 1}`}
                        className="min-w-0 flex-1 bg-transparent text-sm outline-none"
                      />
                      <button
                        type="button"
                        aria-label="ลบตัวเลือก"
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
                    onClick={() => update(f.id, { options: [...options, `ตัวเลือก ${options.length + 1}`] })}
                    className="text-sm text-primary hover:underline"
                  >
                    + เพิ่มตัวเลือก
                  </button>
                </div>
              ) : (
                <FieldSample f={f} className="max-w-md" />
              )}

              {/* ประเภท + Required (เดิมอยู่แผงตั้งค่าด้านขวา) */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-3">
                <label className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">ประเภท</span>
                  <select
                    value={f.kind}
                    onChange={(e) => changeKind(f, e.target.value as FieldKind)}
                    className="h-8 rounded-lg border bg-background px-2 text-sm"
                  >
                    {FORM_KINDS.map((x) => (
                      <option key={x.value} value={x.value}>
                        {x.th}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex items-center gap-2 text-sm">
                  Required <span className="text-xs text-muted-foreground">(ต้องกรอกก่อนส่ง)</span>
                  <Switch checked={f.required} onCheckedChange={(v) => update(f.id, { required: v })} />
                </label>
              </div>
            </section>
          );
        })}

        {/* ===== แถบเพิ่มช่อง: 12 ประเภท ===== */}
        <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-dashed p-4">
          <span className="mr-2 text-sm text-muted-foreground">เพิ่มช่อง</span>
          {FORM_KINDS.map((k) => (
            <button
              key={k.value}
              type="button"
              title={`${k.en} · เช่น ${k.example}`}
              onClick={() => add(k.value)}
              className="flex items-center gap-1.5 rounded-full bg-muted px-4 py-2 text-sm font-semibold transition hover:bg-foreground/15"
            >
              <Plus className="size-3.5" /> <k.icon className="size-4" /> {k.th}
            </button>
          ))}
        </div>
      </WizardSection>

      {/* ===== Preview ฟอร์ม (แบบ Google Form) ===== */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-h-[90vh] max-w-md overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Preview ฟอร์มลงทะเบียน</DialogTitle>
          </DialogHeader>
          <FormPreview fields={fields} primary={draft.theme.primary} eventName={draft.general.nameTh} look={pageLook(draft.theme, "form")} />
        </DialogContent>
      </Dialog>
    </>
  );
}
