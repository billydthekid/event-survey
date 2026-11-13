"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useWizardStore } from "@/lib/wizard-store";
import { formatThaiDate } from "@/lib/utils/date";
import { useNow } from "@/lib/hooks/useNow";
import { nowParts, validateDates } from "@/lib/utils/wizard-rules";
import { FieldError } from "./field-error";
import { AllowListCard } from "./allow-list-card";
import { EVENT_TYPES } from "@/lib/event-types";
import type { EventType } from "@/types/event";

export function StepGeneral() {
  const g = useWizardStore((s) => s.draft.general);
  const draft = useWizardStore((s) => s.draft);
  const patch = useWizardStore((s) => s.patch);
  const now = useNow();
  const { today } = nowParts(now);
  const err = validateDates(draft, now);
  const [lang, setLang] = useState<"th" | "en">("th");
  const set = (v: Partial<typeof g>) => patch("general", v);

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      {/* ซ้าย */}
      <div className="space-y-5">
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">ชื่อและรายละเอียด</CardTitle>
            <ToggleGroup value={[lang]} onValueChange={(v) => v[0] && setLang(v[0] as "th" | "en")} variant="outline" size="sm">
              <ToggleGroupItem value="th">ไทย</ToggleGroupItem>
              <ToggleGroupItem value="en">English</ToggleGroupItem>
            </ToggleGroup>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>ชื่อ Event ({lang === "th" ? "ไทย" : "English"}) <span className="text-destructive">*</span></Label>
              <Input
                value={lang === "th" ? g.nameTh : g.nameEn}
                onChange={(e) => set(lang === "th" ? { nameTh: e.target.value } : { nameEn: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>รายละเอียด ({lang === "th" ? "ไทย" : "English"}) <span className="text-destructive">*</span></Label>
              <Textarea
                rows={3}
                value={lang === "th" ? g.descTh : g.descEn}
                onChange={(e) => set(lang === "th" ? { descTh: e.target.value } : { descEn: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>ประเภทงาน <span className="text-destructive">*</span></Label>
              <ToggleGroup value={[g.type]} onValueChange={(v) => v[0] && set({ type: v[0] as EventType })} variant="outline" className="flex-wrap justify-start">
                {EVENT_TYPES.map((t) => (
                  <ToggleGroupItem key={t.value} value={t.value} className="rounded-full">
                    {t.th}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
              {g.type === "other" && (
                <Input
                  placeholder="ระบุประเภทงาน เช่น งานบวช, ทัศนศึกษา"
                  value={g.typeOther ?? ""}
                  onChange={(e) => set({ typeOther: e.target.value })}
                  aria-label="ประเภทงานอื่นๆ"
                />
              )}
            </div>
          </CardContent>
        </Card>

        {/* เปิด / ปิด Event (แทนจำนวนรับสูงสุดเดิมในขั้นที่ 5) */}
        <AllowListCard />

        <Card>
          <CardHeader>
            <CardTitle className="text-base">ผู้จัดและช่องทางติดต่อ</CardTitle>
            <CardDescription>ให้ผู้เข้าร่วมรู้ว่าใครจัด และติดต่อใครถ้ามีคำถาม</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>ชื่อผู้จัด / หน่วยงาน <span className="text-destructive">*</span></Label>
              <Input value={g.organizer} onChange={(e) => set({ organizer: e.target.value })} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>เบอร์โทร <span className="text-xs text-muted-foreground">(ไม่บังคับ)</span></Label>
                <Input placeholder="0X XXX XXXX" value={g.phone} onChange={(e) => set({ phone: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>อีเมล <span className="text-xs text-muted-foreground">(ไม่บังคับ)</span></Label>
                <Input type="email" value={g.email} onChange={(e) => set({ email: e.target.value })} />
              </div>
            </div>
            <div className="flex items-center justify-between border-t pt-4">
              <Label htmlFor="show-contact">แสดงช่องทางติดต่อบนหน้า Event</Label>
              <Switch id="show-contact" checked={g.showContact} onCheckedChange={(v) => set({ showContact: v })} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ขวา */}
      <div className="space-y-5">
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">วัน เวลา และสถานที่</CardTitle>
            <ToggleGroup value={[g.mode]} onValueChange={(v) => v[0] && set({ mode: v[0] as "onsite" | "online" })} variant="outline" size="sm">
              <ToggleGroupItem value="onsite">สถานที่จริง</ToggleGroupItem>
              <ToggleGroupItem value="online">Online</ToggleGroupItem>
            </ToggleGroup>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label>วันที่จัด <span className="text-destructive">*</span></Label>
                <Input
                  type="date"
                  min={today}
                  value={g.date}
                  aria-invalid={!!err.date}
                  onChange={(e) => set({ date: e.target.value })}
                />
                {err.date ? <FieldError text={err.date} /> : <p className="text-xs text-muted-foreground">{formatThaiDate(g.date)}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>เวลาเริ่ม <span className="text-destructive">*</span></Label>
                <Input
                  type="time"
                  value={g.startTime}
                  aria-invalid={!!err.startTime}
                  onChange={(e) => set({ startTime: e.target.value })}
                />
                <FieldError text={err.startTime} />
              </div>
              <div className="space-y-1.5">
                <Label>เวลาสิ้นสุด <span className="text-destructive">*</span></Label>
                <Input
                  type="time"
                  min={g.startTime || undefined}
                  value={g.endTime}
                  aria-invalid={!!err.endTime}
                  onChange={(e) => set({ endTime: e.target.value })}
                />
                <FieldError text={err.endTime} />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
              <div className="space-y-1.5">
                <Label>{g.mode === "onsite" ? "สถานที่" : "ลิงก์เข้าร่วม"} <span className="text-destructive">*</span></Label>
                <Input value={g.venue} onChange={(e) => set({ venue: e.target.value })} />
              </div>
              {g.mode === "onsite" && (
                <div className="space-y-1.5">
                  <Label>จุดนัดพบ</Label>
                  <Input value={g.spot} onChange={(e) => set({ spot: e.target.value })} />
                </div>
              )}
            </div>
            {g.mode === "onsite" && (
              <div className="space-y-1.5">
                <Label>ลิงก์แผนที่ <span className="text-xs text-muted-foreground">(ไม่บังคับ)</span></Label>
                <Input placeholder="วางลิงก์ Google Maps" value={g.mapUrl} onChange={(e) => set({ mapUrl: e.target.value })} />
              </div>
            )}
          </CardContent>
        </Card>
        {/* รูปปก Event ย้ายไปขั้นที่ 2 Branding (แท็บ "รูปปก") */}
      </div>
    </div>
  );
}
