"use client";

import Link from "next/link";
import { Check, ChevronRight, Lock, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatThaiDate } from "@/lib/utils/date";

export const STEPS = [
  { n: 1, label: "ข้อมูลทั่วไป" },
  { n: 2, label: "Theme" },
  { n: 3, label: "โฆษณา" },
  { n: 4, label: "ฟอร์มลงทะเบียน" },
  { n: 5, label: "ช่วงเวลา" },
  { n: 6, label: "Survey" },
  { n: 7, label: "Preview" },
] as const;

interface Props {
  eventName: string;
  assignedBy: string;
  status: string;
  step: number;
  onStep: (n: number) => void;
  title: string;
  subtitle: string;
  lockDate: string;
  lockTime: string;
  locked: boolean;
  onPublish: () => void;
  children: React.ReactNode;
}

export function WizardShell(p: Props) {
  const isFirst = p.step === 1;
  const isLast = p.step === 7;
  const next = STEPS[p.step]; // step ถัดไป (index = step)

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-gradient-to-b from-[#E9E8F6] to-[#F6F6FB]">
      {/* Top bar */}
      <header className="flex items-center justify-between border-b bg-background px-6 py-3">
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="icon"
            aria-label="ปิด"
            nativeButton={false}
            render={<Link href="/admin/events" />}
          >
            <X className="size-4" />
          </Button>
          <div className="leading-tight">
            <p className="text-xs text-muted-foreground">
              แก้ไข Event · {p.status} · มอบหมายโดย {p.assignedBy}
            </p>
            <p className="font-semibold">{p.eventName}</p>
          </div>
        </div>
        <span className="flex items-center gap-1 text-xs text-emerald-700">
          <Check className="size-3.5" /> บันทึกอัตโนมัติแล้ว
        </span>
      </header>

      {/* Body */}
      <main className="flex-1 overflow-y-auto px-6 py-5">
        <div className="mx-auto max-w-6xl space-y-5">
          {/* Stepper */}
          <nav className="flex items-center gap-2 overflow-x-auto rounded-2xl border bg-background p-3">
            {STEPS.map((s, i) => {
              const done = s.n < p.step;
              const active = s.n === p.step;
              return (
                <div key={s.n} className="flex flex-1 items-center gap-2 last:flex-none">
                  <button
                    type="button"
                    onClick={() => p.onStep(s.n)}
                    className={cn(
                      "flex shrink-0 items-center gap-2 rounded-full px-3 py-1.5 text-sm",
                      active ? "bg-primary/10 font-semibold text-foreground" : "text-muted-foreground"
                    )}
                  >
                    <span
                      className={cn(
                        "flex size-5 items-center justify-center rounded-full text-[11px]",
                        active ? "bg-primary text-primary-foreground" : done ? "bg-primary/15 text-primary" : "bg-muted"
                      )}
                    >
                      {done ? <Check className="size-3" /> : s.n}
                    </span>
                    {s.label}
                  </button>
                  {i < STEPS.length - 1 && (
                    <div className="flex flex-1 items-center">
                      <div className="h-px flex-1 bg-border" />
                      <ChevronRight className="size-3.5 text-muted-foreground" />
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          {/* Title */}
          <div>
            <p className="text-xs text-muted-foreground">แก้ไข Event › ขั้นที่ {p.step} จาก 7</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight">{p.title}</h1>
            <p className="text-sm text-muted-foreground">{p.subtitle}</p>
          </div>

          {/* Lock banner */}
          <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-900">
            <Lock className="size-4 shrink-0" />
            <span>
              {p.locked
                ? "Event เริ่มแล้ว · ทุกขั้นตอนถูกล็อก · การเปลี่ยนผู้ดูแลหรือลบ Event ต้องผ่าน Super Admin"
                : `แก้ไขได้ถึง ${formatThaiDate(p.lockDate, false)} ${p.lockTime} · เมื่อ Event เริ่ม ทุกขั้นตอนจะถูกล็อก · การเปลี่ยนผู้ดูแลหรือลบ Event ต้องผ่าน Super Admin`}
            </span>
          </div>

          {/* ล็อกด้วย fieldset: input/button ข้างในจะ disabled ทั้งหมด */}
          <fieldset disabled={p.locked} className="min-w-0 space-y-5 disabled:opacity-70">
            {p.children}
          </fieldset>
        </div>
      </main>

      {/* Footer */}
      <footer className="flex items-center justify-between border-t bg-background px-6 py-3">
        {isFirst ? (
          <Button variant="secondary" nativeButton={false} render={<Link href="/admin/events" />}>
            ยกเลิก
          </Button>
        ) : (
          <Button variant="secondary" onClick={() => p.onStep(p.step - 1)}>
            ย้อนกลับ
          </Button>
        )}
        {isLast ? (
          <Button onClick={p.onPublish} disabled={p.locked}>
            เผยแพร่ Event
          </Button>
        ) : (
          <Button onClick={() => p.onStep(p.step + 1)}>ถัดไป: {next?.label}</Button>
        )}
      </footer>
    </div>
  );
}
