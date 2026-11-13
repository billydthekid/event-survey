// app/super/survey/page.tsx
// หน้ารวม Survey ทุก Event (Super Admin) — เลือก Event ก่อน แล้วไปหน้า Survey (สรุป) ของงานนั้น
// ตาม Figma "Admin · Survey ทุก Event (รวม)"
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { STATUS_LABEL } from "@/lib/utils/status";
import { countByEvent, visibleEvents } from "@/lib/utils/stats";
import { formatThaiDate } from "@/lib/utils/date";
import { matchKeyword, sortEvents, SortKey, surveyLabel, surveyState, SurveyState } from "@/lib/utils/eventList";
import { EventFilterBar } from "@/components/events/EventFilterBar";
import { Badge, EventColumn, EventListTable, RateCell } from "@/components/events/EventListTable";
import { Event } from "@/types";

const DASH = <span className="text-slate-400">—</span>;

const CHIPS: { key: "all" | SurveyState; label: string }[] = [
  { key: "all", label: "ทั้งหมด" },
  { key: "on", label: "เปิดใช้" },
  { key: "off", label: "ปิดอยู่" },
  { key: "none", label: "ยังไม่มี Survey" },
];

export default function SurveyAllPage() {
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

  const shown = sortEvents(
    list.filter((e) => (chip === "all" || surveyState(e) === chip) && matchKeyword(e, search)),
    sort,
    registered
  );

  // ยังไม่มี Survey และยังไม่มีใครตอบ → แสดง "—" แทน 0 / N คน
  const noAnswer = (e: Event) => surveyState(e) === "none" && (responded[e.id] ?? 0) === 0;

  const columns: EventColumn[] = [
    { key: "date", header: "วันที่จัด", render: (e) => formatThaiDate(e.date) },
    { key: "status", header: "สถานะ", render: (e) => <Badge {...STATUS_LABEL[e.status]} /> },
    {
      key: "survey", header: "Survey",
      render: (e) => <span className={surveyState(e) === "none" ? "text-slate-400" : ""}>{surveyLabel(e)}</span>,
    },
    {
      key: "answers", header: "คำตอบ",
      render: (e) => (noAnswer(e) ? DASH : `${responded[e.id] ?? 0} / ${registered[e.id] ?? 0} คน`),
    },
    {
      key: "rate", header: "% ตอบ",
      render: (e) => (noAnswer(e) ? DASH : <RateCell done={responded[e.id] ?? 0} total={registered[e.id] ?? 0} />),
    },
  ];

  return (
    <div>
      <p className="text-sm text-slate-400">ผู้ดูแลระบบ / Survey</p>
      <h1 className="mt-1 text-3xl font-bold">Survey ทุก Event</h1>
      <p className="mt-1 text-slate-500">เลือก Event เพื่อดูสรุป Survey ของงานนั้น · กดแถวเพื่อเปิดหน้า Survey (สรุป)</p>

      <div className="mt-6">
        <EventListTable
          title="เลือก Event"
          total={list.length}
          events={shown}
          columns={columns}
          onSelect={(id) => router.push(`/super/events/${id}/survey`)}
          toolbar={
            <EventFilterBar
              search={search}
              onSearch={setSearch}
              chips={CHIPS.map((c) => ({
                ...c,
                count: c.key === "all" ? undefined : list.filter((e) => surveyState(e) === c.key).length,
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
