// app/admin/events/[id]/report/ReportShell.tsx
// ส่วนที่ทุกแท็บของ Report ใช้ร่วมกัน: ด่านตรวจสิทธิ์ + ส่วนหัว + แถบแท็บ
// และแชร์ข้อมูล (event, ข้อมูลรายงาน, ภาษา) ให้แท็บลูกผ่าน React Context
"use client";
import { createContext, useContext, useState } from "react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { ChevronLeft, ShieldAlert, BarChart3 } from "lucide-react";
import { useStore } from "@/lib/store";
import { Event, Lang } from "@/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/toast";
import { useEventAccess } from "../eventAccess";
import { ReportData } from "./mockData";
import { ExportButtons } from "./ExportButtons";
import { isReportPrintPath } from "./printPath";

// ============ พจนานุกรมข้อความ 2 ภาษา ============
const TEXT = {
  th: {
    title: "Report",
    // เช่น "31 คำตอบ จากผู้ลงทะเบียน 46 คน · ข้อมูลถึง 23 ต.ค. 2569 15:00"
    summaryLine: (responses: number, regs: number, when: string) =>
      `${responses} คำตอบ จากผู้ลงทะเบียน ${regs} คน · ข้อมูลถึง ${when}`,
    tabs: { overview: "Overview", participants: "ผู้เข้าร่วม", survey: "Survey", answers: "คำตอบรายคน" },
    noData: "ยังไม่มีข้อมูลรายงาน",
    noDataHint: "รายงานจะมีข้อมูลเมื่อ Event เริ่มจัดงานแล้ว",
    notFound: "ไม่พบ Event / ไม่มีสิทธิ์",
    notFoundHint: "Event นี้ไม่มีอยู่ ถูกลบไปแล้ว หรือไม่ได้มอบหมายให้คุณดูแล",
    back: "กลับไป Event ของฉัน",
  },
  en: {
    title: "Report",
    summaryLine: (responses: number, regs: number, when: string) =>
      `${responses} responses from ${regs} registrations · Data as of ${when}`,
    tabs: { overview: "Overview", participants: "Participants", survey: "Survey", answers: "Responses" },
    noData: "No report data yet",
    noDataHint: "The report will have data once the event has started",
    notFound: "Event not found / No permission",
    notFoundHint: "This event doesn't exist, was deleted, or isn't assigned to you",
    back: "Back to My Events",
  },
};

// แท็บทั้ง 4 (path ต่อท้าย /report)
const TABS = [
  { key: "overview", path: "" },
  { key: "participants", path: "/participants" },
  { key: "survey", path: "/survey" },
  { key: "answers", path: "/answers" },
] as const;

// ============ Context: ให้แท็บลูกอ่าน event / ข้อมูล / ภาษา ได้โดยไม่ต้องอ่าน params ซ้ำ ============
interface ReportContextValue {
  event: Event;
  data: ReportData;
  lang: Lang;
  summaryText: string; // บรรทัดสรุปผู้ตอบ/ผู้ลงทะเบียน (หน้า print ใช้ซ้ำ)
}
const ReportContext = createContext<ReportContextValue | null>(null);

export function useReport(): ReportContextValue {
  const ctx = useContext(ReportContext);
  if (!ctx) throw new Error("useReport ต้องใช้ภายใน ReportShell");
  return ctx;
}

// ============ ส่วนหลัก ============
export function ReportShell({ children }: { children: React.ReactNode }) {
  // อ่าน id จาก URL ด้วย useParams() (ใน layout ใช้วิธีนี้แทน use(params) — ดูเหตุผลใน layout.tsx)
  const { id } = useParams<{ id: string }>(); // เช่น { id: "e-workshop" }

  // ด่านสิทธิ์ใช้ร่วมกับ Dashboard (กฎอยู่ใน ../eventAccess.ts)
  const access = useEventAccess(id);
  const pathname = usePathname();

  // ภาษา (ทาง C): ค่าตั้งต้นจากบัญชี (currentUser.lang) / กดปุ่มในหน้า → override ชั่วคราว ไม่บันทึกลงบัญชี
  // override อยู่ใน ReportShell (report/layout) → สลับแท็บใน Report แล้วยังคงภาษาที่เลือกไว้
  const user = useStore((s) => s.currentUser);
  const [override, setOverride] = useState<Lang | null>(null);
  const lang: Lang = override ?? user?.lang ?? "th";
  const t = TEXT[lang];

  if (access.status === "loading") return null;

  // ด่านที่ 1: ไม่พบ / ถูกลบ / ไม่มีสิทธิ์ → ไม่แสดงข้อมูล Event
  if (access.status === "denied") {
    return (
      <div>
        <div className="flex justify-end">
          <LangToggle lang={lang} setLang={setOverride} />
        </div>
        <Card className="mt-4 items-center gap-2 rounded-2xl py-12 text-center ring-slate-200">
          <ShieldAlert size={32} className="text-slate-400" />
          <p className="text-lg font-semibold">{t.notFound}</p>
          <p className="text-sm text-slate-500">{t.notFoundHint}</p>
          <Button variant="ghost" nativeButton={false} render={<Link href="/admin/events" />} className="mt-3 text-blue-600">
            <ChevronLeft /> {t.back}
          </Button>
        </Card>
      </div>
    );
  }

  // ด่านที่ 2: draft / scheduled (หรือยังไม่มีข้อมูล) → data = null → การ์ด "ยังไม่มีข้อมูลรายงาน"
  const { event } = access;
  const data = access.status === "ok" ? access.data : null;

  // "ข้อมูลถึง ..." = เวลาของรายการล่าสุด (ลงทะเบียนหรือตอบ Survey)
  const latest = data
    ? [...data.registrations, ...data.responses].map((x) => x.createdAt).sort().at(-1)
    : undefined;
  const latestText = latest
    ? new Date(latest).toLocaleString(lang === "th" ? "th-TH" : "en-GB", { dateStyle: "medium", timeStyle: "short" })
    : "";

  const base = `/admin/events/${event.id}/report`;

  // บรรทัดสรุป เช่น "31 คำตอบ จากผู้ลงทะเบียน 46 คน · ข้อมูลถึง ..." (ใช้ทั้งส่วนหัวและหน้า print)
  const summaryText = data ? t.summaryLine(data.responses.length, data.registrations.length, latestText) : "";

  // ===== หน้าพิมพ์ (/report/print): ผ่านด่านที่ 1 มาแล้ว แต่ไม่แสดงหัว/แท็บ/ปุ่ม =====
  // ยังส่งข้อมูลผ่าน Context เหมือนแท็บอื่น และถ้ายังไม่มีข้อมูล (ด่านที่ 2) ก็แสดงการ์ดเดิม
  if (isReportPrintPath(pathname)) {
    if (!data) return <NoDataCard t={t} />;
    return <ReportContext value={{ event, data, lang, summaryText }}>{children}</ReportContext>;
  }

  return (
    <div>
      {/* ===== ส่วนหัว ===== */}
      <Link href="/admin/events" className="inline-flex items-center text-sm text-slate-500 hover:text-blue-600">
        <ChevronLeft size={16} /> {event.name.th}
      </Link>
      <div className="mt-1 flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t.title}</h1>
          {/* ตัวเลขนับจากข้อมูลจริงของ Event นี้ (getReportData) ไม่ได้ฝังค่าไว้ */}
          {data && <p className="mt-1 text-sm text-slate-500">{summaryText}</p>}
        </div>
        <div className="flex items-center gap-3">
          <LangToggle lang={lang} setLang={setOverride} />
          {/* ปุ่ม Export: อยู่หลังด่านสิทธิ์แล้ว และแสดงเฉพาะเมื่อมีข้อมูลรายงาน */}
          {data && <ExportButtons event={event} data={data} lang={lang} />}
        </div>
      </div>

      {/* ที่แสดง Toast (มุมขวาล่าง) ของหน้า Report */}
      <Toaster />

      {!data ? (
        <NoDataCard t={t} />
      ) : (
        <>
          {/* ===== แถบแท็บ (ลิงก์ไปแต่ละ route) ===== */}
          <nav className="mt-5 flex gap-6 border-b border-slate-200">
            {TABS.map((tab) => {
              const href = base + tab.path;
              const active = pathname === href;
              return (
                <Link
                  key={tab.key}
                  href={href}
                  className={`-mb-px border-b-2 pb-2 text-sm ${
                    active ? "border-blue-600 font-semibold text-blue-600" : "border-transparent text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {t.tabs[tab.key]}
                </Link>
              );
            })}
          </nav>

          {/* ===== เนื้อหาของแท็บที่เปิดอยู่ ===== */}
          <ReportContext value={{ event, data, lang, summaryText }}>
            <div className="mt-5">{children}</div>
          </ReportContext>
        </>
      )}
    </div>
  );
}

// ============ การ์ด "ยังไม่มีข้อมูลรายงาน" (ใช้ทั้งหน้าปกติและหน้า print) ============
function NoDataCard({ t }: { t: (typeof TEXT)["th"] }) {
  return (
    <Card className="mt-6 items-center gap-2 rounded-2xl py-12 text-center ring-slate-200">
      <BarChart3 size={32} className="text-slate-400" />
      <p className="text-lg font-semibold">{t.noData}</p>
      <p className="text-sm text-slate-500">{t.noDataHint}</p>
    </Card>
  );
}

// ============ ปุ่มสลับภาษา TH / EN ============
function LangToggle({ lang, setLang }: { lang: Lang; setLang: (l: Lang) => void }) {
  return (
    <div className="flex overflow-hidden rounded-full bg-white shadow-sm">
      {(["th", "en"] as Lang[]).map((l) => (
        <button
          key={l}
          onClick={() => setLang(l)}
          className={`px-3 py-1 text-sm ${lang === l ? "bg-slate-100 font-semibold" : ""}`}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
