// app/admin/events/[id]/survey/surveyAccess.tsx
// ส่วนที่หน้า Survey (สรุป) กับ Survey Builder ใช้ร่วมกัน: ด่านสิทธิ์ + ข้อมูล Survey ของ Event + ข้อความล็อก
"use client";
import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useWizardStore } from "@/lib/wizard-store";
import { useHydrated } from "@/lib/use-hydrated";
import { formatThaiDate, isEventLocked } from "@/lib/utils/date";
import type { EventDraft } from "@/types/event";
import { useEventAccess } from "../eventAccess";

/** ด่านสิทธิ์เดียวกับ Report / Dashboard + ย้าย Event ที่ Super สร้างให้เข้า wizard store (เหมือนหน้า edit) */
export function useSurveyDraft(id: string) {
  const ready = useHydrated();
  const access = useEventAccess(id);
  const draft = useWizardStore((s) => s.drafts[id]);
  const ensureFromMainStore = useWizardStore((s) => s.ensureFromMainStore);

  const mainEvent = access.status === "ok" || access.status === "nodata" ? access.event : null;
  useEffect(() => {
    if (mainEvent) ensureFromMainStore(mainEvent);
  }, [mainEvent, ensureFromMainStore]);

  if (!ready || access.status === "loading") return { state: "loading" as const };
  if (access.status === "denied") return { state: "denied" as const };
  if (!draft) return { state: "loading" as const }; // รอ ensureFromMainStore ทำงานรอบถัดไป

  // ล็อกเมื่อ Event เริ่มแล้ว (เฉพาะที่เผยแพร่แล้ว)
  const locked = draft.status !== "draft" && isEventLocked(draft.general.date, draft.general.startTime);
  return { state: "ready" as const, draft, locked, access };
}

/** ข้อความในแบนเนอร์สีเหลืองบนหน้า Survey */
export function lockBannerText(d: EventDraft, locked: boolean) {
  if (locked) return "Event เริ่มแล้ว · Survey ถูกล็อก ดูผลและ Export ได้อย่างเดียว";
  if (d.general.date && d.general.startTime) {
    return `แก้ไขได้ถึง ${formatThaiDate(d.general.date, false)} ${d.general.startTime} · เมื่อ Event เริ่ม Survey จะถูกล็อกพร้อม Event`;
  }
  return "แก้ไขได้จนกว่า Event จะเริ่ม · เมื่อ Event เริ่ม Survey จะถูกล็อกพร้อม Event";
}

export function SurveyDenied() {
  return (
    <div className="mt-10 rounded-2xl bg-white p-8 text-center shadow-sm">
      <p className="font-semibold">ไม่พบ Event / ไม่มีสิทธิ์</p>
      <p className="mt-1 text-sm text-muted-foreground">Event นี้ไม่มีอยู่ ถูกลบไปแล้ว หรือไม่ได้มอบหมายให้คุณดูแล</p>
      <Button className="mt-4" variant="outline" nativeButton={false} render={<Link href="/admin/events" />}>
        กลับไป Event ของฉัน
      </Button>
    </div>
  );
}
