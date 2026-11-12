// app/admin/events/[id]/report/PrintView.tsx
// หน้าพิมพ์ "สรุปผล Survey" (URL: /admin/events/<id>/report/print)
// - ไม่มี Sidebar / Topbar / หัว Report / แถบแท็บ (admin layout และ ReportShell ซ่อนให้เมื่อเป็น path นี้)
// - ด่านสิทธิ์ยังเป็นของ ReportShell: มาถึงคอมโพเนนต์นี้ได้ = ได้รับมอบหมาย Event นี้ และมีข้อมูลรายงานแล้ว
// - เปิดหน้าแล้วสั่งพิมพ์อัตโนมัติ 1 ครั้ง → ผู้ใช้เลือก "บันทึกเป็น PDF" ในหน้าต่างพิมพ์ของเบราว์เซอร์
"use client";
import { useEffect, useRef } from "react";
import Link from "next/link";
import { ChevronLeft, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useReport } from "./ReportShell";
import { SurveyView } from "./SurveyView";
import { tr } from "./summary";

// ============ พจนานุกรมข้อความ 2 ภาษา ============
const TEXT = {
  th: { title: "สรุปผล Survey", back: "กลับไป Report", printAgain: "พิมพ์อีกครั้ง" },
  en: { title: "Survey summary", back: "Back to Report", printAgain: "Print again" },
};

// CSS เฉพาะหน้านี้ (แท็ก <style> มีอยู่เฉพาะตอนเปิดหน้า print จึงไม่กระทบหน้าอื่น)
// - @page: กระดาษ A4 ขอบ 12 มม.
// - print-color-adjust: exact → ให้พิมพ์สีพื้นหลัง (แท่งกราฟสีน้ำเงินเป็นสีพื้นหลัง
//   ถ้าไม่ใส่ เบราว์เซอร์จะตัดสีพื้นหลังทิ้งตอนพิมพ์ แท่งจะหายหมด)
//   ใส่ที่กล่อง .report-print เท่านั้น พื้นหลังไล่สีของกรอบ admin จึงยังถูกตัดเป็นสีขาวตามปกติ
const PRINT_CSS = `
@page { size: A4; margin: 12mm; }
.report-print { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
`;

export function PrintView() {
  const { event, data, lang, summaryText } = useReport();
  const t = TEXT[lang];

  // ----- สั่งพิมพ์อัตโนมัติ 1 ครั้งหลังหน้าแสดงครบ -----
  // printedRef: กันพิมพ์ซ้ำ (ตอน dev React เรียก effect 2 รอบ)
  // active: ถ้าออกจากหน้าไปก่อนฟอนต์โหลดเสร็จ จะไม่เด้งหน้าต่างพิมพ์ตามมา
  const printedRef = useRef(false);
  useEffect(() => {
    let active = true;
    // รอฟอนต์ (Google Sans / Sarabun) โหลดเสร็จก่อน ไม่งั้น PDF อาจได้ฟอนต์สำรอง
    document.fonts.ready.then(() => {
      if (active && !printedRef.current) {
        printedRef.current = true;
        window.print();
      }
    });
    return () => {
      active = false;
    };
  }, []);

  // วันที่จัดงาน เช่น "2026-10-23" → "23 ต.ค. 2569" / "23 Oct 2026"
  const eventDate = new Date(event.date).toLocaleDateString(lang === "th" ? "th-TH" : "en-GB", {
    dateStyle: "medium",
  });

  return (
    <div className="report-print mx-auto max-w-5xl pt-6">
      <style>{PRINT_CSS}</style>

      {/* ===== ปุ่มบนจอ (print:hidden = ไม่ออกในกระดาษ) ===== */}
      <div className="mb-6 flex justify-between print:hidden">
        <Button variant="ghost" nativeButton={false} render={<Link href={`/admin/events/${event.id}/report`} />} className="text-blue-600">
          <ChevronLeft /> {t.back}
        </Button>
        <Button className="bg-blue-600 text-white hover:bg-blue-700" onClick={() => window.print()}>
          <Printer /> {t.printAgain}
        </Button>
      </div>

      {/* ===== หัวรายงาน ===== */}
      <header className="mb-5">
        <p className="text-sm text-slate-500">
          {tr(event.name, lang)} · {eventDate}
        </p>
        <h1 className="mt-1 text-2xl font-bold">
          {t.title} — {tr(data.survey.title, lang)}
        </h1>
        <p className="mt-1 text-sm text-slate-500">{summaryText}</p>
      </header>

      {/* ===== การ์ดสรุปทุกข้อ (คอมโพเนนต์เดียวกับแท็บ Survey) ===== */}
      <SurveyView />
    </div>
  );
}
