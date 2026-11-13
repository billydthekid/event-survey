"use client";

import { Crop, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useWizardStore } from "@/lib/wizard-store";
import { FileDrop } from "./file-drop";

export function StepAds() {
  const ad = useWizardStore((s) => s.draft.ad);
  const patch = useWizardStore((s) => s.patch);

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Card>
        <CardContent className="pt-6">
          <FileDrop
            title="ลากรูปมาวาง หรือเลือกไฟล์"
            hint="JPG/PNG · 1 รูปต่อ Event · ระบบจะ crop ตามสัดส่วนช่องโฆษณาบน Kiosk"
            onPick={(a) => patch("ad", a)}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">รูปโฆษณา ({ad ? 1 : 0} รูป)</CardTitle>
        </CardHeader>
        <CardContent>
          {ad ? (
            <div className="flex items-center gap-3 rounded-lg border p-3">
              <div className="size-10 rounded bg-primary/10" />
              <div className="flex-1 text-sm">
                <p className="font-semibold">{ad.name}</p>
                <p className={ad.cropped ? "text-xs text-emerald-700" : "text-xs text-amber-700"}>
                  {ad.cropped ? "Crop แล้ว" : "ยังไม่ได้ Crop"}
                </p>
              </div>
              {/* TODO: เปิด crop dialog จริง (เช่น react-easy-crop) — ตอนนี้แค่สลับสถานะ */}
              <Button variant="secondary" size="sm" onClick={() => patch("ad", { ...ad, cropped: true })}>
                <Crop className="size-4" /> Crop
              </Button>
              <Button variant="ghost" size="icon" className="text-destructive" onClick={() => patch("ad", null)}>
                <Trash2 className="size-4" />
              </Button>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">ยังไม่มีโฆษณา · ข้ามขั้นนี้ได้</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
