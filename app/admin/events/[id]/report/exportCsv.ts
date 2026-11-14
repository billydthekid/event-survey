// app/admin/events/[id]/report/exportCsv.ts
// สร้างไฟล์ CSV "สรุปผล Survey ต่อคำถาม" ของ Event หนึ่งงาน
// - ฟังก์ชันล้วน ไม่มี React: buildSummaryRows คืนตาราง → exportSummaryCsv ส่งต่อให้ downloadCSV
// - ตัวเลขมาจาก summarize() ชุดเดียวกับแท็บ Survey จึงตรงกับบนจอเสมอ
// - BOM / UTF-8 / การครอบ " ให้ downloadCSV (lib/utils/csv.ts) จัดการ ไฟล์นี้ไม่ทำซ้ำ
import { Event, Lang } from "@/types";
import { downloadCSV } from "@/lib/utils/csv";
import { ReportData } from "./mockData";
import { answersOf, pct, summarize, tr } from "./summary";

// ============ พจนานุกรมข้อความ 2 ภาษา (หัวคอลัมน์ + ชื่อชนิดคำถาม) ============
const TEXT = {
  th: {
    header: ["ข้อ", "คำถาม", "ชนิด", "ตัวเลือก / คะแนน / คำตอบ", "จำนวน", "%", "ตัวหาร (คน)", "ค่าเฉลี่ย"],
    types: { rating: "Rating", single: "ตัวเลือกเดียว", multi: "หลายตัวเลือก", dropdown: "Dropdown", short: "ข้อความสั้น", long: "ข้อความยาว", date: "วันที่", linear: "สเกลตัวเลข", opinion: "ระดับความเห็น", mcgrid: "ตารางเลือกข้อเดียว", cbgrid: "ตารางเลือกหลายข้อ", yesno: "ใช่ / ไม่ใช่" },
  },
  en: {
    header: ["No.", "Question", "Type", "Option / Score / Answer", "Count", "%", "Base (people)", "Average"],
    types: { rating: "Rating", single: "Single choice", multi: "Multiple choice", dropdown: "Dropdown", short: "Short text", long: "Long text", date: "Date", linear: "Linear scale", opinion: "Opinion scale", mcgrid: "Multiple choice grid", cbgrid: "Checkbox grid", yesno: "Yes / No" },
  },
};

type Row = (string | number)[];

// ============ สร้างตาราง ============
// รับ: ข้อมูลรายงาน + ภาษาที่เลือกบนจอ
// ส่ง: array ของแถว (แถวแรก = หัวคอลัมน์) เช่น
//   ["ข้อ","คำถาม","ชนิด","ตัวเลือก / คะแนน / คำตอบ","จำนวน","%","ตัวหาร (คน)","ค่าเฉลี่ย"]
//   [1, "ความพึงพอใจต่อ Workshop", "Rating", "5 ดีมาก", 14, 45, 31, "4.2"]
//   [4, "หัวข้อที่ได้ประโยชน์มากที่สุด", "หลายตัวเลือก", "Auto layout", 22, 71, 31, ""]
//   [6, "อยากให้จัดหัวข้ออะไรต่อ", "ข้อความสั้น", "Design system เบื้องต้น", 8, 33, 24, ""]
export function buildSummaryRows(data: ReportData, lang: Lang): Row[] {
  const t = TEXT[lang];
  const rows: Row[] = [t.header];

  const questions = [...data.survey.questions].sort((a, b) => a.order - b.order);
  for (const question of questions) {
    const summary = summarize(question, data.responses, lang, data.ratingLabels?.[question.id]);
    // 3 คอลัมน์แรกซ้ำทุกแถวของข้อเดียวกัน → กรอง/เรียงใน Excel ได้ง่าย
    const head: Row = [question.order, tr(question.title, lang), t.types[question.type]];

    if (summary.kind === "bars") {
      // rating / ตัวเลือก: 1 แถวต่อ 1 ตัวเลือก (หรือ 1 คะแนน)
      for (const r of summary.rows) {
        rows.push([...head, r.label, r.count, pct(r.count, summary.n), summary.n, summary.avg ?? ""]);
      }
    } else {
      // ข้อความ: จัดกลุ่มคำตอบที่พิมพ์เหมือนกันทุกตัวอักษร แล้วนับจำนวน (ไม่ตัดเหลือ 3 แบบบนจอ)
      // เช่น "Design system เบื้องต้น" ตอบ 8 คน → 1 แถว จำนวน 8
      const counts = new Map<string, number>();
      for (const a of answersOf(question, data.responses)) {
        const text = String(a);
        counts.set(text, (counts.get(text) ?? 0) + 1);
      }
      for (const [text, count] of counts) {
        rows.push([...head, text, count, pct(count, summary.n), summary.n, ""]);
      }
    }
  }
  return rows;
}

// ============ ชื่อไฟล์ ============
// เช่น survey-summary_e-workshop_2026-11-12.csv (ใช้ id ของ Event แทนชื่อไทย กันปัญหาชื่อไฟล์)
export function summaryFileName(event: Event, now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `survey-summary_${event.id}_${y}-${m}-${d}.csv`;
}

// ============ ดาวน์โหลด ============
// คืนชื่อไฟล์ที่ดาวน์โหลด (ให้ Toast แสดง)
export function exportSummaryCsv(event: Event, data: ReportData, lang: Lang): string {
  const filename = summaryFileName(event);
  downloadCSV(filename, buildSummaryRows(data, lang));
  return filename;
}
