// app/(public)/s/[code]/SurveyView.tsx
// หน้าแบบประเมินของผู้เข้าร่วม (มือถือ ไม่ต้อง login) — ดีไซน์ตาม Figma
//   B1 แบบประเมิน (แถบความคืบหน้า + คำถาม 7 ประเภท + validation) · B2 ส่งสำเร็จ
//   + ยังไม่เปิดให้ตอบ / ปิดรับคำตอบแล้ว / งานนี้ไม่มีแบบประเมิน / ไม่พบ Event
// ตอบซ้ำได้ ไม่ดักข้อมูลซ้ำ (ตาม scope)
"use client";
import { use, useState } from "react";
import { CircleCheck, Clock, FileQuestion, Lock, Search } from "lucide-react";
import type { Lang } from "@/types";
import { useStore } from "@/lib/store";
import { useWizardStore } from "@/lib/wizard-store";
import { useNow } from "@/lib/hooks/useNow";
import {
  PublicQuestion,
  buildPublicEvent,
  findPublicEvent,
  getSurveyPhase,
  pick,
  surveyOpensAt,
} from "@/lib/public-event";
import {
  Countdown,
  EventInfo,
  Palette,
  PrimaryButton,
  PublicLoading,
  PublicShell,
  StateMessage,
  fmtDateTime,
  palette,
  usePublicLang,
} from "@/components/public/public-ui";
import {
  ChoiceList,
  ErrorText,
  FieldLabel,
  FormAlert,
  RatingScale,
  SelectInput,
  TextArea,
  TextInput,
} from "@/components/public/form-controls";

// ============ ข้อความ 2 ภาษา ============
const TEXT = {
  th: {
    chip: "แบบประเมิน",
    meta: (min: number, done: number, total: number) => `ใช้เวลาประมาณ ${min} นาที · ตอบแล้ว ${done} จาก ${total} ข้อบังคับ`,
    metaNoRequired: (min: number) => `ใช้เวลาประมาณ ${min} นาที`,
    multiNote: "เลือกได้หลายข้อ",
    optional: "ไม่บังคับ",
    submit: "ส่งแบบประเมิน",
    alert: (n: number) => `ยังไม่ได้ตอบ ${n} ข้อบังคับ`,
    required: "กรุณาตอบข้อนี้",
    ph: { short: "พิมพ์คำตอบสั้น ๆ", long: "พิมพ์คำตอบที่นี่", select: "เลือกคำตอบ" },
    rating: { min: "น้อยที่สุด", max: "มากที่สุด" },
    untitled: "(คำถาม)",
    doneTitle: "ขอบคุณสำหรับความคิดเห็น",
    doneSub: "คำตอบของคุณถูกบันทึกแล้ว",
    closeHint: "ปิดหน้านี้ได้เลย",
    notOpenTitle: "แบบประเมินยังไม่เปิด",
    notOpenAt: (d: string) => `เปิดให้ตอบ ${d}`,
    notOpenSub: "กลับมาสแกนอีกครั้งเมื่อถึงเวลา",
    closedTitle: "ปิดรับคำตอบแล้ว",
    closedAt: (d: string) => `ปิดรับเมื่อ ${d}`,
    closedSub: "ขอบคุณที่ให้ความสนใจ",
    noneTitle: "งานนี้ไม่มีแบบประเมิน",
    noneSub: "ขอบคุณที่มาร่วมงาน",
    notFoundTitle: "ไม่พบ Event นี้",
    notFoundSub: "QR หรือลิงก์อาจไม่ถูกต้อง หรือ Event ถูกยกเลิก",
    notFoundSub2: "ลองสแกน QR ที่จอ Kiosk อีกครั้ง",
  },
  en: {
    chip: "Survey",
    meta: (min: number, done: number, total: number) => `About ${min} min · ${done} of ${total} required answered`,
    metaNoRequired: (min: number) => `About ${min} min`,
    multiNote: "Select all that apply",
    optional: "Optional",
    submit: "Submit survey",
    alert: (n: number) => `${n} required question${n > 1 ? "s" : ""} not answered`,
    required: "Please answer this question",
    ph: { short: "Short answer", long: "Type your answer here", select: "Select an answer" },
    rating: { min: "Lowest", max: "Highest" },
    untitled: "(Question)",
    doneTitle: "Thanks for your feedback",
    doneSub: "Your answers have been saved",
    closeHint: "You can close this page now",
    notOpenTitle: "The survey isn't open yet",
    notOpenAt: (d: string) => `Opens ${d}`,
    notOpenSub: "Please scan again when it opens",
    closedTitle: "The survey is closed",
    closedAt: (d: string) => `Closed ${d}`,
    closedSub: "Thank you for your interest",
    noneTitle: "This event has no survey",
    noneSub: "Thank you for joining",
    notFoundTitle: "Event not found",
    notFoundSub: "The QR or link may be wrong, or the event was cancelled",
    notFoundSub2: "Try scanning the QR on the Kiosk again",
  },
};
type Text = (typeof TEXT)["th"];
type Answer = string | string[] | number;
type Answers = Record<string, Answer>;

const answered = (v: Answer | undefined) =>
  v !== undefined && (typeof v === "number" || (Array.isArray(v) ? v.length > 0 : v.trim() !== ""));

// ============ ส่วนหลัก ============
export function SurveyView({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  const [lang, setLang] = usePublicLang();
  const t = TEXT[lang];

  const hydrated = useStore((s) => s.hydrated);
  const event = useStore((s) => findPublicEvent(s.events, code));
  const draft = useWizardStore((s) => (event ? s.drafts[event.id] : undefined));
  const submitSurveyResponse = useStore((s) => s.submitSurveyResponse);
  const now = useNow(30_000);

  const [answers, setAnswers] = useState<Answers>({});
  const [tried, setTried] = useState(false); // กดส่งแล้ว → แสดง error ของข้อที่ยังไม่ตอบ
  const [done, setDone] = useState(false);

  if (!hydrated) return <PublicLoading />;

  if (!event) {
    const pal = palette(null);
    return (
      <PublicShell event={null} pal={pal} lang={lang} setLang={setLang}>
        <StateMessage icon={Search} tone="slate" pal={pal} title={t.notFoundTitle} lines={[t.notFoundSub, t.notFoundSub2]} />
      </PublicShell>
    );
  }

  const e = buildPublicEvent(event, draft);
  const pal = palette(e);
  const qs = e.survey.questions;
  const required = qs.filter((q) => q.required);
  const requiredDone = required.filter((q) => answered(answers[q.id])).length;
  const allDone = qs.filter((q) => answered(answers[q.id])).length;
  // แถบความคืบหน้า: นับข้อบังคับ (ไม่มีข้อบังคับ → นับทุกข้อ)
  const progress = required.length > 0 ? requiredDone / required.length : qs.length > 0 ? allDone / qs.length : 0;

  // B2 ส่งสำเร็จ
  if (done) {
    return (
      <PublicShell event={e} pal={pal} lang={lang} setLang={setLang} progress={1}>
        <StateMessage icon={CircleCheck} tone="green" pal={pal} title={t.doneTitle} lines={[t.doneSub]}>
          <p className="mt-auto pt-10 text-xs" style={{ color: pal.muted }}>
            {t.closeHint}
          </p>
        </StateMessage>
      </PublicShell>
    );
  }

  const phase = getSurveyPhase(e, now);
  const info = <EventInfo event={e} pal={pal} lang={lang} chip={t.chip} />;
  const shell = (children: React.ReactNode, withProgress = false) => (
    <PublicShell event={e} pal={pal} lang={lang} setLang={setLang} progress={withProgress ? progress : undefined}>
      {children}
    </PublicShell>
  );

  if (phase === "none") {
    return shell(
      <>
        {info}
        <StateMessage icon={FileQuestion} tone="slate" pal={pal} title={t.noneTitle} lines={[t.noneSub]} />
      </>
    );
  }
  if (phase === "notOpen") {
    const opens = surveyOpensAt(e);
    return shell(
      <>
        {info}
        <StateMessage
          icon={Clock}
          tone="amber"
          pal={pal}
          title={t.notOpenTitle}
          lines={[opens ? t.notOpenAt(fmtDateTime(opens, lang)) : "", t.notOpenSub]}
        >
          <Countdown to={opens} lang={lang} pal={pal} />
        </StateMessage>
      </>
    );
  }
  if (phase === "closed") {
    return shell(
      <>
        {info}
        <StateMessage icon={Lock} tone="slate" pal={pal} title={t.closedTitle} lines={[t.closedAt(fmtDateTime(e.surveyClose, lang)), t.closedSub]} />
      </>
    );
  }

  // ---------- แบบประเมิน (B1) ----------
  const missing = tried ? required.filter((q) => !answered(answers[q.id])) : [];
  const minutes = Math.max(1, Math.round(qs.length * 0.7)); // สูตรเดียวกับหน้า Survey Builder

  const setAnswer = (id: string, v: Answer) => setAnswers((a) => ({ ...a, [id]: v }));

  const handleSubmit = (ev: React.FormEvent) => {
    ev.preventDefault();
    setTried(true);
    const firstMissing = required.find((q) => !answered(answers[q.id]));
    if (firstMissing) {
      const el = document.getElementById(`q-${firstMissing.id}`);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    // บันทึกเฉพาะข้อที่ตอบ / ข้อความตัดช่องว่างหัว-ท้าย
    const clean: Answers = {};
    for (const q of qs) {
      const v = answers[q.id];
      if (answered(v)) clean[q.id] = typeof v === "string" ? v.trim() : v!;
    }
    submitSurveyResponse(e.id, clean);
    setDone(true);
    window.scrollTo({ top: 0 });
  };

  return shell(
    <>
      <EventInfo
        event={e}
        pal={pal}
        lang={lang}
        chip={t.chip}
        extra={<span className="text-xs">{required.length > 0 ? t.meta(minutes, requiredDone, required.length) : t.metaNoRequired(minutes)}</span>}
      />
      <form noValidate onSubmit={handleSubmit} className="flex flex-1 flex-col px-5 pt-5 pb-8">
        {missing.length > 0 && (
          <div className="mb-2">
            <FormAlert text={t.alert(missing.length)} />
          </div>
        )}
        <div className="divide-y" style={{ borderColor: pal.line }}>
          {qs.map((q, i) => (
            <QuestionInput
              key={q.id}
              q={q}
              index={i + 1}
              value={answers[q.id]}
              error={missing.some((m) => m.id === q.id) ? t.required : undefined}
              onChange={(v) => setAnswer(q.id, v)}
              pal={pal}
              lang={lang}
              t={t}
            />
          ))}
        </div>
        <PrimaryButton pal={pal} type="submit" className="mt-6 w-full">
          {t.submit}
        </PrimaryButton>
      </form>
    </>,
    true
  );
}

// ============ คำถาม 1 ข้อ (เลือกช่องตอบตามประเภท) ============
function QuestionInput({
  q,
  index,
  value,
  error,
  onChange,
  pal,
  lang,
  t,
}: {
  q: PublicQuestion;
  index: number;
  value: Answer | undefined;
  error?: string;
  onChange: (v: Answer) => void;
  pal: Palette;
  lang: Lang;
  t: Text;
}) {
  const inputId = `qi-${q.id}`;
  const errId = `qe-${q.id}`;
  const title = pick(q.title, lang) || t.untitled;
  const str = typeof value === "string" ? value : "";
  // เก็บค่าเป็นข้อความไทยของตัวเลือก (หน้า Report นับคำตอบจาก .th)
  const options = q.options.map((o) => ({ value: o.th, label: pick(o, lang) }));
  const isTextInput = q.type === "short" || q.type === "long" || q.type === "date" || q.type === "dropdown";

  let control: React.ReactNode;
  switch (q.type) {
    case "rating":
      control = (
        <RatingScale
          pal={pal}
          error={error}
          value={typeof value === "number" ? value : undefined}
          onChange={onChange}
          minLabel={q.ratingLabels ? pick(q.ratingLabels.min, lang) : t.rating.min}
          maxLabel={q.ratingLabels ? pick(q.ratingLabels.max, lang) : t.rating.max}
          label={title}
          max={q.ratingMax}
          variant={q.ratingStyle}
        />
      );
      break;
    case "single":
    case "multi":
      control = (
        <ChoiceList
          pal={pal}
          error={error}
          options={options}
          multiple={q.type === "multi"}
          value={Array.isArray(value) ? value : str}
          onChange={onChange}
          label={title}
        />
      );
      break;
    case "dropdown":
      control = (
        <SelectInput id={inputId} pal={pal} error={error} placeholder={t.ph.select} options={options} value={str} onChange={onChange} describedBy={error ? errId : undefined} />
      );
      break;
    case "long":
      control = <TextArea id={inputId} pal={pal} error={error} value={str} onChange={(ev) => onChange(ev.target.value)} placeholder={t.ph.long} aria-describedby={error ? errId : undefined} />;
      break;
    case "date":
      control = <TextInput id={inputId} type="date" pal={pal} error={error} value={str} onChange={(ev) => onChange(ev.target.value)} aria-describedby={error ? errId : undefined} />;
      break;
    default:
      control = <TextInput id={inputId} pal={pal} error={error} value={str} onChange={(ev) => onChange(ev.target.value)} placeholder={t.ph.short} aria-describedby={error ? errId : undefined} />;
  }

  return (
    <div id={`q-${q.id}`} className="scroll-mt-24 py-5" style={{ borderColor: pal.line }}>
      <FieldLabel
        htmlFor={isTextInput ? inputId : undefined}
        number={index}
        label={title}
        required={q.required}
        note={q.type === "multi" ? t.multiNote : q.required ? undefined : t.optional}
        pal={pal}
      />
      {control}
      <ErrorText id={errId} error={error} />
    </div>
  );
}
