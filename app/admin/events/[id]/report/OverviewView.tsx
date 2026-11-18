// app/admin/events/[id]/report/OverviewView.tsx
// เนื้อหาแท็บ Overview: ตัวเลขสรุป, เพศ, กลุ่มอายุ, สรุปคำถาม 2 ข้อแรก
"use client";
import Link from "next/link";
import { BiText, Lang, SurveyResponse } from "@/types";
import { Card } from "@/components/ui/card";
import { useReport } from "./ReportShell";
import { Donut, HBar } from "./charts";
import { Gender } from "./mockData";
import { responseCounts } from "./people";
import type { ReportQuestion } from "./reportData";
import { summarize } from "./summary";
import { GridBody } from "./SurveyView";

// ============ พจนานุกรมข้อความ 2 ภาษา ============
const TEXT = {
  th: {
    registered: "ผู้ลงทะเบียนทั้งหมด",
    responded: "ผู้ตอบแบบสอบถาม",
    anonymousN: (n: number) => `ไม่ระบุชื่อ ${n}`, // คำตอบที่ไม่โยงกับผู้ลงทะเบียน (แสดงเมื่อ > 0)
    rate: "Response rate",
    gender: "เพศ",
    genders: { male: "ชาย", female: "หญิง", unspecified: "ไม่ระบุ" },
    people: "คน",
    ageGroups: "กลุ่มอายุ",
    avgAge: (n: string) => `เฉลี่ย ${n} ปี`,
    ages: ["ไม่เกิน 18", "19 – 22", "23 – 30", "31 ขึ้นไป"],
    qLabel: (n: number, type: string) => `ข้อ ${n} · ${type}`,
    types: { rating: "Rating", single: "ตัวเลือกเดียว", multi: "หลายตัวเลือก", dropdown: "Dropdown", short: "ข้อความสั้น", long: "ข้อความยาว", date: "วันที่", linear: "สเกลตัวเลข", opinion: "ระดับความเห็น", mcgrid: "ตารางเลือกข้อเดียว", cbgrid: "ตารางเลือกหลายข้อ", yesno: "ใช่ / ไม่ใช่" },
    // max = คะแนนเต็ม เช่น outOf(5, 31) → "/ 5 จาก 31 คำตอบ"
    outOf: (max: number, n: number) => `/ ${max} จาก ${n} คำตอบ`,
    answers: (n: number) => `${n} คำตอบ`,
    seeAll: "ดูสรุปทุกข้อในแท็บ Survey",
    noAnswers: "ยังไม่มีคำตอบ",
    cellTitle: (count: number, percent: number) => `${count} คน · ${percent}%`,
  },
  en: {
    registered: "Total registrations",
    responded: "Survey respondents",
    anonymousN: (n: number) => `Anonymous ${n}`,
    rate: "Response rate",
    gender: "Gender",
    genders: { male: "Male", female: "Female", unspecified: "Not specified" },
    people: "people",
    ageGroups: "Age groups",
    avgAge: (n: string) => `avg. ${n} yrs`,
    ages: ["18 and under", "19 – 22", "23 – 30", "31 and over"],
    qLabel: (n: number, type: string) => `Q${n} · ${type}`,
    types: { rating: "Rating", single: "Single choice", multi: "Multiple choice", dropdown: "Dropdown", short: "Short text", long: "Long text", date: "Date", linear: "Linear scale", opinion: "Opinion scale", mcgrid: "Multiple choice grid", cbgrid: "Checkbox grid", yesno: "Yes / No" },
    outOf: (max: number, n: number) => `/ ${max} from ${n} responses`,
    answers: (n: number) => `${n} responses`,
    seeAll: "See all questions in the Survey tab",
    noAnswers: "No responses yet",
    cellTitle: (count: number, percent: number) => `${count} people · ${percent}%`,
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
  // นับเป็น "คน" (responseCounts ใน people.ts) → ตรงกับแท็บผู้เข้าร่วม และ Response rate ไม่เกิน 100%
  const { responded: respondents, anonymous } = responseCounts(data);

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
        <StatCard
          label={t.responded}
          value={String(respondents)}
          sub={anonymous > 0 ? t.anonymousN(anonymous) : undefined}
        />
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
  question: ReportQuestion;
  responses: SurveyResponse[];
  lang: Lang;
  t: Text;
  seeAllHref?: string;
}) {
  // นับด้วย summarize() ตัวเดียวกับแท็บ Survey / CSV → ตัวเลขตรงกันทุกที่
  // (ไม่ส่งคำกำกับสเกล → แถวคะแนนเป็นตัวเลขล้วน "5".."1" แบบ design ของ Overview)
  const summary = summarize(question, responses, lang);
  const n = summary.n;
  const rows = summary.kind === "bars" ? summary.rows : [];
  const max = Math.max(0, ...rows.map((r) => r.count));
  // ค่าเฉลี่ย rating / linear เช่น (5×14 + 4×11 + 3×4 + 2×2) ÷ 31 = 4.2
  const avg = summary.kind === "bars" ? summary.avg : null;
  const scaleMax = summary.kind === "bars" ? summary.scaleMax : null;

  return (
    <Card className="gap-3 rounded-2xl px-5 ring-slate-200">
      <div>
        <p className="text-xs font-semibold text-blue-600">{t.qLabel(question.order, t.types[question.type])}</p>
        <p className="mt-1 font-semibold">{tr(question.title, lang)}</p>
      </div>

      {avg && scaleMax ? (
        <p>
          <span className="text-4xl font-bold">{avg}</span>{" "}
          <span className="text-sm text-slate-500">{t.outOf(scaleMax, n)}</span>
        </p>
      ) : (
        <p className="text-sm text-slate-500">{t.answers(n)}</p>
      )}

      {summary.kind === "grid" ? (
        <GridBody summary={summary} t={t} />
      ) : (
        <div className="space-y-2">
          {rows.map((row) => (
            <HBar key={row.label} label={row.label} value={row.count} max={max} right={`${row.count} · ${pct(row.count, n)}%`} />
          ))}
        </div>
      )}

      {seeAllHref && (
        <Link href={seeAllHref} className="text-sm text-blue-600 underline-offset-2 hover:underline">
          {t.seeAll}
        </Link>
      )}
    </Card>
  );
}
