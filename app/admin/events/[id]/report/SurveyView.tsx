// app/admin/events/[id]/report/SurveyView.tsx
// เนื้อหาแท็บ Survey: การ์ดสรุปผล 1 ใบต่อคำถาม เลือกรูปแบบการ์ดตามชนิดคำถาม
// - rating / linear / single / dropdown / multi / opinion / yesno → แท่งแนวนอน (HBar จาก charts.tsx)
// - mcgrid / cbgrid → ตาราง heatmap (GridBody)
// - short / long / date → ตัวอย่างคำตอบ + ลิงก์ไปแท็บคำตอบรายคน
"use client";
import Link from "next/link";
import { ClipboardList } from "lucide-react";
import { BiText, Lang } from "@/types";
import type { ReportQuestion } from "./reportData";
import { Card } from "@/components/ui/card";
import { useReport } from "./ReportShell";
import { HBar } from "./charts";
import { pct, summarize, Summary, tr } from "./summary";

// ============ พจนานุกรมข้อความ 2 ภาษา ============
const TEXT = {
  th: {
    qLabel: (n: number, type: string) => `ข้อ ${n} · ${type}`,
    types: { rating: "Rating", single: "ตัวเลือกเดียว", multi: "หลายตัวเลือก", dropdown: "Dropdown", short: "ข้อความสั้น", long: "ข้อความยาว", date: "วันที่", linear: "สเกลตัวเลข", opinion: "ระดับความเห็น", mcgrid: "ตารางเลือกข้อเดียว", cbgrid: "ตารางเลือกหลายข้อ", yesno: "ใช่ / ไม่ใช่" },
    // max = คะแนนเต็มของข้อนั้น เช่น avg("4.2", 5) → "เฉลี่ย 4.2 / 5", avg("7.5", 10) → "เฉลี่ย 7.5 / 10"
    avg: (avg: string, max: number) => `เฉลี่ย ${avg} / ${max}`,
    answers: (n: number) => `${n} คำตอบ`,
    multiPeople: (n: number) => `เลือกได้หลายข้อ · ${n} คน`,
    optional: "(ไม่บังคับ)",
    noAnswers: "ยังไม่มีคำตอบ",
    // ข้อความเมื่อเอาเมาส์ชี้ช่องในตาราง เช่น "7 คน · 58%"
    cellTitle: (count: number, percent: number) => `${count} คน · ${percent}%`,
    seeAll: "ดูทั้งหมดในคำตอบรายคน",
    empty: "Survey นี้ยังไม่มีคำถาม",
  },
  en: {
    qLabel: (n: number, type: string) => `Q${n} · ${type}`,
    types: { rating: "Rating", single: "Single choice", multi: "Multiple choice", dropdown: "Dropdown", short: "Short text", long: "Long text", date: "Date", linear: "Linear scale", opinion: "Opinion scale", mcgrid: "Multiple choice grid", cbgrid: "Checkbox grid", yesno: "Yes / No" },
    avg: (avg: string, max: number) => `avg. ${avg} / ${max}`,
    answers: (n: number) => `${n} responses`,
    multiPeople: (n: number) => `Multiple answers allowed · ${n} people`,
    optional: "(optional)",
    noAnswers: "No responses yet",
    cellTitle: (count: number, percent: number) => `${count} people · ${percent}%`,
    seeAll: "See all in Responses",
    empty: "This survey has no questions yet",
  },
};
type Text = (typeof TEXT)["th"];

// ตัวคำนวณ (summarize, pct, tr) ย้ายไปอยู่ที่ summary.ts เพื่อใช้ร่วมกับ Export

// ============ ส่วนหลัก ============
export function SurveyView() {
  const { event, data, lang } = useReport();
  const t = TEXT[lang];

  const questions = [...data.survey.questions].sort((a, b) => a.order - b.order);
  const answersHref = `/admin/events/${event.id}/report/answers`;

  if (questions.length === 0) {
    return (
      <Card className="items-center gap-2 rounded-2xl py-12 text-center ring-slate-200">
        <ClipboardList size={32} className="text-slate-400" />
        <p className="text-sm text-slate-500">{t.empty}</p>
      </Card>
    );
  }

  return (
    // 2 คอลัมน์บนจอกว้าง; ข้อความยาวกินเต็มแถว (md:col-span-2) แบบ design ข้อ 7
    // print:grid-cols-2 = ตอนพิมพ์ก็ 2 คอลัมน์ (กระดาษ A4 แคบกว่าจุด md จึงต้องบังคับเอง)
    <div className="grid gap-4 md:grid-cols-2 print:grid-cols-2">
      {questions.map((question) => (
        <QuestionCard
          key={question.id}
          question={question}
          summary={summarize(question, data.responses, lang, data.ratingLabels?.[question.id])}
          hint={data.ratingLabels?.[question.id]?.hint}
          lang={lang}
          t={t}
          answersHref={answersHref}
        />
      ))}
    </div>
  );
}

// ============ การ์ดคำถาม 1 ใบ ============
function QuestionCard({
  question,
  summary,
  hint,
  lang,
  t,
  answersHref,
}: {
  question: ReportQuestion;
  summary: Summary;
  hint?: BiText;
  lang: Lang;
  t: Text;
  answersHref: string;
}) {
  // ----- บรรทัดสรุปใต้ชื่อคำถาม -----
  // rating / linear: "เฉลี่ย 4.2 / 5 · 31 คำตอบ" (สเกล 10 → "/ 10") (+ " · 1 = ง่าย, 5 = ยาก" ถ้ามี hint)
  // หลายตัวเลือก / ตารางเลือกหลายข้อ: "เลือกได้หลายข้อ · 31 คน"
  // อื่นๆ:        "26 คำตอบ" (+ " (ไม่บังคับ)" ถ้าข้อนั้นไม่บังคับ)
  const parts: string[] = [];
  if (summary.kind === "bars" && summary.avg && summary.scaleMax) parts.push(t.avg(summary.avg, summary.scaleMax));
  const multiple = question.type === "multi" || question.type === "cbgrid";
  parts.push(multiple ? t.multiPeople(summary.n) : t.answers(summary.n));
  if (hint) parts.push(tr(hint, lang));
  const subtitle = parts.join(" · ") + (question.required ? "" : ` ${t.optional}`);

  // ข้อความยาวและตาราง กินเต็มแถว (ตารางกว้าง อ่านง่ายกว่าเมื่อมีที่)
  const wide = question.type === "long" || summary.kind === "grid";

  return (
    // print:break-inside-avoid = ตอนพิมพ์ไม่ตัดการ์ดครึ่งใบข้ามหน้ากระดาษ
    <Card
      className={`gap-3 rounded-2xl px-5 ring-slate-200 print:break-inside-avoid ${
        wide ? "md:col-span-2 print:col-span-2" : ""
      }`}
    >
      <div>
        <p className="text-xs font-semibold text-blue-600">{t.qLabel(question.order, t.types[question.type])}</p>
        <p className="mt-1 font-semibold">{tr(question.title, lang)}</p>
        <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>
      </div>

      {summary.kind === "bars" && <BarsBody summary={summary} />}
      {summary.kind === "grid" && <GridBody summary={summary} t={t} />}
      {summary.kind === "text" && <TextBody samples={summary.samples} t={t} answersHref={answersHref} />}
    </Card>
  );
}

// ============ เนื้อหาการ์ดแบบตาราง (heatmap) ============
// แถว × คอลัมน์ · ตัวเลขในช่อง = จำนวนคนที่เลือก · ความเข้มของสีพื้น = % ของคนที่ตอบแถวนั้น
// ตัวอย่าง: หัวข้อ 1 ตอบ 12 คน เลือก "ดีมาก" 7 คน → ช่องนั้นขึ้น 7 สีเข้ม (58%), ช่องที่เป็น 0 ไม่มีสี
// overflow-x-auto: คอลัมน์เยอะ → เลื่อนในการ์ด (ทั้งหน้าไม่เลื่อนแนวนอน)
// export ไว้ให้ Overview ใช้ตัวเดียวกัน → ส่งข้อความมาเอง (แต่ละหน้ามีพจนานุกรมของตัวเอง)
export function GridBody({
  summary,
  t,
}: {
  summary: Extract<Summary, { kind: "grid" }>;
  t: { noAnswers: string; cellTitle: (count: number, percent: number) => string };
}) {
  if (summary.n === 0) return <p className="text-sm text-slate-400">{t.noAnswers}</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-max border-separate border-spacing-1 text-sm">
        <thead>
          <tr>
            <th />
            {summary.columns.map((col) => (
              <th key={col} className="px-2 pb-1 text-center text-xs font-medium text-slate-500">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {summary.rows.map((row) => (
            <tr key={row.label}>
              <th className="max-w-48 truncate pr-3 text-left font-normal">{row.label}</th>
              {row.counts.map((count, c) => {
                const p = pct(count, row.answered);
                return (
                  <td
                    key={summary.columns[c]}
                    title={t.cellTitle(count, p)}
                    className={`min-w-14 rounded-md px-2 py-1.5 text-center tabular-nums ${count > 0 ? "font-semibold" : "text-slate-300"} ${
                      p >= 50 ? "text-white" : ""
                    }`}
                    // ใช้ rgba ของ blue-600 (#2563EB) ปรับความเข้มตาม % · ตอนพิมพ์ให้สีติดไปด้วย
                    style={
                      count > 0
                        ? { backgroundColor: `rgba(37, 99, 235, ${0.12 + (p / 100) * 0.78})`, printColorAdjust: "exact" }
                        : undefined
                    }
                  >
                    {count}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ============ เนื้อหาการ์ดแบบแท่ง ============
function BarsBody({ summary }: { summary: Extract<Summary, { kind: "bars" }> }) {
  // แท่งที่มีคนเลือกมากที่สุดยาวเต็ม (ใช้ max เดียวกันทั้งการ์ด)
  const max = Math.max(0, ...summary.rows.map((r) => r.count));
  return (
    <div className="space-y-2">
      {summary.rows.map((row) => (
        <HBar
          key={row.label}
          label={row.label}
          value={row.count}
          max={max}
          // % คิดจาก n = จำนวนคนที่ตอบข้อนี้ เช่น 22 · 71% (22 ÷ 31)
          right={`${row.count} · ${pct(row.count, summary.n)}%`}
        />
      ))}
    </div>
  );
}

// ============ เนื้อหาการ์ดแบบข้อความ ============
function TextBody({ samples, t, answersHref }: { samples: string[]; t: Text; answersHref: string }) {
  if (samples.length === 0) return <p className="text-sm text-slate-400">{t.noAnswers}</p>;
  return (
    <>
      <div className="space-y-2">
        {samples.map((text) => (
          <p key={text} className="rounded-lg bg-slate-50 px-4 py-2.5 text-sm">
            “{text}”
          </p>
        ))}
      </div>
      {/* ลิงก์กดในกระดาษไม่ได้ → ซ่อนตอนพิมพ์ */}
      <Link href={answersHref} className="text-sm text-blue-600 underline underline-offset-2 print:hidden">
        {t.seeAll}
      </Link>
    </>
  );
}
