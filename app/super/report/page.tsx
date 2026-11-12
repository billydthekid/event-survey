// app/super/report/page.tsx
// หน้ารวม Report ทุก Event (Super Admin) — เลือก Event ก่อน แล้วไปหน้า Report ของงานนั้น
// ตาม Figma "Admin · Report ทุก Event (รวม)"
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { countByEvent, visibleEvents } from "@/lib/utils/stats";
import { formatThaiDate } from "@/lib/utils/date";
import { matchKeyword, REPORT_LABEL, reportState, sortEvents, SortKey } from "@/lib/utils/eventList";
import { EventFilterBar } from "@/components/events/EventFilterBar";
import { Badge, EventColumn, EventListTable, RateCell } from "@/components/events/EventListTable";
import { Event } from "@/types";

// "มีข้อมูลแล้ว" = กำลังจัดงาน + จบแล้ว · "ยังไม่มีข้อมูล" = ใกล้ถึง + ฉบับร่าง
const hasData = (e: Event) => reportState(e) !== "wait";

const CHIPS = [
  { key: "all", label: "ทั้งหมด" },
  { key: "ready", label: "มีข้อมูลแล้ว" },
  { key: "wait", label: "ยังไม่มีข้อมูล" },
];

export default function ReportAllPage() {
  const router = useRouter();
  const events = useStore((s) => s.events);
  const registrations = useStore((s) => s.registrations);
  const responses = useStore((s) => s.responses);

  const [search, setSearch] = useState("");
  const [chip, setChip] = useState("all");
  const [sort, setSort] = useState<SortKey>("date");

  const list = visibleEvents(events);
  const registered = countByEvent(registrations);
  const responded = countByEvent(responses);

  const passChip = (e: Event) => chip === "all" || (chip === "ready" ? hasData(e) : !hasData(e));
  const shown = sortEvents(list.filter((e) => passChip(e) && matchKeyword(e, search)), sort, registered);

  const columns: EventColumn[] = [
    { key: "date", header: "วันที่จัด", render: (e) => formatThaiDate(e.date) },
    {
      key: "registered", header: "ลงทะเบียน", align: "right",
      render: (e) => `${(registered[e.id] ?? 0).toLocaleString("th-TH")} คน`,
    },
    {
      key: "responded", header: "ตอบ Survey", align: "right",
      render: (e) => (hasData(e) ? `${(responded[e.id] ?? 0).toLocaleString("th-TH")} คน` : <span className="text-slate-400">—</span>),
    },
    {
      key: "rate", header: "% ตอบ",
      render: (e) => (hasData(e) ? <RateCell done={responded[e.id] ?? 0} total={registered[e.id] ?? 0} /> : <span className="text-slate-400">—</span>),
    },
    { key: "report", header: "รายงาน", render: (e) => <Badge {...REPORT_LABEL[reportState(e)]} /> },
  ];

  return (
    <div>
      <p className="text-sm text-slate-400">ผู้ดูแลระบบ / Report</p>
      <h1 className="mt-1 text-3xl font-bold">Report ทุก Event</h1>
      <p className="mt-1 text-slate-500">เลือก Event เพื่อดูรายงานของงานนั้น · กดแถวเพื่อเปิดหน้า Report</p>

      <div className="mt-6">
        <EventListTable
          title="เลือก Event"
          total={list.length}
          events={shown}
          columns={columns}
          onSelect={(id) => router.push(`/super/events/${id}/report`)}
          toolbar={
            <EventFilterBar
              search={search}
              onSearch={setSearch}
              chips={CHIPS.map((c) => ({
                ...c,
                count: c.key === "all" ? undefined : list.filter((e) => (c.key === "ready" ? hasData(e) : !hasData(e))).length,
              }))}
              chip={chip}
              onChip={setChip}
              sort={sort}
              onSort={setSort}
            />
          }
        />
      </div>
    </div>
  );
}
