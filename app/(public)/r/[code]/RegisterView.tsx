// app/(public)/r/[code]/RegisterView.tsx
// หน้าลงทะเบียนของผู้เข้าร่วม (มือถือ ไม่ต้อง login) — ดีไซน์ตาม Figma
//   A5 ฟอร์มครบทุก field · A2 กรอกไม่ครบ · A4 ลงทะเบียนสำเร็จ
//   C1 ยังไม่เปิดรับ · C2 ปิดรับแล้ว · C3 ที่นั่งเต็ม · C4 ไม่พบ Event
// กรอกซ้ำได้ ไม่ดักข้อมูลซ้ำ (ตาม scope) — กดส่งแล้วจบ
"use client";
import { use, useState } from "react";
import { CircleCheck, Clock, Lock, QrCode, Search, Users } from "lucide-react";
import type { Lang } from "@/types";
import { useStore } from "@/lib/store";
import { useWizardStore } from "@/lib/wizard-store";
import { useNow } from "@/lib/hooks/useNow";
import { isActive, isAllowed } from "@/lib/allow-list";
import {
  GENDER_OPTIONS,
  PublicEvent,
  PublicField,
  buildPublicEvent,
  findPublicEvent,
  getRegisterPhase,
  pick,
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
  Segmented,
  SelectInput,
  TextArea,
  TextInput,
} from "@/components/public/form-controls";

// ============ ข้อความ 2 ภาษา ============
const TEXT = {
  th: {
    chip: "ลงทะเบียนเข้าร่วม",
    submit: "ลงทะเบียน",
    optional: "ไม่บังคับ",
    alert: (n: number) => `กรอกข้อมูลไม่ครบ ${n} ช่อง`,
    needText: (l: string) => `กรอก${l}`,
    needChoice: (l: string) => `เลือก${l}`,
    badEmail: "รูปแบบอีเมลไม่ถูกต้อง",
    badPhone: "เบอร์โทรต้องเป็นตัวเลข 9–10 หลัก",
    badAge: "อายุต้องเป็นตัวเลข 1–120",
    badNumber: "กรอกเป็นตัวเลขเท่านั้น",
    notAllowed: "ไม่พบข้อมูลนี้ในรายชื่อผู้มีสิทธิ์ลงทะเบียน (Event ปิด)",
    ph: {
      name: "เช่น สมชาย ใจดี",
      email: "name@email.com",
      phone: "0X-XXX-XXXX",
      age: "เช่น 20",
      idno: "รหัสนักศึกษา / รหัสพนักงาน",
      text: "พิมพ์คำตอบ",
      select: "เลือกคำตอบ",
    },
    yrs: "ปี",
    // A4
    doneTitle: "ลงทะเบียนสำเร็จ",
    doneSub: "แสดงหน้านี้ให้เจ้าหน้าที่ได้",
    rowName: "ชื่อ",
    rowEvent: "งาน",
    rowTime: "เวลา",
    surveyHint: "อย่าลืมตอบแบบประเมิน",
    surveyHintSub: "สแกน QR แบบประเมินที่จอ Kiosk หลังจบงาน",
    closeHint: "ปิดหน้านี้ได้เลย",
    // C1–C4
    notOpenTitle: "ยังไม่เปิดรับลงทะเบียน",
    notOpenAt: (d: string) => `เปิดรับ ${d}`,
    notOpenSub: "กลับมาสแกนอีกครั้งเมื่อถึงเวลา",
    closedTitle: "ปิดรับลงทะเบียนแล้ว",
    closedAt: (d: string) => `ปิดรับเมื่อ ${d}`,
    closedSub: "ขอบคุณที่ให้ความสนใจ",
    fullTitle: "ที่นั่งเต็มแล้ว",
    fullSub: (n: number) => `รับครบ ${n} / ${n} คนแล้ว`,
    contact: (e: string) => `ติดต่อสอบถาม: ${e}`,
    notFoundTitle: "ไม่พบ Event นี้",
    notFoundSub: "QR หรือลิงก์อาจไม่ถูกต้อง หรือ Event ถูกยกเลิก",
    notFoundSub2: "ลองสแกน QR ที่จอ Kiosk อีกครั้ง",
  },
  en: {
    chip: "Registration",
    submit: "Register",
    optional: "Optional",
    alert: (n: number) => `${n} field${n > 1 ? "s" : ""} need${n > 1 ? "" : "s"} your attention`,
    needText: (l: string) => `Please enter ${l.toLowerCase()}`,
    needChoice: (l: string) => `Please select ${l.toLowerCase()}`,
    badEmail: "Invalid email format",
    badPhone: "Phone number must be 9–10 digits",
    badAge: "Age must be a number from 1 to 120",
    badNumber: "Numbers only",
    notAllowed: "Not on the list of invited attendees (closed event)",
    ph: {
      name: "e.g. John Smith",
      email: "name@email.com",
      phone: "0X-XXX-XXXX",
      age: "e.g. 20",
      idno: "Student / employee ID",
      text: "Your answer",
      select: "Select an answer",
    },
    yrs: "yrs",
    doneTitle: "You're registered",
    doneSub: "Show this screen to the staff",
    rowName: "Name",
    rowEvent: "Event",
    rowTime: "Time",
    surveyHint: "Don't forget the survey",
    surveyHintSub: "Scan the survey QR on the Kiosk after the event",
    closeHint: "You can close this page now",
    notOpenTitle: "Registration isn't open yet",
    notOpenAt: (d: string) => `Opens ${d}`,
    notOpenSub: "Please scan again when it opens",
    closedTitle: "Registration is closed",
    closedAt: (d: string) => `Closed ${d}`,
    closedSub: "Thank you for your interest",
    fullTitle: "This event is full",
    fullSub: (n: number) => `All ${n} / ${n} seats are taken`,
    contact: (e: string) => `Contact: ${e}`,
    notFoundTitle: "Event not found",
    notFoundSub: "The QR or link may be wrong, or the event was cancelled",
    notFoundSub2: "Try scanning the QR on the Kiosk again",
  },
};
type Text = (typeof TEXT)["th"];
type Values = Record<string, string | string[]>;

// ============ ตรวจค่าแต่ละช่อง ============
const isChoice = (f: PublicField) =>
  f.type === "gender" || ((f.type === "dropdown" || f.type === "multi") && f.options.length > 0);

// เก็บแค่ "ชนิดของ error" แล้วค่อยแปลเป็นข้อความตอนแสดง → สลับ TH/EN แล้วข้อความเปลี่ยนตามทันที
type ErrorKind = "required" | "badEmail" | "badPhone" | "badAge" | "badNumber" | "notAllowed";

function validate(f: PublicField, raw: string | string[] | undefined): ErrorKind | undefined {
  const v = Array.isArray(raw) ? raw : (raw ?? "").trim();
  if (v.length === 0) return f.required ? "required" : undefined;
  if (Array.isArray(v)) return undefined;
  if (f.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return "badEmail";
  if (f.type === "phone" && !/^0\d{8,9}$/.test(v.replace(/[\s-]/g, ""))) return "badPhone";
  if (f.type === "age" && !(/^\d+$/.test(v) && Number(v) >= 1 && Number(v) <= 120)) return "badAge";
  if (f.type === "number" && !/^\d+$/.test(v)) return "badNumber";
  return undefined;
}

function errorMessage(f: PublicField, kind: ErrorKind, lang: Lang, t: Text): string {
  if (kind !== "required") return t[kind];
  const label = pick(f.label, lang);
  return isChoice(f) ? t.needChoice(label) : t.needText(label);
}

// ============ ส่วนหลัก ============
export function RegisterView({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  const [lang, setLang] = usePublicLang();
  const t = TEXT[lang];

  const hydrated = useStore((s) => s.hydrated);
  const event = useStore((s) => findPublicEvent(s.events, code));
  const registeredCount = useStore((s) => (event ? s.registrations.filter((r) => r.eventId === event.id).length : 0));
  const draft = useWizardStore((s) => (event ? s.drafts[event.id] : undefined));
  const submitRegistration = useStore((s) => s.submitRegistration);
  const now = useNow(30_000); // ตรวจช่วงเวลาเปิด-ปิดซ้ำทุก 30 วินาที

  const [values, setValues] = useState<Values>({});
  const [errors, setErrors] = useState<Record<string, ErrorKind>>({});
  const [tried, setTried] = useState(false); // กดส่งไปแล้วอย่างน้อย 1 ครั้ง → ตรวจสดขณะพิมพ์
  const [done, setDone] = useState<{ name: string; at: string } | null>(null);

  if (!hydrated) return <PublicLoading />;

  // C4 ไม่พบ Event (รหัสผิด / ฉบับร่าง / ถูกลบ)
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
  const shell = (children: React.ReactNode) => (
    <PublicShell event={e} pal={pal} lang={lang} setLang={setLang}>
      {children}
    </PublicShell>
  );

  // A4 ลงทะเบียนสำเร็จ
  if (done) {
    return shell(<Success e={e} pal={pal} lang={lang} t={t} name={done.name} at={done.at} />);
  }

  const phase = getRegisterPhase(e, now, registeredCount);
  const info = <EventInfo event={e} pal={pal} lang={lang} chip={t.chip} />;

  if (phase === "notOpen") {
    return shell(
      <>
        {info}
        <StateMessage icon={Clock} tone="amber" pal={pal} title={t.notOpenTitle} lines={[t.notOpenAt(fmtDateTime(e.regOpen, lang)), t.notOpenSub]}>
          <Countdown to={e.regOpen} lang={lang} pal={pal} />
        </StateMessage>
      </>
    );
  }
  if (phase === "closed") {
    return shell(
      <>
        {info}
        <StateMessage
          icon={Lock}
          tone="slate"
          pal={pal}
          title={t.closedTitle}
          lines={[e.regClose ? t.closedAt(fmtDateTime(e.regClose, lang)) : "", t.closedSub]}
        />
      </>
    );
  }
  if (phase === "full") {
    return shell(
      <>
        {info}
        <StateMessage
          icon={Users}
          tone="blue"
          pal={pal}
          title={t.fullTitle}
          lines={[t.fullSub(e.maxAttendees), e.contactEmail ? t.contact(e.contactEmail) : ""]}
        />
      </>
    );
  }

  // ---------- ฟอร์ม (A5 / A2) ----------
  const checkAll = (vals: Values) => {
    const next: Record<string, ErrorKind> = {};
    for (const f of e.fields) {
      const err = validate(f, vals[f.key]);
      if (err) next[f.key] = err;
    }
    // Event ปิด: อีเมล/เบอร์ต้องอยู่ในรายชื่อที่ Organizer import ไว้ (lib/allow-list.ts)
    const allow = draft?.allowList;
    if (e.maxAttendees > 0 && isActive(allow) && !next[allow.kind]) {
      const v = vals[allow.kind];
      if (typeof v === "string" && !isAllowed(allow, v)) next[allow.kind] = "notAllowed";
    }
    return next;
  };

  const setValue = (key: string, v: string | string[]) => {
    const next = { ...values, [key]: v };
    setValues(next);
    if (tried) setErrors(checkAll(next)); // หลังกดส่งครั้งแรก error หายทันทีเมื่อแก้ถูก
  };

  const handleSubmit = (ev: React.FormEvent) => {
    ev.preventDefault();
    setTried(true);
    const errs = checkAll(values);
    setErrors(errs);
    const firstBad = e.fields.find((f) => errs[f.key]);
    if (firstBad) {
      // เลื่อนไปช่องแรกที่ผิด แล้วโฟกัส (ถ้าเป็นช่องพิมพ์)
      const el = document.getElementById(`field-${firstBad.id}`);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
      el?.querySelector<HTMLElement>("input, select, textarea")?.focus({ preventScroll: true });
      return;
    }
    // บันทึก: ตัดช่องว่างหัว-ท้าย / ไม่เก็บช่องที่ไม่ได้กรอก
    const answers: Values = {};
    for (const f of e.fields) {
      const v = values[f.key];
      if (Array.isArray(v) ? v.length > 0 : v?.trim()) answers[f.key] = Array.isArray(v) ? v : v!.trim();
    }
    const reg = submitRegistration(e.id, answers);
    setDone({ name: typeof answers.name === "string" ? answers.name : "", at: reg.createdAt });
    window.scrollTo({ top: 0 });
  };

  const errorCount = Object.keys(errors).length;

  return shell(
    <>
      {info}
      <form noValidate onSubmit={handleSubmit} className="flex flex-1 flex-col px-5 pt-5 pb-8">
        {errorCount > 0 && (
          <div className="mb-5">
            <FormAlert text={t.alert(errorCount)} />
          </div>
        )}
        <div className="space-y-5">
          {e.fields.map((f) => (
            <FieldInput
              key={f.id}
              f={f}
              value={values[f.key]}
              error={errors[f.key] ? errorMessage(f, errors[f.key], lang, t) : undefined}
              onChange={(v) => setValue(f.key, v)}
              pal={pal}
              lang={lang}
              t={t}
            />
          ))}
        </div>
        <PrimaryButton pal={pal} type="submit" className="mt-8 w-full">
          {t.submit}
        </PrimaryButton>
      </form>
    </>
  );
}

// ============ ช่องกรอก 1 ช่อง (เลือกชนิด input ตามประเภท field) ============
function FieldInput({
  f,
  value,
  error,
  onChange,
  pal,
  lang,
  t,
}: {
  f: PublicField;
  value: string | string[] | undefined;
  error?: string;
  onChange: (v: string | string[]) => void;
  pal: Palette;
  lang: Lang;
  t: Text;
}) {
  const inputId = `input-${f.id}`;
  const errId = `err-${f.id}`;
  const label = pick(f.label, lang);
  const str = typeof value === "string" ? value : "";
  const options = f.options.map((o) => ({ value: o.th, label: pick(o, lang) })); // เก็บค่าเป็นข้อความไทย (หน้า Report นับจาก .th)
  const common = {
    id: inputId,
    value: str,
    onChange: (ev: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChange(ev.target.value),
    "aria-describedby": error ? errId : undefined,
    pal,
    error,
  };

  let control: React.ReactNode;
  if (f.type === "gender") {
    const opts = GENDER_OPTIONS.map((g) => ({ value: g.value, label: pick(g.label, lang) }));
    control = <Segmented pal={pal} error={error} options={opts} value={str} onChange={onChange} label={label} />;
  } else if (f.type === "dropdown" && options.length > 0) {
    // ตัวเลือกน้อยและสั้น (เช่น S/M/L/XL) → ปุ่มเรียงแถว / นอกนั้น → dropdown
    const short = options.length <= 4 && options.every((o) => o.label.length <= 6);
    control = short ? (
      <Segmented pal={pal} error={error} options={options} value={str} onChange={onChange} label={label} />
    ) : (
      <SelectInput id={inputId} pal={pal} error={error} placeholder={t.ph.select} options={options} value={str} onChange={onChange} describedBy={error ? errId : undefined} />
    );
  } else if (f.type === "multi" && options.length > 0) {
    control = <ChoiceList pal={pal} error={error} options={options} multiple value={Array.isArray(value) ? value : []} onChange={onChange} label={label} />;
  } else if (f.type === "longtext") {
    control = <TextArea {...common} placeholder={t.ph.text} />;
  } else if (f.type === "date") {
    control = <TextInput {...common} type="date" />;
  } else if (f.type === "email") {
    control = <TextInput {...common} type="email" inputMode="email" autoComplete="email" placeholder={t.ph.email} />;
  } else if (f.type === "phone") {
    control = <TextInput {...common} type="tel" inputMode="tel" autoComplete="tel" placeholder={t.ph.phone} />;
  } else if (f.type === "age") {
    control = <TextInput {...common} inputMode="numeric" placeholder={t.ph.age} suffix={t.yrs} />;
  } else if (f.type === "number") {
    control = <TextInput {...common} inputMode="numeric" placeholder={t.ph.text} />;
  } else {
    // text / idno / dropdown-multi ที่ยังไม่มีตัวเลือก → พิมพ์ตอบ
    const ph = f.key === "name" ? t.ph.name : f.type === "idno" ? t.ph.idno : t.ph.text;
    control = <TextInput {...common} autoComplete={f.key === "name" ? "name" : undefined} placeholder={ph} />;
  }

  return (
    <div id={`field-${f.id}`} className="scroll-mt-24">
      <FieldLabel
        htmlFor={isChoice(f) ? undefined : inputId}
        label={label}
        required={f.required}
        note={f.required ? undefined : t.optional}
        pal={pal}
      />
      {control}
      <ErrorText id={errId} error={error} />
    </div>
  );
}

// ============ A4 ลงทะเบียนสำเร็จ ============
function Success({ e, pal, lang, t, name, at }: { e: PublicEvent; pal: Palette; lang: Lang; t: Text; name: string; at: string }) {
  const rows = [
    name && { label: t.rowName, value: name },
    { label: t.rowEvent, value: pick(e.name, lang) },
    { label: t.rowTime, value: fmtDateTime(at, lang) },
  ].filter(Boolean) as { label: string; value: string }[];

  return (
    <StateMessage icon={CircleCheck} tone="green" pal={pal} title={t.doneTitle} lines={[t.doneSub]}>
      <dl className="mt-6 w-full divide-y rounded-2xl border text-sm" style={{ borderColor: pal.line }}>
        {rows.map((r) => (
          <div key={r.label} className="flex justify-between gap-4 px-4 py-3" style={{ borderColor: pal.line }}>
            <dt style={{ color: pal.muted }}>{r.label}</dt>
            <dd className="min-w-0 text-right font-semibold break-words">{r.value}</dd>
          </div>
        ))}
      </dl>

      {e.survey.enabled && (
        <div className="mt-4 flex w-full items-start gap-3 rounded-2xl px-4 py-3.5 text-left" style={{ background: pal.soft }}>
          <QrCode className="mt-0.5 size-5 shrink-0" style={{ color: pal.primary }} />
          <div>
            <p className="text-sm font-semibold" style={{ color: pal.mode === "dark" ? "#FFFFFF" : pal.primary }}>
              {t.surveyHint}
            </p>
            <p className="mt-0.5 text-xs" style={{ color: pal.muted }}>
              {t.surveyHintSub}
            </p>
          </div>
        </div>
      )}

      <p className="mt-auto pt-10 text-xs" style={{ color: pal.muted }}>
        {t.closeHint}
      </p>
    </StateMessage>
  );
}
