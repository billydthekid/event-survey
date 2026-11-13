"use client";
// ขั้นที่ 4: ฟอร์มลงทะเบียน — แบบ Google Form / Survey Builder
// - การ์ดทีละช่อง: พิมพ์ชื่อช่องในการ์ด · ตั้งตัวเลือก (Multiple Choice / Checkboxes / Dropdown) · ทำสำเนา · ลบ
// - ลากที่ ⋮⋮ เพื่อเรียงลำดับ (lib/use-drag-sort.ts)
// - แถบ "เพิ่มช่อง" = 12 ประเภท (lib/form-types.ts) · กดแล้วได้ช่องพร้อมชื่อตัวอย่าง แก้ชื่อได้
// - แผงขวา: Required + เปลี่ยนประเภท · ปุ่ม "Preview ฟอร์ม" เปิดหน้าตาแบบที่ผู้เข้าร่วมเห็น

import { useState } from "react";
import { Copy, Eye, GripVertical, Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FieldSample, FormPreview } from "@/components/event/form-preview";
import { useWizardStore } from "@/lib/wizard-store";
import { useDragSort } from "@/lib/use-drag-sort";
import { DEFAULT_OPTIONS, FORM_KINDS, formKind } from "@/lib/form-types";
import { cn } from "@/lib/utils";
import { newId } from "@/lib/utils/id";
import type { FieldKind, FormField } from "@/types/event";

export function StepForm() {
  const fields = useWizardStore((s) => s.draft.form.fields);
  const draft = useWizardStore((s) => s.draft);
  const patch = useWizardStore((s) => s.patch);
  const setFields = (f: FormField[]) => patch("form", { fields: f });

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [justAdded, setJustAdded] = useState<string | null>(null); // ช่องที่เพิ่งเพิ่ม → โฟกัสชื่อให้พิมพ์ต่อได้เลย
  const [previewOpen, setPreviewOpen] = useState(false);
  const selected = fields.find((f) => f.id === (selectedId ?? fields[0]?.id)) ?? null;
  const selectedIndex = selected ? fields.findIndex((f) => f.id === selected.id) : -1;

  const update = (id: string, v: Partial<FormField>) => setFields(fields.map((f) => (f.id === id ? { ...f, ...v } : f)));
  const select = (id: string) => setSelectedId(id);

  const add = (kind: FieldKind) => {
    const k = formKind(kind);
    const id = newId("f");
    setFields([...fields, { id, label: k.example, kind, hint: k.th, required: false, options: k.hasOptions ? [...DEFAULT_OPTIONS] : undefined }]);
    setSelectedId(id);
    setJustAdded(id);
  };

  const duplicate = (id: string) => {
    const i = fields.findIndex((f) => f.id === id);
    const nid = newId("f");
    const copy = { ...fields[i], id: nid, options: fields[i].options ? [...fields[i].options!] : undefined };
    setFields([...fields.slice(0, i + 1), copy, ...fields.slice(i + 1)]);
    setSelectedId(nid);
  };

  const remove = (id: string) => {
    const next = fields.filter((f) => f.id !== id);
    setFields(next);
    setSelectedId(next[0]?.id ?? null);
  };

  // เปลี่ยนประเภท: ประเภทที่มีตัวเลือกแต่ยังไม่มี → ใส่ตัวเลือกตั้งต้นให้
  const changeKind = (f: FormField, kind: FieldKind) => {
    const k = formKind(kind);
    update(f.id, { kind, hint: k.th, options: k.hasOptions ? (f.options?.length ? f.options : [...DEFAULT_OPTIONS]) : f.options });
  };

  const sort = useDragSort(fields, setFields);

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
      {/* ===== การ์ดช่องในฟอร์ม ===== */}
      <div className="min-w-0 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{fields.length} ช่อง · ลากที่ ⋮⋮ เพื่อเรียงลำดับ</p>
          <Button variant="outline" size="sm" onClick={() => setPreviewOpen(true)}>
            <Eye className="size-4" /> Preview ฟอร์ม
          </Button>
        </div>

        {fields.length === 0 && (
          <p className="rounded-2xl border border-dashed bg-background py-12 text-center text-sm text-muted-foreground">
            ยังไม่มีช่องในฟอร์ม เลือกประเภทจากแถบด้านล่างเพื่อเริ่มสร้าง
          </p>
        )}

        {fields.map((f, i) => {
          const k = formKind(f.kind);
          const isSel = selected?.id === f.id;
          const options = f.options ?? [];
          return (
            <section
              key={f.id}
              {...sort.itemProps(i)}
              onClick={() => select(f.id)}
              onFocusCapture={() => select(f.id)}
              className={cn(
                "space-y-3 rounded-2xl border bg-background p-5 transition",
                isSel && "border-2 border-primary",
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
            </section>
          );
        })}

        {/* ===== แถบเพิ่มช่อง: 12 ประเภท ===== */}
        <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-dashed bg-background/60 p-4">
          <span className="mr-2 text-sm text-muted-foreground">เพิ่มช่อง</span>
          {FORM_KINDS.map((k) => (
            <button
              key={k.value}
              type="button"
              title={`${k.en} · เช่น ${k.example}`}
              onClick={() => add(k.value)}
              className="flex items-center gap-1.5 rounded-full bg-muted px-4 py-2 text-sm font-semibold hover:bg-muted/70"
            >
              <Plus className="size-3.5" /> <k.icon className="size-4" /> {k.th}
            </button>
          ))}
        </div>
      </div>

      {/* ===== แผงตั้งค่า ===== */}
      <aside className="h-fit space-y-6 rounded-2xl border bg-background p-6 lg:sticky lg:top-0">
        {selected ? (
          <>
            <div>
              <p className="text-xs text-primary">ช่องที่ {selectedIndex + 1}</p>
              <h2 className="text-xl font-bold">ตั้งค่า</h2>
            </div>

            <div className="flex items-center justify-between border-b pb-5">
              <div>
                <p className="text-sm font-semibold">Required</p>
                <p className="text-xs text-muted-foreground">ต้องกรอกก่อนส่ง</p>
              </div>
              <Switch checked={selected.required} onCheckedChange={(v) => update(selected.id, { required: v })} />
            </div>

            <div className="space-y-2">
              <p className="text-sm font-semibold">ประเภทคำตอบ</p>
              <div className="grid grid-cols-2 gap-2">
                {FORM_KINDS.map((k) => (
                  <button
                    key={k.value}
                    type="button"
                    aria-pressed={selected.kind === k.value}
                    onClick={() => changeKind(selected, k.value)}
                    className={cn(
                      "flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm",
                      selected.kind === k.value && "border-primary bg-primary/5 font-semibold text-primary"
                    )}
                  >
                    <k.icon className="size-4 shrink-0" /> {k.th}
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                {formKind(selected.kind).en} · ตัวอย่าง: {formKind(selected.kind).example}
              </p>
            </div>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">เลือกช่องเพื่อตั้งค่า</p>
        )}
      </aside>

      {/* ===== Preview ฟอร์ม (แบบ Google Form) ===== */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-h-[90vh] max-w-md overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Preview ฟอร์มลงทะเบียน</DialogTitle>
          </DialogHeader>
          <FormPreview fields={fields} primary={draft.theme.primary} eventName={draft.general.nameTh} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
