// app/admin/events/[id]/report/OverviewView.tsx
// เนื้อหาแท็บ Overview: ตัวเลขสรุป, เพศ, กลุ่มอายุ, สรุปคำถาม 2 ข้อแรก
"use client";
import Link from "next/link";
import { BiText, Lang, Question, SurveyResponse } from "@/types";
import { Card } from "@/components/ui/card";
import { useReport } from "./ReportShell";
import { Donut, HBar } from "./charts";
import { Gender } from "./mockData";

// ============ พจนานุกรมข้อความ 2 ภาษา ============
const TEXT = {
  th: {
    registered: "ผู้ลงทะเบียนทั้งหมด",
    responded: "ผู้ตอบแบบสอบถาม",
    rate: "Response rate",
    gender: "เพศ",
    genders: { male: "ชาย", female: "หญิง", unspecified: "ไม่ระบุ" },
    people: "คน",
    ageGroups: "กลุ่มอายุ",
    avgAge: (n: string) => `เฉลี่ย ${n} ปี`,
    ages: ["ไม่เกิน 18", "19 – 22", "23 – 30", "31 ขึ้นไป"],
    qLabel: (n: number, type: string) => `ข้อ ${n} · ${type}`,
    types: { rating: "Rating", single: "ตัวเลือกเดียว", multi: "หลายตัวเลือก", dropdown: "Dropdown", short: "ข้อความสั้น", long: "ข้อความยาว", date: "วันที่" },
    outOf: (n: number) => `/ 5 จาก ${n} คำตอบ`,
    answers: (n: number) => `${n} คำตอบ`,
    seeAll: "ดูสรุปทุกข้อในแท็บ Survey",
  },
  en: {
    registered: "Total registrations",
    responded: "Survey respondents",
    rate: "Response rate",
    gender: "Gender",
    genders: { male: "Male", female: "Female", unspecified: "Not specified" },
    people: "people",
    ageGroups: "Age groups",
    avgAge: (n: string) => `avg. ${n} yrs`,
    ages: ["18 and under", "19 – 22", "23 – 30", "31 and over"],
    qLabel: (n: number, type: string) => `Q${n} · ${type}`,
    types: { rating: "Rating", single: "Single choice", multi: "Multiple choice", dropdown: "Dropdown", short: "Short text", long: "Long text", date: "Date" },
    outOf: (n: number) => `/ 5 from ${n} responses`,
    answers: (n: number) => `${n} responses`,
    seeAll: "See all questions in the Survey tab",
  },
};
type Text = (typeof TEXT)["th"];

// สีของแต่ละเพศในวงแหวน (ตาม design: ฟ้าอ่อน / ชมพูอ่อน / เทาเข้ม)
const GENDER_COLOR: Record<Gender, string> = {
  male: "#BFD0FB",
  female: "#FBD9DC",
  unspecified: "#64748B",
};
const GENDERS: Gender[] = ["male", "female", "unspecified"];

// % แบบปัดเศษ เช่น pct(24, 46) → 52
const pct = (n: number, total: number) => (total > 0 ? Math.round((n / total) * 100) : 0);

// ชื่อหรือข้อความตามภาษา (ไม่มี EN → ใช้ TH)
const tr = (text: BiText, lang: Lang) => (lang === "en" && text.en ? text.en : text.th);

export function OverviewView() {
  const { event, data, lang } = useReport();
  const t = TEXT[lang];

  const regs = data.registrations;
  const total = regs.length;
  const respondents = data.responses.length;

  // ----- เพศ: นับจาก answers.gender -----
  const genderCount = GENDERS.map((g) => regs.filter((r) => r.answers.gender === g).length);

  // ----- อายุ: แบ่ง 4 กลุ่ม + ค่าเฉลี่ย -----
  const ages = regs.map((r) => Number(r.answers.age)).filter((n) => !Number.isNaN(n));
  const ageGroupCount = [
    ages.filter((a) => a <= 18).length,
    ages.filter((a) => a >= 19 && a <= 22).length,
    ages.filter((a) => a >= 23 && a <= 30).length,
    ages.filter((a) => a >= 31).length,
  ];
  const avgAge = ages.length ? (ages.reduce((s, a) => s + a, 0) / ages.length).toFixed(1) : "-";

  // ----- คำถาม 2 ข้อแรก (เรียงตาม order) -----
  const firstTwo = [...data.survey.questions].sort((a, b) => a.order - b.order).slice(0, 2);

  return (
    <div className="grid gap-4">
      {/* ===== ตัวเลขสรุป 3 ใบ ===== */}
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label={t.registered} value={String(total)} />
        <StatCard label={t.responded} value={String(respondents)} />
        <StatCard label={t.rate} value={`${pct(respondents, total)}%`} sub={`${respondents} ÷ ${total}`} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* ===== เพศ (วงแหวน) ===== */}
        <Card className="rounded-2xl px-5 ring-slate-200">
          <p className="font-semibold">{t.gender}</p>
          <div className="flex items-center gap-6">
            <Donut
              segments={GENDERS.map((g, i) => ({ value: genderCount[i], color: GENDER_COLOR[g] }))}
              center={String(total)}
              centerSub={t.people}
            />
            <div className="flex-1 space-y-2 text-sm">
              {GENDERS.map((g, i) => (
                <div key={g} className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: GENDER_COLOR[g] }} />
                    {t.genders[g]}
                  </span>
                  <span className="text-slate-600">
                    {genderCount[i]} · {pct(genderCount[i], total)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* ===== กลุ่มอายุ (แท่งแนวนอน) ===== */}
        <Card className="rounded-2xl px-5 ring-slate-200">
          <div className="flex items-center justify-between">
            <p className="font-semibold">{t.ageGroups}</p>
            <span className="text-xs text-slate-500">{t.avgAge(avgAge)}</span>
          </div>
          <div className="space-y-2">
            {t.ages.map((label, i) => (
              <HBar
                key={label}
                label={label}
                value={ageGroupCount[i]}
                max={Math.max(...ageGroupCount)}
                right={`${ageGroupCount[i]} ${t.people}`}
              />
            ))}
          </div>
        </Card>
      </div>

      {/* ===== สรุปคำถาม 2 ข้อแรก ===== */}
      <div className="grid gap-4 md:grid-cols-2">
        {firstTwo.map((question, i) => (
          <QuestionCard
            key={question.id}
            question={question}
            responses={data.responses}
            lang={lang}
            t={t}
            // ลิงก์ "ดูสรุปทุกข้อ" ใส่เฉพาะการ์ดสุดท้าย (แบบ design)
            seeAllHref={i === firstTwo.length - 1 ? `/admin/events/${event.id}/report/survey` : undefined}
          />
        ))}
      </div>

      {/* กราฟลงทะเบียนรายวัน: ซ่อนไว้ก่อน
          design แสดงเฉพาะงานหลายวัน แต่ type Event มีแค่ `date` วันเดียว
          จะรองรับเมื่อ type Event มี endDate (แสดงเมื่อ date ≠ endDate) */}
    </div>
  );
}

// ============ การ์ดตัวเลข ============
function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <Card className="gap-1 rounded-2xl px-5 ring-slate-200">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="text-4xl font-bold">{value}</p>
      {sub && <p className="text-xs text-slate-400">{sub}</p>}
    </Card>
  );
}

// ============ การ์ดสรุปคำถาม 1 ข้อ ============
function QuestionCard({
  question,
  responses,
  lang,
  t,
  seeAllHref,
}: {
  question: Question;
  responses: SurveyResponse[];
  lang: Lang;
  t: Text;
  seeAllHref?: string;
}) {
  // คำตอบของข้อนี้ (ตัดคนที่ข้ามออก)
  const answers = responses.map((r) => r.answers[question.id]).filter((a) => a !== undefined);
  const n = answers.length;

  // แถวของกราฟ: rating → คะแนน 5..1 | ตัวเลือก → ตามรายการ options | ข้อความ → ไม่มีกราฟ
  let rows: { label: string; count: number }[] = [];
  if (question.type === "rating") {
    rows = [5, 4, 3, 2, 1].map((score) => ({ label: String(score), count: answers.filter((a) => a === score).length }));
  } else if (question.options) {
    rows = question.options.map((opt) => ({
      label: tr(opt, lang),
      // คำตอบเก็บเป็นข้อความไทย (ตัวเลือกเดียว = string, หลายตัวเลือก = string[])
      count: answers.filter((a) => (Array.isArray(a) ? a.includes(opt.th) : a === opt.th)).length,
    }));
  }
  const max = Math.max(0, ...rows.map((r) => r.count));

  // ค่าเฉลี่ยของ rating เช่น (5×14 + 4×11 + 3×4 + 2×2) ÷ 31 = 4.2
  const avg =
    question.type === "rating" && n > 0
      ? (answers.reduce<number>((s, a) => s + Number(a), 0) / n).toFixed(1)
      : null;

  return (
    <Card className="gap-3 rounded-2xl px-5 ring-slate-200">
      <div>
        <p className="text-xs font-semibold text-blue-600">{t.qLabel(question.order, t.types[question.type])}</p>
        <p className="mt-1 font-semibold">{tr(question.title, lang)}</p>
      </div>

      {avg ? (
        <p>
          <span className="text-4xl font-bold">{avg}</span>{" "}
          <span className="text-sm text-slate-500">{t.outOf(n)}</span>
        </p>
      ) : (
        <p className="text-sm text-slate-500">{t.answers(n)}</p>
      )}

      <div className="space-y-2">
        {rows.map((row) => (
          <HBar key={row.label} label={row.label} value={row.count} max={max} right={`${row.count} · ${pct(row.count, n)}%`} />
        ))}
      </div>

      {seeAllHref && (
        <Link href={seeAllHref} className="text-sm text-blue-600 underline-offset-2 hover:underline">
          {t.seeAll}
        </Link>
      )}
    </Card>
  );
}
