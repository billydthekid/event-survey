"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useWizardStore } from "@/lib/wizard-store";
import { formatThaiDate } from "@/lib/utils/date";

export function StepSchedule() {
  const sc = useWizardStore((s) => s.draft.schedule);
  const eventDate = useWizardStore((s) => s.draft.general.date);
  const patch = useWizardStore((s) => s.patch);
  const set = (v: Partial<typeof sc>) => patch("schedule", v);

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Card className="self-start">
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">เปิดรับลงทะเบียน</CardTitle>
          <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">ผ่าน QR และลิงก์</Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>เปิดรับ</Label>
              <Input type="datetime-local" value={sc.regOpen} onChange={(e) => set({ regOpen: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>ปิดรับ</Label>
              <Input type="datetime-local" value={sc.regClose} onChange={(e) => set({ regClose: e.target.value })} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>จำนวนรับสูงสุด <span className="text-xs text-muted-foreground">(ไม่บังคับ)</span></Label>
            <Input
              type="number"
              min={0}
              placeholder="ไม่จำกัด"
              value={sc.maxAttendees}
              onChange={(e) => set({ maxAttendees: e.target.value })}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">เปิดตอบ Survey</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>เปิดให้ตอบ</Label>
              <Input type="datetime-local" value={sc.surveyOpen} onChange={(e) => set({ surveyOpen: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>ปิดรับคำตอบ</Label>
              <Input type="datetime-local" value={sc.surveyClose} onChange={(e) => set({ surveyClose: e.target.value })} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>ไทม์ไลน์</Label>
            <div className="relative h-2 rounded-full bg-muted">
              <div className="absolute inset-y-0 left-0 w-[60%] rounded-full bg-primary/30" />
              <div className="absolute inset-y-0 left-[60%] w-[15%] rounded-full bg-primary" />
              <div className="absolute -bottom-2 left-[55%] right-0 h-1 rounded-full bg-amber-300" />
            </div>
            <div className="flex justify-between pt-2 text-xs text-muted-foreground">
              <span>{formatThaiDate(sc.regOpen.slice(0, 10), false)} เปิดลงทะเบียน</span>
              <span>วันงาน {formatThaiDate(eventDate, false)}</span>
              <span>Survey ปิด {formatThaiDate(sc.surveyClose.slice(0, 10), false)}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox id="remind" checked={sc.remindAfterEnd} onCheckedChange={(v) => set({ remindAfterEnd: v === true })} />
            <Label htmlFor="remind" className="font-normal">ส่งข้อความเตือนให้ตอบ Survey หลังจบงาน 1 ชั่วโมง</Label>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
