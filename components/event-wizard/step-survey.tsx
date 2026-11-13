"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useWizardStore } from "@/lib/wizard-store";
import { qtype } from "@/lib/survey-types";


export function StepSurvey() {
  const draft = useWizardStore((s) => s.draft);
  const qs = draft.survey.questions;
  const enMissing = qs.some((q) => !q.titleEn);

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">แบบประเมิน · {draft.general.nameTh}</CardTitle>
        <Badge variant="secondary">
          {qs.length} คำถาม · TH ครบ · {enMissing ? "EN ยังไม่แปล" : "EN ครบ"}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-3">
        {qs.map((q, i) => {
          const Icon = qtype(q.type).icon;
          return (
            <div key={q.id} className="flex items-center gap-2 rounded-lg border px-4 py-3 text-sm">
              <span className="font-semibold text-primary">{i + 1}</span>
              <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                <Icon className="size-4" />
              </span>
              <span className="flex-1">{q.titleTh || "(ยังไม่ตั้งชื่อคำถาม)"}</span>
              <span className="text-muted-foreground">{qtype(q.type).th}</span>
            </div>
          );
        })}
        {/* TODO: สร้างหน้า Survey builder ที่ /admin/events/[id]/survey */}
        <Button
          variant="secondary"
          className="text-primary"
          nativeButton={false}
          render={<Link href={`/admin/events/${draft.id}/survey`} />}
        >
          เปิด Survey builder
        </Button>
      </CardContent>
    </Card>
  );
}
