// app/admin/events/[id]/report/ComingSoon.tsx
// เนื้อหาชั่วคราวของแท็บที่ยังไม่ทำ (ผู้เข้าร่วม / Survey / คำตอบรายคน)
// แถบแท็บและส่วนหัวมาจาก layout.tsx อยู่แล้ว ไฟล์นี้แสดงแค่ข้อความ
"use client";
import { Construction } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useReport } from "./ReportShell";

const TEXT = {
  th: { title: "กำลังพัฒนา", hint: "แท็บนี้จะเปิดให้ใช้เร็วๆ นี้" },
  en: { title: "Under development", hint: "This tab is coming soon" },
};

export function ComingSoon() {
  const { lang } = useReport();
  const t = TEXT[lang];
  return (
    <Card className="items-center gap-2 rounded-2xl py-12 text-center ring-slate-200">
      <Construction size={32} className="text-slate-400" />
      <p className="text-lg font-semibold">{t.title}</p>
      <p className="text-sm text-slate-500">{t.hint}</p>
    </Card>
  );
}
