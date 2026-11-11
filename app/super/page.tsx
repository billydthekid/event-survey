// app/super/page.tsx
"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarDays, ChevronDown, ClipboardCheck, Download, UserPlus, Users } from "lucide-react";
import { useStore } from "@/lib/store";
import { countByEvent, responseRate, summarize, topByRegistrations, visibleEvents } from "@/lib/utils/stats";
import { downloadCSV } from "@/lib/utils/csv";
import { STATUS_LABEL } from "@/lib/utils/status";
import { formatThaiDate } from "@/lib/utils/date";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { TopEventsCard } from "@/components/dashboard/TopEventsCard";
import { DonutCard } from "@/components/dashboard/DonutCard";
import { EventTable, adminNames } from "@/components/dashboard/EventTable";

export default function SuperDashboard() {
  const router = useRouter();
  const events = useStore((s) => s.events);
  const users = useStore((s) => s.users);
  const registrations = useStore((s) => s.registrations);
  const responses = useStore((s) => s.responses);

  // ============ คิดตัวเลข (ทุกตัวมาจาก store ไม่มีเลขพิมพ์ตายตัว) ============
  const list = visibleEvents(events);                          // ไม่รวม Event ที่ถูกลบ
  const summary = summarize(events, registrations, responses); // KPI + โดนัท
  const registered = countByEvent(registrations);              // { eventId: จำนวน } ให้ตาราง
  const responded = countByEvent(responses);
  const top = topByRegistrations(events, registrations).map((t) => ({
    id: t.event.id,
    name: t.event.name.th,
    count: t.registered,
  }));

  // ---------- Export CSV (คอลัมน์ตามตาราง + รหัส + % ตอบ) ----------
  const handleExport = () => {
    const header = ["ชื่อ Event", "รหัส", "วันที่จัด", "สถานะ", "ผู้ดูแล", "ลงทะเบียน", "ตอบ Survey", "% ตอบ"];
    const rows = list.map((e) => {
      const reg = registered[e.id] ?? 0;
      const res = responded[e.id] ?? 0;
      return [
        e.name.th,
        e.code,
        formatThaiDate(e.date),
        STATUS_LABEL[e.status].text,
        adminNames(e, users),
        reg,
        res,
        responseRate(res, reg),
      ];
    });
    // วันนี้แบบ 2026-11-11 ตามเวลาไทย (รูปแบบวันที่ของ sv-SE คือ ปี-เดือน-วัน)
    const today = new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Bangkok" });
    downloadCSV(`ภาพรวม-Event-${today}.csv`, [header, ...rows]);
  };

  return (
    <div>
      {/* ---------- หัวข้อ ---------- */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-400">ผู้ดูแลระบบ / ภาพรวมทุก Event</p>
          <h1 className="mt-1 text-3xl font-bold">ภาพรวมทุก Event</h1>
          <p className="mt-1 text-slate-500">
            ติดตามกิจกรรม ผู้ลงทะเบียน และผลตอบรับทั้งระบบในฐานะ Super Admin
          </p>
        </div>
        {/* ตอนนี้แสดงอย่างเดียว ยังเลือกช่วงเวลาไม่ได้ */}
        <button className="flex items-center gap-1 rounded-lg bg-white px-4 py-2 text-sm shadow-sm">
          ทุกช่วงเวลา <ChevronDown size={16} />
        </button>
      </div>

      {/* ---------- ปุ่มลัด ---------- */}
      <div className="mt-6 grid grid-cols-2 gap-4">
        <Link
          href="/super/users"
          className="flex items-center gap-3 rounded-xl bg-white p-3 shadow-sm hover:bg-slate-50"
        >
          <span className="rounded-lg bg-blue-50 p-2 text-blue-600"><Users size={18} /></span>
          <span className="text-sm font-semibold">จัดการผู้ใช้</span>
        </Link>
        <button
          onClick={handleExport}
          className="flex items-center gap-3 rounded-xl bg-white p-3 text-left shadow-sm hover:bg-slate-50"
        >
          <span className="rounded-lg bg-green-50 p-2 text-green-600"><Download size={18} /></span>
          <span className="text-sm font-semibold">Export ภาพรวม</span>
        </button>
      </div>

      {/* ---------- KPI 3 ใบ ---------- */}
      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <KpiCard icon={CalendarDays} label="Event ทั้งหมด" value={summary.eventCount} />
        <KpiCard
          icon={UserPlus}
          tone="green"
          label="ลงทะเบียนรวม"
          value={summary.registered}
          sub="รวมผู้ลงทะเบียนจากทุก Event"
        />
        <KpiCard
          icon={ClipboardCheck}
          tone="purple"
          label="ตอบ Survey แล้ว"
          value={summary.responded}
          sub={`ยังไม่ตอบ ${summary.notResponded.toLocaleString("th-TH")} คน`}
        />
      </div>

      {/* ---------- Top 3 + โดนัท (สัดส่วนกว้างตาม Figma 710 : 410) ---------- */}
      <div className="mt-4 grid gap-4 lg:grid-cols-[7fr_4fr]">
        <TopEventsCard items={top} />
        <DonutCard done={summary.responded} total={summary.registered} />
      </div>

      {/* ---------- ตาราง ---------- */}
      <div className="mt-4">
        {/* กดแถว = ไปหน้า Dashboard ของ Event นั้น (เหมือนเลือกใน popup) */}
        <EventTable
          events={list}
          users={users}
          registered={registered}
          responded={responded}
          onSelect={(id) => router.push(`/super/events/${id}/dashboard`)}
        />
      </div>
    </div>
  );
}
