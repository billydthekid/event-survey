"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, GripVertical, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useWizardStore } from "@/lib/wizard-store";
import { BASIC_FIELDS } from "@/lib/mock/event-draft";
import { cn } from "@/lib/utils";
import { newId } from "@/lib/utils/id";
import type { FieldKind, FormField } from "@/types/event";

const KIND_LABEL: Record<FieldKind, string> = {
  text: "ข้อความสั้น",
  email: "อีเมล",
  number: "ตัวเลข",
  dropdown: "Dropdown",
  multiselect: "หลายตัวเลือก",
};

export function StepForm() {
  const fields = useWizardStore((s) => s.draft.form.fields);
  const patch = useWizardStore((s) => s.patch);
  const setFields = (f: FormField[]) => patch("form", { fields: f });

  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState("");
  const [kind, setKind] = useState<FieldKind>("text");

  const toggleBasic = (b: (typeof BASIC_FIELDS)[number]) => {
    const exists = fields.find((f) => f.basicKey === b.basicKey);
    if (exists) return setFields(fields.filter((f) => f.id !== exists.id));
    setFields([
      ...fields,
      { id: `f-${b.basicKey}`, label: b.label, kind: b.kind, hint: b.hint, required: false, basicKey: b.basicKey },
    ]);
  };

  // ลากเรียง (HTML5 drag & drop ไม่ต้องพึ่งไลบรารี)
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);
  const drop = (to: number) => {
    if (dragIdx === null || dragIdx === to) return;
    const next = [...fields];
    const [item] = next.splice(dragIdx, 1);
    next.splice(to, 0, item);
    setFields(next);
  };

  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= fields.length) return;
    const next = [...fields];
    [next[i], next[j]] = [next[j], next[i]];
    setFields(next);
  };

  const addCustom = () => {
    if (!label.trim()) return;
    setFields([
      ...fields,
      { id: newId("c"), label: label.trim(), kind, hint: `Custom · ${KIND_LABEL[kind]}`, required: false },
    ]);
    setLabel("");
    setKind("text");
    setOpen(false);
  };

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Card className="self-start">
        <CardHeader>
          <CardTitle className="text-sm">ช่องพื้นฐาน · แตะเพื่อเพิ่ม/เอาออก</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {BASIC_FIELDS.map((b) => {
              const on = fields.some((f) => f.basicKey === b.basicKey);
              return (
                <Button
                  key={b.basicKey}
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => toggleBasic(b)}
                  className={cn("rounded-full", on && "border-primary bg-primary/10 text-primary")}
                >
                  {!on && <Plus className="size-3" />} {b.label}
                </Button>
              );
            })}
          </div>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger render={<Button variant="outline" size="sm" className="text-primary" />}>
              <Plus className="size-4" /> เพิ่ม Custom field
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>เพิ่ม Custom field</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label>ชื่อช่อง</Label>
                  <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="เช่น คณะ / สาขา" />
                </div>
                <div className="space-y-1.5">
                  <Label>ประเภท</Label>
                  <ToggleGroup
                    value={[kind]}
                    onValueChange={(v) => v[0] && setKind(v[0] as FieldKind)}
                    variant="outline"
                    className="flex-wrap justify-start"
                  >
                    {Object.entries(KIND_LABEL).map(([k, v]) => (
                      <ToggleGroupItem key={k} value={k} className="rounded-full">{v}</ToggleGroupItem>
                    ))}
                  </ToggleGroup>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={addCustom}>เพิ่ม</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-sm">ช่องในฟอร์ม ({fields.length})</CardTitle>
          <span className="text-xs text-muted-foreground">ลากเพื่อเรียงลำดับ (หรือกดลูกศร)</span>
        </CardHeader>
        <CardContent className="space-y-2">
          {fields.map((f, i) => (
            <div
              key={f.id}
              draggable
              onDragStart={() => setDragIdx(i)}
              onDragOver={(e) => {
                e.preventDefault();
                setOverIdx(i);
              }}
              onDrop={() => {
                drop(i);
                setDragIdx(null);
                setOverIdx(null);
              }}
              onDragEnd={() => {
                setDragIdx(null);
                setOverIdx(null);
              }}
              className={cn(
                "flex items-center gap-2 rounded-lg border p-3 bg-background",
                dragIdx === i && "opacity-40",
                overIdx === i && dragIdx !== null && dragIdx !== i && "border-primary ring-1 ring-primary"
              )}
            >
              <GripVertical className="size-4 shrink-0 cursor-grab text-muted-foreground" aria-hidden />
              <div className="flex flex-col">
                <Button variant="ghost" size="icon" className="size-5" disabled={i === 0} onClick={() => move(i, -1)} aria-label="ขึ้น">
                  <ArrowUp className="size-3" />
                </Button>
                <Button variant="ghost" size="icon" className="size-5" disabled={i === fields.length - 1} onClick={() => move(i, 1)} aria-label="ลง">
                  <ArrowDown className="size-3" />
                </Button>
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold">{f.label}</p>
                <p className="text-xs text-muted-foreground">{f.hint}</p>
              </div>
              <span className="text-xs text-muted-foreground">Required</span>
              <Switch
                checked={f.required}
                onCheckedChange={(v) => setFields(fields.map((x) => (x.id === f.id ? { ...x, required: v } : x)))}
              />
            </div>
          ))}
          {fields.length === 0 && <p className="text-sm text-muted-foreground">ยังไม่มีช่องในฟอร์ม</p>}
        </CardContent>
      </Card>
    </div>
  );
}
