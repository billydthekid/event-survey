// app/admin/events/[id]/report/AnswersView.tsx
// แท็บ "คำตอบรายคน" ของ Report (ต้นแบบ: docs/figma/reportanswer.png)
// ซ้าย = รายการคำตอบ (ใหม่สุดก่อน, ค้นหาชื่อ, ดูเพิ่มเติม +5) | ขวา = คำตอบทุกข้อของคนที่เลือก (ปุ่ม ‹ ›)
// อ่านข้อมูลผ่าน useReport() เท่านั้น — การคำนวณอยู่ใน people.ts (ไม่มี React)
"use client";
import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useReport } from "./ReportShell";
import { tr } from "./summary";
import { buildAnswerEntries, formatAnswer, formatTime } from "./people";

// ============ พจนานุกรมข้อความ 2 ภาษา ============
const TEXT = {
  th: {
    search: "ค้นหาชื่อผู้ตอบ",
    answeredAt: (time: string) => `ตอบเมื่อ ${time}`,
    showing: (shown: number, total: number) => `แสดง ${shown} จาก ${total} คำตอบ`,
    more: (n: number) => `ดูเพิ่มเติม (+${n})`,
    // เช่น "คณะ IT · ลงทะเบียน 12:31 · ตอบ 14:52"
    meta: (faculty: string, reg: string, ans: string) =>
      [faculty, reg && `ลงทะเบียน ${reg}`, `ตอบ ${ans}`].filter(Boolean).join(" · "),
    questionLabel: (order: number, title: string) => `ข้อ ${order} · ${title}`,
    noAnswer: "ไม่ได้ตอบ",
    prev: "คำตอบก่อนหน้า",
    next: "คำตอบถัดไป",
    stars: (n: number) => `${n} ดาว`,
    noResponses: "ยังไม่มีคำตอบ",
    noMatch: "ไม่พบผู้ตอบที่ตรงกับคำค้น",
  },
  en: {
    search: "Search respondent name",
    answeredAt: (time: string) => `Answered at ${time}`,
    showing: (shown: number, total: number) => `Showing ${shown} of ${total} responses`,
    more: (n: number) => `Show more (+${n})`,
    meta: (faculty: string, reg: string, ans: string) =>
      [faculty, reg && `Registered ${reg}`, `Answered ${ans}`].filter(Boolean).join(" · "),
    questionLabel: (order: number, title: string) => `Q${order} · ${title}`,
    noAnswer: "No answer",
    prev: "Previous response",
    next: "Next response",
    stars: (n: number) => `${n} stars`,
    noResponses: "No responses yet",
    noMatch: "No respondents match your search",
  },
};

const FIRST_COUNT = 6; // แสดงตอนแรก 6 รายการ (ตามรูป)
const MORE_COUNT = 5;  // กด "ดูเพิ่มเติม" ทีละ 5

export function AnswersView() {
  const { data, lang } = useReport();
  const t = TEXT[lang];

  // คำตอบทั้งหมด เรียงตอบใหม่สุดก่อน + คำถามเรียงตามลำดับข้อ
  const entries = useMemo(() => buildAnswerEntries(data), [data]);
  const questions = useMemo(() => [...data.survey.questions].sort((a, b) => a.order - b.order), [data]);

  // ----- state -----
  const [query, setQuery] = useState("");
  const [visible, setVisible] = useState(FIRST_COUNT);            // จำนวนรายการที่แสดงในฝั่งซ้าย
  const [selectedId, setSelectedId] = useState<string | null>(null); // null = ยังไม่ได้เลือก → ใช้ตัวแรก

  // ค้นหาชื่อ (ไม่สนตัวพิมพ์เล็ก/ใหญ่) เปลี่ยนคำค้น → กลับไปแสดง 6 รายการแรก และเลือกคนแรกใหม่
  // (ถ้าไม่ล้างการเลือก คนที่เลือกไว้อาจอยู่ลำดับที่ 31 ซึ่งไม่อยู่ใน 6 รายการที่เห็น)
  const changeQuery = (q: string) => { setQuery(q); setVisible(FIRST_COUNT); setSelectedId(null); };
  const q = query.trim().toLowerCase();
  const filtered = q === "" ? entries : entries.filter((e) => e.name.toLowerCase().includes(q));
  const shown = filtered.slice(0, visible);

  // คนที่เลือก: ถ้าไม่ได้เลือก หรือคนที่เลือกถูกกรองออกไปแล้ว → ใช้คนแรกของรายการ
  // ตัวอย่าง: เลือก "ธีรภัทร" แล้วค้น "นภัส" → แผงขวาเปลี่ยนเป็นนภัสวรรณ (คนแรกที่เจอ)
  const foundIndex = filtered.findIndex((e) => e.id === selectedId);
  const index = foundIndex === -1 ? 0 : foundIndex;
  const selected = filtered[index] ?? null;

  // ปุ่ม ‹ ›: เลื่อนไปคนก่อน/ถัดไปในรายการที่ค้นอยู่
  // ถ้าคนถัดไปยังไม่แสดงในฝั่งซ้าย (เช่น อยู่ลำดับที่ 7 แต่แสดง 6) → ขยายรายการให้เห็นด้วย
  const goTo = (i: number) => {
    const target = filtered[i];
    if (!target) return;
    setSelectedId(target.id);
    if (i >= visible) setVisible(i + 1);
  };

  const remaining = filtered.length - shown.length; // ยังไม่แสดงอีกกี่รายการ

  return (
    // grid-cols-1 = minmax(0, 1fr): กันข้อความยาวดันทั้งหน้าให้กว้างเกินจอ
    // จอใหญ่ (lg): ซ้าย 3 ส่วน (กว้างอย่างน้อย 260px ชื่อจะได้ไม่ถูกตัด) : ขวา 8 ส่วน ตามสัดส่วนในรูป
    // จอเล็ก: ซ้อนบน-ล่าง
    <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(260px,3fr)_minmax(0,8fr)]">
      {/* ===== ซ้าย: รายการคำตอบ ===== */}
      <Card className="gap-0 overflow-hidden rounded-2xl py-0 ring-slate-200">
        <div className="relative p-3.5">
          <Search size={16} className="pointer-events-none absolute left-7 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            value={query}
            onChange={(e) => changeQuery(e.target.value)}
            placeholder={t.search}
            aria-label={t.search}
            className="h-10 bg-white pl-9"
          />
        </div>

        {shown.length === 0 ? (
          <p className="border-t border-slate-100 px-5 py-8 text-center text-sm text-slate-400">
            {entries.length === 0 ? t.noResponses : t.noMatch}
          </p>
        ) : (
          <ul>
            {shown.map((e) => {
              const active = e.id === selected?.id;
              return (
                <li key={e.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(e.id)}
                    aria-current={active || undefined}
                    // แถวที่เลือก: พื้นฟ้าอ่อน + เส้นซ้ายสีน้ำเงิน (ตามรูป)
                    className={`flex w-full items-start justify-between gap-3 border-t border-l-4 border-t-slate-100 px-4 py-3 text-left ${
                      active ? "border-l-blue-600 bg-blue-50" : "border-l-transparent hover:bg-slate-50"
                    }`}
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold">{e.name}</span>
                      <span className="block text-xs text-slate-500">{t.answeredAt(formatTime(e.answeredAt, lang))}</span>
                    </span>
                    {/* ดาว = คะแนนข้อ rating ข้อแรก (ข้ามหรือไม่มีข้อ rating → ไม่แสดง) */}
                    {e.stars !== null && (
                      <span className="shrink-0 text-sm font-semibold" aria-label={t.stars(e.stars)}>
                        {e.stars} ★
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        {/* ท้ายการ์ด: "แสดง 6 จาก 31 คำตอบ" + ดูเพิ่มเติม (+5) — แสดงครบแล้วซ่อนปุ่ม */}
        {filtered.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-4 py-3">
            <p className="text-xs text-slate-500">{t.showing(shown.length, filtered.length)}</p>
            {remaining > 0 && (
              <button
                type="button"
                onClick={() => setVisible((v) => v + MORE_COUNT)}
                className="whitespace-nowrap rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50"
              >
                {/* เหลือน้อยกว่า 5 → บอกจำนวนจริง เช่น เหลือ 1 → "(+1)" */}
                {t.more(Math.min(MORE_COUNT, remaining))}
              </button>
            )}
          </div>
        )}
      </Card>

      {/* ===== ขวา: รายละเอียดคำตอบของคนที่เลือก ===== */}
      {selected && (
        <Card className="gap-0 rounded-2xl py-0 ring-slate-200">
          <div className="flex items-start justify-between gap-3 px-5 py-5">
            <div className="min-w-0">
              <h2 className="truncate text-xl font-bold">{selected.name}</h2>
              <p className="mt-1 text-xs text-slate-500">
                {t.meta(
                  selected.faculty,
                  selected.registeredAt ? formatTime(selected.registeredAt, lang) : "",
                  formatTime(selected.answeredAt, lang)
                )}
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              <NavButton label={t.prev} disabled={index === 0} onClick={() => goTo(index - 1)}>
                <ChevronLeft size={16} />
              </NavButton>
              <NavButton label={t.next} disabled={index >= filtered.length - 1} onClick={() => goTo(index + 1)}>
                <ChevronRight size={16} />
              </NavButton>
            </div>
          </div>

          <ul>
            {questions.map((question) => {
              // ข้อที่ข้าม → null → แสดง "ไม่ได้ตอบ" สีเทา
              const answer = formatAnswer(question, selected.answers[question.id], lang);
              return (
                <li key={question.id} className="border-t border-slate-100 px-5 py-4">
                  <p className="text-xs text-slate-500">{t.questionLabel(question.order, tr(question.title, lang))}</p>
                  {answer === null ? (
                    <p className="mt-1 text-sm text-slate-400">{t.noAnswer}</p>
                  ) : (
                    // whitespace-pre-wrap + break-words: ข้อความยาวขึ้นบรรทัดใหม่ได้ ไม่ล้นการ์ด
                    <p className="mt-1 whitespace-pre-wrap break-words text-sm font-semibold">{answer}</p>
                  )}
                </li>
              );
            })}
          </ul>
        </Card>
      )}
    </div>
  );
}

// ============ ปุ่มสี่เหลี่ยม ‹ › ============
function NavButton({
  label, disabled, onClick, children,
}: { label: string; disabled: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="flex size-9 items-center justify-center rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40"
    >
      {children}
    </button>
  );
}
