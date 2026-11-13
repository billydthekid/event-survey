// app/super/events/[id]/report/page.tsx
"use client";
import { Suspense, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { ChevronLeft, Download, FileText } from "lucide-react";
import { useStore } from "@/lib/store";
import { useNow } from "@/lib/hooks/useNow";
import { Lang } from "@/types";
import { eventRange, formatTime, isToday } from "@/lib/utils/date";
import { registrationSlots } from "@/lib/utils/stats";
import { ageSummary, genderSummary, percent, summarizeQuestion } from "@/lib/utils/surveyStats";
import { LineChartCard } from "@/components/report/LineChartCard";
import { GenderCard } from "@/components/report/GenderCard";
import { AgeCard } from "@/components/report/AgeCard";
import { QuestionResultCard } from "@/components/report/QuestionResultCard";
import { ParticipantsTab } from "@/components/report/ParticipantsTab";
import { AnswersTab } from "@/components/report/AnswersTab";

// หน้า Report เจาะ Event (ส่วน ④) — /super/events/<id>/report · Figma 318:4925
// แท็บเก็บใน URL (?tab=overview|participants|survey|answers) → หน้า Survey ลิงก์มาที่แท็บ Survey ได้ตรงๆ
// ปุ่ม CSV / PDF แสดงไว้ ยังกดไม่ได้ (ตกลงไว้: Export ยังไม่ต้องทำ)
// TH / EN = เปลี่ยนภาษาคำถามและตัวเลือก (ข้อความอื่นยังเป็นไทย — ยังไม่มีระบบภาษากลาง)

const TABS = [
  { key: "overview", label: "Overview" },
  { key: "participants", label: "ผู้เข้าร่วม" },
  { key: "survey", label: "Survey" },
  { key: "answers", label: "คำตอบรายคน" },
] as const;
type TabKey = (typeof TABS)[number]["key"];

// การ์ดตัวเลข 1 ใบ
function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl bg-white p-5 shadow-sm">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-4xl font-bold">{value}</p>
      {sub && <p className="mt-2 text-xs text-slate-400">{sub}</p>}
    </div>
  );
}

function EventReport() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const event = useStore((s) => s.events.find((e) => e.id === id && e.status !== "deleted"));
  const allRegistrations = useStore((s) => s.registrations);   // ดึงทั้งก้อนแล้วค่อยกรอง (กัน render วน)
  const allResponses = useStore((s) => s.responses);
  const now = useNow();
  const [lang, setLang] = useState<Lang>("th");

  const tabParam = searchParams.get("tab");
  const tab: TabKey = TABS.some((t) => t.key === tabParam) ? (tabParam as TabKey) : "overview";

  if (!event) {
    return (
      <div className="mt-10 rounded-xl bg-white p-10 text-center shadow-sm">
        <p className="font-semibold">ไม่พบ Event นี้</p>
        <p className="mt-1 text-sm text-slate-500">อาจถูกลบไปแล้ว หรือลิงก์ไม่ถูกต้อง</p>
        <Link href="/super/report" className="mt-4 inline-block text-sm text-blue-600 hover:underline">
          ← กลับไปหน้า Report ทุก Event
        </Link>
      </div>
    );
  }

  // ---------- คิดตัวเลข ----------
  const registrations = allRegistrations.filter((r) => r.eventId === event.id);
  const responses = allResponses.filter((r) => r.eventId === event.id);
  const questions = event.survey ? [...event.survey.questions].sort((a, b) => a.order - b.order) : [];
  const range = eventRange(event);
  const slots = range ? registrationSlots(range, registrations, now) : null;
  const base = `/super/events/${event.id}/report`;
  // "ข้อมูลถึง 12:40 น. วันนี้" — วันงาน = วันนี้ → "วันนี้" · วันอื่นไม่ต้องบอกวัน
  const updated = `ข้อมูลถึง ${formatTime(now)} น.${isToday(event.date, now) ? " วันนี้" : ""} · อัปเดตอัตโนมัติ`;

  return (
    <div>
      {/* ---------- หัวข้อ ---------- */}
      <Link
        href={`/super/events/${event.id}/dashboard`}
        className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800"
      >
        <ChevronLeft size={16} /> {event.name.th}
      </Link>
      <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Report</h1>
          <p className="mt-2 text-sm text-slate-500" suppressHydrationWarning>{updated}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg bg-white p-1 text-xs shadow-sm">
            {(["th", "en"] as Lang[]).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={`rounded-md px-3 py-1.5 font-semibold ${lang === l ? "bg-slate-100" : "text-slate-400"}`}
              >
                {l.toUpperCase()}
              </button>
            ))}
          </div>
          <button disabled title="ยังไม่เปิดใช้" className="flex cursor-not-allowed items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-400 shadow-sm">
            <Download size={16} /> CSV
          </button>
          <button disabled title="ยังไม่เปิดใช้" className="flex cursor-not-allowed items-center gap-2 rounded-lg bg-blue-600/50 px-4 py-2 text-sm font-semibold text-white">
            <FileText size={16} /> PDF
          </button>
        </div>
      </div>

      {/* ---------- แท็บ ---------- */}
      <div className="mt-6 flex gap-6 border-b border-slate-200 text-sm">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={t.key === "overview" ? base : `${base}?tab=${t.key}`}
            scroll={false}
            className={`-mb-px border-b-2 px-1 pb-3 ${
              tab === t.key ? "border-blue-600 font-semibold text-blue-600" : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      <div className="mt-6">
        {/* ============ Overview ============ */}
        {tab === "overview" && (
          <>
            <div className="grid gap-4 md:grid-cols-3">
              <Stat label="ผู้ลงทะเบียนทั้งหมด" value={registrations.length.toLocaleString("th-TH")} />
              <Stat label="ผู้ตอบแบบสอบถาม" value={responses.length.toLocaleString("th-TH")} />
              <Stat
                label="Response rate"
                value={`${percent(responses.length, registrations.length)}%`}
                sub={`${responses.length} ÷ ${registrations.length}`}
              />
            </div>

            {/* กราฟเวลา + เพศ / อายุ (Figma 1180 : 420) */}
            <div className="mt-4 grid gap-4 xl:grid-cols-[1180fr_420fr]">
              <LineChartCard slots={slots} />
              <div className="grid gap-4">
                <GenderCard items={genderSummary(registrations)} />
                <AgeCard {...ageSummary(registrations)} />
              </div>
            </div>

            {/* 2 ข้อแรกของ Survey */}
            {questions.length === 0 ? (
              <div className="mt-4 rounded-xl bg-white p-8 text-center text-sm text-slate-400 shadow-sm">Event นี้ยังไม่มี Survey</div>
            ) : (
              <div className="mt-4 grid gap-4 xl:grid-cols-2">
                {questions.slice(0, 2).map((q, i) => (
                  <QuestionResultCard
                    key={q.id} no={i + 1} question={q} summary={summarizeQuestion(q, responses)} lang={lang}
                    footer={
                      i === 1 || questions.length === 1 ? (
                        <Link href={`${base}?tab=survey`} scroll={false} className="text-sm text-blue-600 underline">
                          ดูสรุปทุกข้อในแท็บ Survey
                        </Link>
                      ) : undefined
                    }
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* ============ ผู้เข้าร่วม ============ */}
        {tab === "participants" && <ParticipantsTab registrations={registrations} responses={responses} />}

        {/* ============ Survey (ทุกข้อ) ============ */}
        {tab === "survey" &&
          (questions.length === 0 ? (
            <div className="rounded-xl bg-white p-8 text-center text-sm text-slate-400 shadow-sm">Event นี้ยังไม่มี Survey</div>
          ) : (
            <div className="grid gap-4 xl:grid-cols-2">
              {questions.map((q, i) => (
                <QuestionResultCard key={q.id} no={i + 1} question={q} summary={summarizeQuestion(q, responses)} lang={lang} />
              ))}
            </div>
          ))}

        {/* ============ คำตอบรายคน ============ */}
        {tab === "answers" && (
          <AnswersTab questions={questions} registrations={registrations} responses={responses} lang={lang} />
        )}
      </div>
    </div>
  );
}

// ครอบ <Suspense>: useParams / useSearchParams / useNow ต้องรอตอนเปิดหน้าจริง (cacheComponents)
export default function EventReportPage() {
  return (
    <Suspense fallback={null}>
      <EventReport />
    </Suspense>
  );
}
