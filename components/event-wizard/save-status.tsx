"use client";
// ป้าย "บันทึกอัตโนมัติ" มุมขวาบนของ Wizard — เปลี่ยนทุกครั้งที่แก้ข้อมูลของ Event นี้
// - แก้อะไรก็ตาม → "กำลังบันทึก…" (หมุน) → "บันทึกแล้ว" + กระพริบสีเขียวสั้น ๆ
// - ยังไม่ได้แก้อะไรตั้งแต่เปิดหน้า → "บันทึกอัตโนมัติ"
// - ตรวจจาก wizard store โดยตรง (subscribe): ข้อมูลของ Event นี้เปลี่ยน = persist เขียนลง localStorage ไปแล้ว
//   (เขียนทันทีแบบ synchronous) · หน่วงขึ้น "บันทึกแล้ว" 600 ms ให้ผู้ใช้เห็นว่ามีการบันทึกเกิดขึ้นจริง

import { useEffect, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { useWizardStore } from "@/lib/wizard-store";
import { cn } from "@/lib/utils";
import { useTr } from "@/lib/wizard-lang";

type Status = { saving: boolean; savedAt: Date | null };

export function SaveStatus({ eventId, locked }: { eventId: string; locked: boolean }) {
  const tr = useTr();
  const [st, setSt] = useState<Status>({ saving: false, savedAt: null });

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    // เรียกเฉพาะตอน store เปลี่ยน (ไม่ใช่ตอน render) · เทียบ object ของ Event นี้ก่อน/หลัง
    const unsub = useWizardStore.subscribe((s, prev) => {
      if (s.drafts[eventId] === prev.drafts[eventId]) return; // แก้ Event อื่น / เปลี่ยนขั้น → ไม่นับ
      setSt((x) => ({ ...x, saving: true }));
      clearTimeout(timer);
      timer = setTimeout(() => setSt({ saving: false, savedAt: new Date() }), 600);
    });
    return () => {
      unsub();
      clearTimeout(timer);
    };
  }, [eventId]);

  if (locked) return <span className="text-xs text-muted-foreground">{tr("เผยแพร่แล้ว · ดูอย่างเดียว", "Published · view only")}</span>;

  if (st.saving) {
    return (
      <span className="flex items-center gap-1 text-xs text-muted-foreground" aria-live="polite">
        <Loader2 className="size-3.5 animate-spin" /> {tr("กำลังบันทึก…", "Saving…")}
      </span>
    );
  }

  return (
    <span
      key={st.savedAt?.getTime() ?? 0} // key ใหม่ทุกครั้งที่บันทึก → เล่นแอนิเมชันกระพริบซ้ำ
      aria-live="polite"
      className={cn(
        "flex items-center gap-1 rounded-full px-2 py-0.5 text-xs text-emerald-700",
        st.savedAt && "animate-[save-flash_1.2s_ease-out]"
      )}
    >
      <Check className="size-3.5" />
      {st.savedAt ? tr("บันทึกแล้ว", "Saved") : tr("บันทึกอัตโนมัติ", "Autosave on")}
      <style>{`@keyframes save-flash{0%{background:rgb(16 185 129 / .25)}100%{background:transparent}}`}</style>
    </span>
  );
}
