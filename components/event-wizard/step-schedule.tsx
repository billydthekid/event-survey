"use client";
// ขั้นที่ 5: ช่วงเปิด–ปิดรับลงทะเบียน และช่วงเปิดให้ตอบ Survey
// (ตัดจำนวนรับสูงสุด / ไทม์ไลน์ / ส่งข้อความเตือน ออกแล้ว · เปิด-ปิด Event ย้ายไปขั้นที่ 1)

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useWizardStore } from "@/lib/wizard-store";
import { useNow } from "@/lib/hooks/useNow";
import { nowParts, validateDates } from "@/lib/utils/wizard-rules";
import { FieldError } from "./field-error";

export function StepSchedule() {
  const draft = useWizardStore((s) => s.draft);
  const sc = draft.schedule;
  const patch = useWizardStore((s) => s.patch);
  const set = (v: Partial<typeof sc>) => patch("schedule", v);
  const now = useNow();
  const { nowLocal } = nowParts(now);
  const err = validateDates(draft, now);

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Card className="self-start">
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">เปิดรับลงทะเบียน</CardTitle>
          <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">ผ่าน QR และลิงก์</Badge>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>เปิดรับ</Label>
              <Input type="datetime-local" min={nowLocal} value={sc.regOpen} onChange={(e) => set({ regOpen: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>ปิดรับ</Label>
              <Input
                type="datetime-local"
                min={sc.regOpen || nowLocal}
                value={sc.regClose}
                aria-invalid={!!err.regClose}
                onChange={(e) => set({ regClose: e.target.value })}
              />
              <FieldError text={err.regClose} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="self-start">
        <CardHeader>
          <CardTitle className="text-base">เปิดตอบ Survey</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>เปิดให้ตอบ</Label>
              <Input type="datetime-local" min={nowLocal} value={sc.surveyOpen} onChange={(e) => set({ surveyOpen: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>ปิดรับคำตอบ</Label>
              <Input
                type="datetime-local"
                min={sc.surveyOpen || nowLocal}
                value={sc.surveyClose}
                aria-invalid={!!err.surveyClose}
                onChange={(e) => set({ surveyClose: e.target.value })}
              />
              <FieldError text={err.surveyClose} />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
