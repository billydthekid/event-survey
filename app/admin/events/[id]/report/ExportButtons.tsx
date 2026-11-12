// app/admin/events/[id]/report/ExportButtons.tsx
// ปุ่ม Export CSV / PDF ในส่วนหัวของ Report (แสดงเหมือนกันทุกแท็บ)
// - กดแล้วปุ่มเปลี่ยนเป็น "กำลังสร้าง ..." หน่วงเวลาสั้นๆ (จำลองการรอ server) แล้วสร้างไฟล์จริง
// - ผลลัพธ์แจ้งด้วย Toast: "ดาวน์โหลดเริ่ม" หรือ "Export ไม่สำเร็จ"
// - ถูกวางไว้ใน ReportShell หลังผ่านด่านสิทธิ์แล้วเท่านั้น → Export ได้เฉพาะ Event ที่ได้รับมอบหมาย
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Download, Loader2 } from "lucide-react";
import { Event, Lang } from "@/types";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { ReportData } from "./mockData";
import { exportSummaryCsv } from "./exportCsv";

// ============ พจนานุกรมข้อความ 2 ภาษา ============
const TEXT = {
  th: {
    csv: "CSV",
    pdf: "PDF",
    makingCsv: "กำลังสร้าง CSV...",
    makingPdf: "กำลังสร้าง PDF...",
    started: "ดาวน์โหลดเริ่ม",
    failed: "Export ไม่สำเร็จ",
    retry: "กรุณาลองใหม่อีกครั้ง",
  },
  en: {
    csv: "CSV",
    pdf: "PDF",
    makingCsv: "Creating CSV...",
    makingPdf: "Creating PDF...",
    started: "Download started",
    failed: "Export failed",
    retry: "Please try again",
  },
};

// เวลาหน่วงจำลอง (มิลลิวินาที) — ไม่มี backend จึงจำลองช่วงรอสร้างไฟล์
const FAKE_DELAY_MS = 1200;
const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export function ExportButtons({ event, data, lang }: { event: Event; data: ReportData; lang: Lang }) {
  const t = TEXT[lang];
  const router = useRouter();
  // ปุ่มที่กำลังทำงานอยู่ (null = ว่าง) ระหว่างทำงาน ทั้ง 2 ปุ่มกดไม่ได้ กันกดซ้ำ
  const [busy, setBusy] = useState<"csv" | "pdf" | null>(null);

  // ----- Export CSV -----
  async function handleCsv() {
    setBusy("csv");
    try {
      await wait(FAKE_DELAY_MS);
      const filename = exportSummaryCsv(event, data, lang); // สร้างและดาวน์โหลดไฟล์จริง
      toast.add({ type: "info", title: t.started, description: filename });
    } catch {
      toast.add({ type: "error", title: t.failed, description: t.retry });
    } finally {
      setBusy(null); // คืนปุ่มเป็นปกติเสมอ ไม่ว่าสำเร็จหรือไม่
    }
  }

  // ----- Export PDF -----
  // ไปหน้า report/print ในแท็บเดิม (router.push ไม่โดนบล็อกแบบ popup ของ window.open)
  // หน้า print จะสั่ง window.print() เอง → ผู้ใช้เลือก "บันทึกเป็น PDF"
  async function handlePdf() {
    setBusy("pdf");
    try {
      await wait(FAKE_DELAY_MS);
      router.push(`/admin/events/${event.id}/report/print`);
      // สำเร็จ: ไม่คืนปุ่ม — ปุ่มนี้หายไปพร้อมส่วนหัวเมื่อเข้าหน้า print
      // (ถ้าคืนตอนนี้ ปุ่มจะกระพริบกลับเป็นปกติแวบหนึ่งก่อนหน้าเปลี่ยน)
    } catch {
      toast.add({ type: "error", title: t.failed, description: t.retry });
      setBusy(null);
    }
  }

  return (
    <div className="flex gap-2">
      <Button variant="outline" className="bg-white" disabled={busy !== null} onClick={handleCsv}>
        {busy === "csv" ? <Loader2 className="animate-spin" /> : <Download />}
        {busy === "csv" ? t.makingCsv : t.csv}
      </Button>

      <Button className="bg-blue-600 text-white hover:bg-blue-700" disabled={busy !== null} onClick={handlePdf}>
        {busy === "pdf" ? <Loader2 className="animate-spin" /> : <Download />}
        {busy === "pdf" ? t.makingPdf : t.pdf}
      </Button>
    </div>
  );
}
