// app/super/events/[id]/survey/page.tsx
"use client";
import { Suspense, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ClipboardList, Lock, Pencil } from "lucide-react";
import { useStore } from "@/lib/store";
import { isEditLocked } from "@/lib/utils/eventInfo";
import { QTYPE_LABEL, shortSummary, summarizeQuestion } from "@/lib/utils/surveyStats";
import { SurveyPreviewModal } from "@/components/report/SurveyPreviewModal";

// หน้า Survey (สรุป) เจาะ Event (ส่วน ④) — /super/events/<id>/survey · Figma 318:5780
// คำถามอยู่ใน event.survey (ข้อมูลตัวอย่างจาก lib/mock/responses.ts) · คำตอบอยู่ใน store.responses
// ปุ่ม "แก้ไข Survey" กดไม่ได้ (เหตุผลเดียวกับปุ่มแก้ไขหน้า Event — Survey Builder อยู่ฝั่งผู้จัดงาน /admin)

// การ์ดตัวเลข 1 ใบ (หัวเล็ก + ค่าตัวใหญ่)
function Stat({ label, value, tone = "" }: { label: string; value: string; tone?: string }) {
  return (
    <div className="rounded-xl bg-white p-5 shadow-sm">
      <p className="text-sm text-slate-500">{label}</p>
      <p className={`mt-2 text-3xl font-bold ${tone}`}>{value}</p>
    </div>
  );
}

function EventSurvey() {
  const { id } = useParams<{ id: string }>();
  const event = useStore((s) => s.events.find((e) => e.id === id && e.status !== "deleted"));
  const allResponses = useStore((s) => s.responses);   // ดึงทั้งก้อนแล้วค่อยกรอง (กัน render วน)
  const [preview, setPreview] = useState(false);

  if (!event) {
    return (
      <div className="mt-10 rounded-xl bg-white p-10 text-center shadow-sm">
        <p className="font-semibold">ไม่พบ Event นี้</p>
        <p className="mt-1 text-sm text-slate-500">อาจถูกลบไปแล้ว หรือลิงก์ไม่ถูกต้อง</p>
        <Link href="/super/survey" className="mt-4 inline-block text-sm text-blue-600 hover:underline">
          ← กลับไปหน้า Survey ทุก Event
        </Link>
      </div>
    );
  }

  const survey = event.survey;
  const locked = isEditLocked(event);
  const responses = allResponses.filter((r) => r.eventId === event.id);
  const questions = survey ? [...survey.questions].sort((a, b) => a.order - b.order) : [];
  // ภาษา: ทุกข้อมีภาษาอังกฤษ → "TH · EN"
  const hasEn = questions.length > 0 && questions.every((q) => !!q.title.en);

  return (
    <div>
      {/* ---------- หัวข้อ + ปุ่ม ---------- */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Survey</h1>
          <p className="mt-2 text-sm text-slate-500">แบบสอบถามของ {event.name.th} · 1 Event มีได้ 1 Survey</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setPreview(true)}
            disabled={!survey}
            className="rounded-lg bg-white px-4 py-2 text-sm font-semibold shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400"
          >
            Preview มือถือ
          </button>
          <button
            disabled
            title={locked ? "Event เริ่มแล้ว แก้ Survey ไม่ได้" : "รอเชื่อมกับหน้าสร้าง Survey ของผู้จัดงาน"}
            className="flex cursor-not-allowed items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm text-slate-400 shadow-sm"
          >
            {locked ? <Lock size={16} /> : <Pencil size={16} />} แก้ไข Survey
          </button>
        </div>
      </div>

      {/* ---------- แถบแจ้งล็อก ---------- */}
      {locked && survey && (
        <div className="mt-6 flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50/60 px-5 py-3 text-sm text-slate-600">
          <Lock size={16} className="mt-0.5 shrink-0 text-blue-600" />
          <p>Event นี้เริ่มแล้ว Survey จึงถูกล็อก แก้คำถามไม่ได้ เพื่อให้คำตอบที่เก็บไปแล้วตรงกัน · ยังดูผลและ Export ได้</p>
        </div>
      )}

      {!survey ? (
        // ---------- ยังไม่มี Survey ----------
        <div className="mt-6 rounded-xl bg-white p-10 text-center shadow-sm">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <ClipboardList size={22} />
          </span>
          <p className="mt-3 font-semibold">ยังไม่มี Survey</p>
          <p className="mt-1 text-sm text-slate-500">ผู้จัดงานสร้าง Survey ได้ในหน้าแก้ไข Event (1 Event มีได้ 1 Survey)</p>
        </div>
      ) : (
        <>
          {/* ---------- ตัวเลข 4 ใบ ---------- */}
          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Stat
              label="สถานะ"
              value={survey.enabled ? "เปิดใช้" : "ปิดอยู่"}
              tone={survey.enabled ? "text-green-600" : "text-slate-400"}
            />
            <Stat label="จำนวนคำถาม" value={questions.length.toLocaleString("th-TH")} />
            <Stat label="คำตอบ" value={responses.length.toLocaleString("th-TH")} />
            <Stat label="ภาษา" value={hasEn ? "TH · EN" : "TH"} />
          </div>

          {/* ---------- รายการคำถาม ---------- */}
          <div className="mt-4 rounded-xl bg-white shadow-sm">
            <div className="flex items-center justify-between px-5 py-4">
              <h2 className="text-lg font-bold">คำถาม</h2>
              <Link href={`/super/events/${event.id}/report?tab=survey`} className="text-sm text-blue-600 underline">
                ดูผลทุกข้อใน Report
              </Link>
            </div>
            <ul>
              {questions.map((q, i) => (
                <li key={q.id} className="flex items-center gap-4 border-t border-slate-100 px-5 py-4">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-sm font-semibold text-blue-600">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{q.title.th}</p>
                    <p className="text-xs text-slate-500">
                      {QTYPE_LABEL[q.type]} · {q.required ? "บังคับตอบ" : "ไม่บังคับ"}
                    </p>
                  </div>
                  <span className="shrink-0 text-sm text-slate-600">
                    {shortSummary(summarizeQuestion(q, responses), "th")}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}

      {preview && survey && (
        <SurveyPreviewModal survey={survey} primary={event.theme.primary} onClose={() => setPreview(false)} />
      )}
    </div>
  );
}

// ครอบ <Suspense>: useParams ต้องรอตอนเปิดหน้าจริง (cacheComponents)
export default function EventSurveyPage() {
  return (
    <Suspense fallback={null}>
      <EventSurvey />
    </Suspense>
  );
}
