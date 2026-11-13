// components/dashboard/WhenWhereCard.tsx
import { MapPin } from "lucide-react";
import { Event } from "@/types";
import { formatDayMonth, formatThaiDate, isToday } from "@/lib/utils/date";

// การ์ด "เมื่อไหร่และที่ไหน" (หน้า ③) — กล่องวันที่ + เวลา, สถานที่
// ยังไม่กรอก → "ยังไม่กำหนด…"

interface WhenWhereCardProps {
  event: Event;
  now: Date;
}

export function WhenWhereCard({ event, now }: WhenWhereCardProps) {
  const dm = formatDayMonth(event.date);   // { day: "23", month: "ต.ค." } หรือ null
  const time = event.startTime && event.endTime ? `${event.startTime} – ${event.endTime}` : "ยังไม่กำหนดเวลา";
  const place = event.mode === "online" ? "ออนไลน์" : event.venue || "ยังไม่กำหนดสถานที่";

  return (
    <div className="h-full rounded-xl bg-white p-5 shadow-sm">
      <h2 className="font-bold">เมื่อไหร่และที่ไหน</h2>

      {/* วันที่ */}
      <div className="mt-4 flex items-center gap-3">
        <div className="w-12 overflow-hidden rounded-lg border border-slate-200 text-center">
          <p className="bg-slate-100 text-[10px] text-slate-500">{dm?.month ?? "—"}</p>
          <p className="py-0.5 text-lg font-bold">{dm?.day ?? "—"}</p>
        </div>
        <div>
          <p className="font-semibold" suppressHydrationWarning>
            {isToday(event.date, now) ? "วันนี้" : formatThaiDate(event.date)}
          </p>
          <p className="text-sm text-slate-500">{time}</p>
        </div>
      </div>

      {/* สถานที่ */}
      <div className="mt-4 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-slate-200 text-slate-500">
          <MapPin size={18} />
        </div>
        <div>
          <p className="font-semibold">{place}</p>
          {event.meetingPoint && <p className="text-sm text-slate-500">{event.meetingPoint}</p>}
        </div>
      </div>
    </div>
  );
}
