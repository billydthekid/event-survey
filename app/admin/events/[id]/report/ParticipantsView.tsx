// app/admin/events/[id]/report/ParticipantsView.tsx
// แท็บ "ผู้เข้าร่วม" ของ Report (ต้นแบบ: docs/figma/reportjoin.png)
// การ์ด KPI 3 ใบ + ตารางผู้ลงทะเบียน (แท็บย่อย ทั้งหมด/ตอบแล้ว/ยังไม่ตอบ, ค้นหา, แบ่งหน้า 10 รายการ)
// อ่านข้อมูลผ่าน useReport() เท่านั้น — การคำนวณอยู่ใน people.ts (ไม่มี React)
"use client";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Lang } from "@/types";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useReport } from "./ReportShell";
import {
  buildParticipants, filterParticipants, maskPhone, pageNumbers, type ParticipantFilter,
} from "./people";

// ============ พจนานุกรมข้อความ 2 ภาษา ============
const TEXT = {
  th: {
    kpiTotal: "ลงทะเบียนทั้งหมด",
    kpiAnswered: "ตอบ Survey แล้ว",
    kpiNotAnswered: "ยังไม่ตอบ",
    people: (n: number) => `${n} คน`,
    filters: { all: "ทั้งหมด", answered: "ตอบแล้ว", notAnswered: "ยังไม่ตอบ" },
    search: "ค้นหาชื่อ เบอร์โทร หรือหน่วยงาน",
    cols: { time: "ลงทะเบียน", name: "ชื่อ – นามสกุล", age: "อายุ", gender: "เพศ", phone: "เบอร์โทร", faculty: "คณะ / หน่วยงาน", survey: "Survey" },
    genders: { male: "ชาย", female: "หญิง", unspecified: "ไม่ระบุ" } as Record<string, string>,
    answered: "ตอบแล้ว",
    notAnswered: "ยังไม่ตอบ",
    noRegs: "ยังไม่มีผู้ลงทะเบียน",
    noMatch: "ไม่พบผู้เข้าร่วมที่ตรงกับเงื่อนไข",
    // ไม่มีผลลัพธ์ (total = 0) → "แสดง 0 จาก 0 คน" แทน "แสดง 0–0 จาก 0 คน"
    showing: (from: number, to: number, total: number) =>
      total === 0 ? "แสดง 0 จาก 0 คน" : `แสดง ${from}–${to} จาก ${total} คน`,
    prev: "ก่อนหน้า",
    next: "ถัดไป",
    pageLabel: (p: number) => `หน้า ${p}`,
    phoneNote: "เบอร์โทรแสดงแบบปิดบังบางส่วน",
  },
  en: {
    kpiTotal: "Total registrations",
    kpiAnswered: "Survey responded",
    kpiNotAnswered: "Not yet responded",
    people: (n: number) => `${n} ${n === 1 ? "person" : "people"}`,
    filters: { all: "All", answered: "Responded", notAnswered: "Not yet" },
    search: "Search name, phone or organization",
    cols: { time: "Registered", name: "Full name", age: "Age", gender: "Gender", phone: "Phone", faculty: "Faculty / Organization", survey: "Survey" },
    genders: { male: "Male", female: "Female", unspecified: "Not specified" } as Record<string, string>,
    answered: "Responded",
    notAnswered: "Not yet",
    noRegs: "No registrations yet",
    noMatch: "No participants match your filters",
    showing: (from: number, to: number, total: number) =>
      total === 0 ? "Showing 0 of 0 people" : `Showing ${from}–${to} of ${total} people`,
    prev: "Previous",
    next: "Next",
    pageLabel: (p: number) => `Page ${p}`,
    phoneNote: "Phone numbers are partially hidden",
  },
};

const PAGE_SIZE = 10; // 10 รายการต่อหน้า (ตามรูป)
const FILTERS: ParticipantFilter[] = ["all", "answered", "notAnswered"];

// เวลา "12:38" จาก ISO (แบบเดียวกับ Dashboard)
function formatTime(iso: string, lang: Lang): string {
  return new Date(iso).toLocaleTimeString(lang === "th" ? "th-TH" : "en-GB", { hour: "2-digit", minute: "2-digit", hour12: false });
}

export function ParticipantsView() {
  const { data, lang } = useReport();
  const t = TEXT[lang];

  // รายชื่อทั้งหมด (เรียงใหม่สุดก่อน) — คำนวณใหม่เฉพาะเมื่อข้อมูลเปลี่ยน
  const all = useMemo(() => buildParticipants(data), [data]);
  const answeredCount = all.filter((p) => p.answered).length; // Workshop: 31
  const counts: Record<ParticipantFilter, number> = {
    all: all.length,                          // 46
    answered: answeredCount,                  // 31
    notAnswered: all.length - answeredCount,  // 15
  };

  // ----- state ของตาราง -----
  const [filter, setFilter] = useState<ParticipantFilter>("all");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  // เปลี่ยนแท็บย่อยหรือคำค้น → กลับไปหน้า 1 (ไม่งั้นอาจค้างอยู่หน้าที่ไม่มีแล้ว)
  const changeFilter = (f: ParticipantFilter) => { setFilter(f); setPage(1); };
  const changeQuery = (q: string) => { setQuery(q); setPage(1); };

  // ----- กรอง + แบ่งหน้า -----
  // ตัวอย่าง: ทั้งหมด 46 คน → 5 หน้า, หน้า 1 = คนที่ 1–10, หน้า 5 = คนที่ 41–46
  const filtered = filterParticipants(all, filter, query);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, totalPages);
  const start = (current - 1) * PAGE_SIZE;
  const rows = filtered.slice(start, start + PAGE_SIZE);

  return (
    // grid-cols-1 = minmax(0, 1fr): ไม่ให้ความกว้างของตาราง (ไม่ตัดบรรทัด) ดันทั้งหน้าให้กว้างเกินจอ
    // → ตารางเลื่อนซ้าย-ขวาอยู่ในการ์ดแทน
    <div className="grid grid-cols-1">
      {/* ===== การ์ด KPI 3 ใบ ===== */}
      <div className="grid gap-4 md:grid-cols-3">
        <KpiCard label={t.kpiTotal} value={t.people(counts.all)} />
        <KpiCard label={t.kpiAnswered} value={t.people(counts.answered)} tone="text-green-700" />
        <KpiCard label={t.kpiNotAnswered} value={t.people(counts.notAnswered)} tone="text-amber-700" />
      </div>

      {/* ===== การ์ดตาราง ===== */}
      <Card className="mt-4 gap-0 rounded-2xl py-0 ring-slate-200">
        {/* แถบบน: แท็บย่อย + ช่องค้นหา */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-5">
          <div className="inline-flex rounded-lg bg-slate-100 p-1" role="tablist">
            {FILTERS.map((f) => (
              <button
                key={f}
                type="button"
                role="tab"
                aria-selected={filter === f}
                onClick={() => changeFilter(f)}
                className={`rounded-md px-3 py-1.5 text-sm ${
                  filter === f ? "bg-white font-semibold shadow-sm" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {t.filters[f]} {counts[f]}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-80">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              value={query}
              onChange={(e) => changeQuery(e.target.value)}
              placeholder={t.search}
              aria-label={t.search}
              className="h-10 bg-white pl-9"
            />
          </div>
        </div>

        {/* ตาราง: ไม่ตัดบรรทัด (whitespace-nowrap) → จอแคบเลื่อนซ้าย-ขวาแทน */}
        <div className="overflow-x-auto">
          <table className="w-full whitespace-nowrap text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs font-semibold text-slate-600">
                <th className="px-5 py-3">{t.cols.time}</th>
                <th className="px-5 py-3">{t.cols.name}</th>
                <th className="px-5 py-3">{t.cols.age}</th>
                <th className="px-5 py-3">{t.cols.gender}</th>
                <th className="px-5 py-3">{t.cols.phone}</th>
                <th className="px-5 py-3">{t.cols.faculty}</th>
                <th className="px-5 py-3">{t.cols.survey}</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-slate-400">
                    {all.length === 0 ? t.noRegs : t.noMatch}
                  </td>
                </tr>
              ) : (
                rows.map((p) => (
                  <tr key={p.id} className="border-b border-slate-100 last:border-0">
                    <td className="px-5 py-3.5 text-slate-600">{formatTime(p.registeredAt, lang)}</td>
                    <td className="px-5 py-3.5 font-semibold">{p.name || "—"}</td>
                    <td className="px-5 py-3.5">{p.age || "—"}</td>
                    {/* ค่าเพศที่ไม่รู้จัก → แสดงค่าดิบ */}
                    <td className="px-5 py-3.5">{t.genders[p.gender] ?? (p.gender || "—")}</td>
                    {/* เบอร์ต้องผ่าน maskPhone เสมอ เช่น "0812344521" → "08X-XXX-4521" */}
                    <td className="px-5 py-3.5 tabular-nums">{maskPhone(p.phone)}</td>
                    <td className="px-5 py-3.5">{p.faculty || "—"}</td>
                    <td className="px-5 py-3.5">
                      {p.answered ? (
                        <span className="rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700">{t.answered}</span>
                      ) : (
                        <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700">{t.notAnswered}</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* ท้ายการ์ด: "แสดง 1–10 จาก 46 คน" + แบ่งหน้า */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-5 py-4">
          <p className="text-xs text-slate-500">
            {filtered.length === 0 ? t.showing(0, 0, 0) : t.showing(start + 1, start + rows.length, filtered.length)}
          </p>
          <Pager current={current} totalPages={totalPages} onChange={setPage} t={t} />
        </div>
      </Card>

      <p className="mt-3 text-xs text-slate-500">{t.phoneNote}</p>
    </div>
  );
}

// ============ การ์ด KPI 1 ใบ ============
// tone = สีตัวเลข (เขียว = ตอบแล้ว, ส้ม = ยังไม่ตอบ ตามรูป)
function KpiCard({ label, value, tone = "" }: { label: string; value: string; tone?: string }) {
  return (
    <Card className="gap-2 rounded-2xl px-5 ring-slate-200">
      <p className="text-xs text-slate-500">{label}</p>
      <p className={`text-3xl font-bold ${tone}`}>{value}</p>
    </Card>
  );
}

// ============ แถบแบ่งหน้า: [ก่อนหน้า] 1 2 … 5 [ถัดไป] ============
function Pager({
  current, totalPages, onChange, t,
}: { current: number; totalPages: number; onChange: (p: number) => void; t: (typeof TEXT)["th"] }) {
  const btn = "h-9 min-w-9 rounded-lg px-3 text-sm font-medium disabled:opacity-40";
  return (
    <nav className="flex items-center gap-1" aria-label="pagination">
      <button type="button" className={`${btn} border border-slate-200 bg-white`} disabled={current === 1} onClick={() => onChange(current - 1)}>
        {t.prev}
      </button>
      {pageNumbers(current, totalPages).map((p, i) =>
        p === "…" ? (
          <span key={`gap-${i}`} className="px-2 text-slate-400">…</span>
        ) : (
          <button
            key={p}
            type="button"
            aria-label={t.pageLabel(p)}
            aria-current={p === current ? "page" : undefined}
            onClick={() => onChange(p)}
            className={`${btn} ${p === current ? "bg-blue-50 text-blue-600" : "hover:bg-slate-50"}`}
          >
            {p}
          </button>
        )
      )}
      <button type="button" className={`${btn} border border-slate-200 bg-white`} disabled={current === totalPages} onClick={() => onChange(current + 1)}>
        {t.next}
      </button>
    </nav>
  );
}
