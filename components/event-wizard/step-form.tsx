"use client";
// ขั้นที่ 4: ฟอร์มลงทะเบียน — หน้าตาแบบเดียวกับ Survey Builder
// - ซ้าย: การ์ดทีละช่อง (ลากเรียงได้ · คลิกเพื่อเลือก · พิมพ์ชื่อช่อง Custom ในการ์ดได้เลย · ลบได้)
// - ล่าง: แถบ "เพิ่มช่อง" = ช่องพื้นฐาน (แตะเพื่อเพิ่ม/เอาออก) + Custom field ทุกประเภทพร้อมไอคอน
// - ขวา: แผงตั้งค่าของช่องที่เลือก (Required, ประเภท) · ลบที่ถังขยะบนการ์ด
//
// การลากเรียง (กดที่ ⋮⋮) ใช้ lib/use-drag-sort.ts — HTML5 drag & drop ของเบราว์เซอร์ (ไม่มีไลบรารี):
//   ระหว่างลาก เปลี่ยนแค่ "สไตล์" (จาง / กรอบสี) ไม่ได้ย้ายข้อมูล → ไม่กระตุก
//   ย้ายลำดับใน store ครั้งเดียวตอนปล่อย (onDrop)

import { useState } from "react";
import {
  ChevronDown, Fingerprint, GripVertical, Hash, ListChecks, Mail, Phone, Plus, Trash2, Type, User, Users,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useWizardStore } from "@/lib/wizard-store";
import { BASIC_FIELDS } from "@/lib/mock/event-draft";
import { useDragSort } from "@/lib/use-drag-sort";
import { cn } from "@/lib/utils";
import { newId } from "@/lib/utils/id";
import type { BasicFieldKey, FieldKind, FormField } from "@/types/event";

const KINDS: { value: FieldKind; th: string; icon: LucideIcon }[] = [
  { value: "text", th: "ข้อความสั้น", icon: Type },
  { value: "email", th: "อีเมล", icon: Mail },
  { value: "number", th: "ตัวเลข", icon: Hash },
  { value: "dropdown", th: "Dropdown", icon: ChevronDown },
  { value: "multiselect", th: "หลายตัวเลือก", icon: ListChecks },
];
const kindOf = (k: FieldKind) => KINDS.find((x) => x.value === k)!;

// ช่องพื้นฐานใช้ไอคอนเฉพาะ (ชื่อ / เบอร์ / เพศ ...) · Custom ใช้ไอคอนตามประเภท
const BASIC_ICON: Record<BasicFieldKey, LucideIcon> = {
  name: User, email: Mail, age: Hash, gender: Users, phone: Phone, idno: Fingerprint,
};
const iconOf = (f: FormField) => (f.basicKey ? BASIC_ICON[f.basicKey] : kindOf(f.kind).icon);

export function StepForm() {
  const fields = useWizardStore((s) => s.draft.form.fields);
  const patch = useWizardStore((s) => s.patch);
  const setFields = (f: FormField[]) => patch("form", { fields: f });

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = fields.find((f) => f.id === (selectedId ?? fields[0]?.id)) ?? null;
  const selectedIndex = selected ? fields.findIndex((f) => f.id === selected.id) : -1;

  const update = (id: string, v: Partial<FormField>) => setFields(fields.map((f) => (f.id === id ? { ...f, ...v } : f)));

  const remove = (id: string) => {
    const next = fields.filter((f) => f.id !== id);
    setFields(next);
    setSelectedId(next[0]?.id ?? null);
  };

  const toggleBasic = (b: (typeof BASIC_FIELDS)[number]) => {
    const exists = fields.find((f) => f.basicKey === b.basicKey);
    if (exists) return remove(exists.id);
    const id = `f-${b.basicKey}`;
    setFields([...fields, { id, label: b.label, kind: b.kind, hint: b.hint, required: false, basicKey: b.basicKey }]);
    setSelectedId(id);
  };

  const addCustom = (kind: FieldKind) => {
    const id = newId("c");
    setFields([...fields, { id, label: "", kind, hint: `Custom · ${kindOf(kind).th}`, required: false }]);
    setSelectedId(id);
  };

  // ---- ลากเรียง (กดที่ ⋮⋮ แล้วลาก) ----
  const sort = useDragSort(fields, setFields);

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
      {/* ===== การ์ดช่องในฟอร์ม ===== */}
      <div className="min-w-0 space-y-4">
        {fields.length === 0 && (
          <p className="rounded-2xl border border-dashed bg-background py-12 text-center text-sm text-muted-foreground">
            ยังไม่มีช่องในฟอร์ม เลือกจากแถบด้านล่างเพื่อเริ่มสร้าง
          </p>
        )}

        {fields.map((f, i) => {
          const Icon = iconOf(f);
          const isSel = selected?.id === f.id;
          return (
            <section
              key={f.id}
              {...sort.itemProps(i)}
              onClick={() => setSelectedId(f.id)}
              onFocusCapture={() => setSelectedId(f.id)}
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
                    <Icon className="size-3.5" />
                  </span>
                  {i + 1} · {f.basicKey ? "ช่องพื้นฐาน" : `Custom · ${kindOf(f.kind).th}`}
                </p>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="ลบช่องนี้"
                  className="bg-red-50 text-red-600 hover:bg-red-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    remove(f.id);
                  }}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>

              <div className="flex items-baseline gap-1">
                {f.basicKey ? (
                  <p className="text-lg font-bold">{f.label}</p>
                ) : (
                  <input
                    value={f.label}
                    onChange={(e) => update(f.id, { label: e.target.value })}
                    placeholder="พิมพ์ชื่อช่อง เช่น คณะ / สาขา"
                    aria-label="ชื่อช่อง"
                    autoFocus={isSel && !f.label} // เพิ่ง add → พิมพ์ชื่อได้ทันที
                    className="field-sizing-content min-w-[14ch] max-w-full bg-transparent text-lg font-bold outline-none placeholder:font-normal placeholder:text-muted-foreground/60"
                  />
                )}
                {f.required && <span className="text-lg font-bold text-destructive">*</span>}
              </div>

              <FieldSample kind={f.kind} />
            </section>
          );
        })}

        {/* ===== แถบเพิ่มช่อง ===== */}
        <div className="space-y-3 rounded-2xl border border-dashed bg-background/60 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-2 w-24 text-sm text-muted-foreground">ช่องพื้นฐาน</span>
            {BASIC_FIELDS.map((b) => {
              const on = fields.some((f) => f.basicKey === b.basicKey);
              const Icon = BASIC_ICON[b.basicKey];
              return (
                <button
                  key={b.basicKey}
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggleBasic(b)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold",
                    on ? "bg-primary/10 text-primary" : "bg-muted hover:bg-muted/70"
                  )}
                >
                  <Icon className="size-4" /> {b.label}
                </button>
              );
            })}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-2 w-24 text-sm text-muted-foreground">Custom field</span>
            {KINDS.map((k) => (
              <button
                key={k.value}
                type="button"
                onClick={() => addCustom(k.value)}
                className="flex items-center gap-1.5 rounded-full bg-muted px-4 py-2 text-sm font-semibold hover:bg-muted/70"
              >
                <Plus className="size-3.5" /> <k.icon className="size-4" /> {k.th}
              </button>
            ))}
          </div>
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

            <div className="space-y-2 border-b pb-5">
              <p className="text-sm font-semibold">ประเภทคำตอบ</p>
              {selected.basicKey ? (
                <p className="text-sm text-muted-foreground">ช่องพื้นฐาน · {selected.hint} (เปลี่ยนประเภทไม่ได้)</p>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {KINDS.map((k) => (
                    <button
                      key={k.value}
                      type="button"
                      onClick={() => update(selected.id, { kind: k.value, hint: `Custom · ${k.th}` })}
                      className={cn(
                        "flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm",
                        selected.kind === k.value && "border-primary bg-primary/5 font-semibold text-primary"
                      )}
                    >
                      <k.icon className="size-4" /> {k.th}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* เรียงลำดับ = ลากที่ ⋮⋮ บนการ์ด · ลบ = ปุ่มถังขยะบนการ์ด (ไม่มีปุ่มซ้ำในแผงนี้) */}
            <p className="text-xs text-muted-foreground">ลากที่ ⋮⋮ บนการ์ดเพื่อเรียงลำดับ · กดถังขยะบนการ์ดเพื่อลบ</p>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">เลือกช่องเพื่อตั้งค่า</p>
        )}
      </aside>
    </div>
  );
}

// ตัวอย่างช่องกรอกตามประเภท (แบบที่ผู้เข้าร่วมเห็น)
function FieldSample({ kind }: { kind: FieldKind }) {
  const box = "max-w-md rounded-lg border px-4 py-2.5 text-sm text-muted-foreground";
  if (kind === "dropdown")
    return (
      <div className={cn(box, "flex items-center justify-between")}>
        เลือกคำตอบ <ChevronDown className="size-4" />
      </div>
    );
  if (kind === "multiselect")
    return (
      <div className="space-y-1.5 text-sm text-muted-foreground">
        {["ตัวเลือก 1", "ตัวเลือก 2"].map((o) => (
          <div key={o} className="flex items-center gap-2">
            <span className="size-4 rounded border" /> {o}
          </div>
        ))}
      </div>
    );
  return (
    <div className={box}>
      {kind === "email" ? "name@email.com" : kind === "number" ? "ตัวเลข" : "ผู้กรอกพิมพ์คำตอบที่นี่…"}
    </div>
  );
}
