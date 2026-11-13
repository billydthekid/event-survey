// components/dashboard/SlotBarChart.tsx
import { type Slot } from "@/lib/utils/stats";
import { formatTime } from "@/lib/utils/date";

// กราฟแท่ง "ลงทะเบียนต่อช่วง 30 นาที" (หน้า ③) — วาดด้วย div + Tailwind (ไม่ลง library กราฟ)
// แท่งสูงตามสัดส่วนของช่วงที่คนเยอะสุด · แท่งเข้ม = ช่วงที่เยอะสุด · กล่องเส้นประ = ยังไม่ถึงเวลา

interface SlotBarChartProps {
  slots: Slot[] | null;   // null = Event ยังไม่กำหนดวัน/เวลางาน
}

export function SlotBarChart({ slots }: SlotBarChartProps) {
  // หาช่วงที่เยอะสุด (ไม่นับช่วงที่ยังไม่ถึง) · ทุกช่วงเป็น 0 → ไม่มีแท่งเข้ม
  const past = (slots ?? []).filter((s) => !s.future);
  const peak = past.reduce<Slot | undefined>((best, s) => (!best || s.count > best.count ? s : best), undefined);
  const max = peak?.count || 1;   // กันหารศูนย์

  return (
    <div className="h-full rounded-xl bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="font-bold">ลงทะเบียนต่อช่วง 30 นาที</h2>
        {peak && peak.count > 0 && (
          <span className="text-sm text-slate-400">
            เยอะสุดช่วง {formatTime(peak.start)} · {peak.count} คน
          </span>
        )}
      </div>

      {!slots ? (
        <p className="mt-16 text-center text-sm text-slate-400">ยังไม่กำหนดวัน / เวลางาน</p>
      ) : (
        <>
          {/* แท่ง: กล่องสูง h-48 แต่ละคอลัมน์ดันแท่งลงล่าง (justify-end) · ความสูงแท่ง = count ÷ max (เผื่อที่ให้ตัวเลข 80%) */}
          <div className="mt-6 flex h-48 items-end gap-2">
            {slots.map((s) => (
              <div key={s.start.getTime()} className="flex h-full flex-1 flex-col items-center justify-end">
                {s.future ? (
                  <div className="h-5 w-full max-w-10 rounded-md border border-dashed border-slate-300" />
                ) : (
                  <>
                    <span className="mb-1 text-xs font-semibold">{s.count}</span>
                    <div
                      className={`w-full max-w-10 rounded-t-md ${s === peak && s.count > 0 ? "bg-blue-600" : "bg-blue-200"}`}
                      style={{ height: `${(s.count / max) * 80}%` }}
                    />
                  </>
                )}
              </div>
            ))}
          </div>

          {/* แกนเวลา */}
          <div className="mt-2 flex gap-2">
            {slots.map((s) => (
              <span key={s.start.getTime()} className="flex-1 text-center text-xs text-slate-400">
                {formatTime(s.start)}
              </span>
            ))}
          </div>

          {/* คำอธิบายสี */}
          <div className="mt-4 flex gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-blue-200" />ลงทะเบียนแล้ว</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-blue-600" />ช่วงที่เยอะสุด</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full border border-dashed border-slate-400" />ยังไม่ถึงเวลา</span>
          </div>
        </>
      )}
    </div>
  );
}
