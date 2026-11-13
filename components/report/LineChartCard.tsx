// components/report/LineChartCard.tsx
// กราฟเส้น "ลงทะเบียนตามช่วงเวลา (ทุก 30 นาที)" (Report ④) — วาด SVG เอง ไม่ลง library
// ใช้ข้อมูลช่วง 30 นาทีชุดเดียวกับกราฟแท่งหน้า Dashboard (registrationSlots ใน stats.ts)
import { Slot } from "@/lib/utils/stats";
import { formatTime } from "@/lib/utils/date";

// ขนาดใน viewBox (SVG ย่อ/ขยายตามความกว้างการ์ดเอง)
const W = 1000;
const H = 340;
const PAD = { left: 48, right: 16, top: 24, bottom: 40 };
const PLOT_W = W - PAD.left - PAD.right;
const PLOT_H = H - PAD.top - PAD.bottom;

// เพดานแกน Y: ปัดขึ้นเป็นเลขหาร 4 ลงตัว และเผื่อที่เหนือจุดสูงสุด (14 → 16)
function niceMax(max: number): number {
  return Math.max(4, Math.ceil((max + 1) / 4) * 4);
}

export function LineChartCard({ slots }: { slots: Slot[] | null }) {
  // ---------- ยังไม่กำหนดวัน / เวลา ----------
  if (!slots || slots.length === 0) {
    return (
      <div className="h-full rounded-xl bg-white p-5 shadow-sm">
        <h2 className="font-bold">ลงทะเบียนตามช่วงเวลา (ทุก 30 นาที)</h2>
        <p className="mt-10 text-center text-sm text-slate-400">Event นี้ยังไม่กำหนดวัน / เวลาเริ่ม–จบ</p>
      </div>
    );
  }

  const past = slots.filter((s) => !s.future);   // วาดเส้นเฉพาะช่วงที่ถึงเวลาแล้ว
  const peak = past.reduce<Slot | null>((best, s) => (!best || s.count > best.count ? s : best), null);
  const yMax = niceMax(Math.max(0, ...slots.map((s) => s.count)));

  // ตำแหน่งบนกราฟ: ช่วงที่ i อยู่ที่ x ของเวลาเริ่มช่วง
  const x = (i: number) => PAD.left + (slots.length === 1 ? 0 : (i / (slots.length - 1)) * PLOT_W);
  const y = (count: number) => PAD.top + PLOT_H - (count / yMax) * PLOT_H;

  const points = past.map((s, i) => `${x(i)},${y(s.count)}`);
  const line = `M ${points.join(" L ")}`;
  const area = `${line} L ${x(past.length - 1)},${y(0)} L ${x(0)},${y(0)} Z`;
  const peakIndex = peak ? slots.indexOf(peak) : -1;
  const peakEnd = peak ? new Date(peak.start.getTime() + 30 * 60 * 1000) : null;

  return (
    <div className="h-full rounded-xl bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h2 className="font-bold">ลงทะเบียนตามช่วงเวลา (ทุก 30 นาที)</h2>
        {peak && peakEnd && peak.count > 0 && (
          <p className="text-sm text-slate-500">
            ช่วงที่คนมาเยอะสุด{" "}
            <span className="font-semibold text-slate-800">
              {formatTime(peak.start)} – {formatTime(peakEnd)}
            </span>{" "}
            · {peak.count} คน
          </p>
        )}
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="mt-4 w-full">
        {/* ---------- เส้นแกน Y (0, ¼, ½, ¾, เต็ม) ---------- */}
        {[0, 1, 2, 3, 4].map((k) => {
          const v = (yMax / 4) * k;
          return (
            <g key={k}>
              <line x1={PAD.left} x2={W - PAD.right} y1={y(v)} y2={y(v)} className="stroke-slate-100" />
              <text x={PAD.left - 12} y={y(v) + 5} textAnchor="end" className="fill-slate-400 text-[14px]">{v}</text>
            </g>
          );
        })}

        {/* ---------- ป้ายเวลาแกน X (เฉพาะต้นชั่วโมง) ---------- */}
        {slots.map((s, i) =>
          s.start.getMinutes() === 0 ? (
            <text key={i} x={x(i)} y={H - 10} textAnchor="middle" className="fill-slate-400 text-[14px]">
              {formatTime(s.start)}
            </text>
          ) : null
        )}

        {/* ---------- พื้นที่ใต้เส้น + เส้น ---------- */}
        {past.length > 1 && (
          <>
            <path d={area} className="fill-blue-600/10" />
            <path d={line} fill="none" strokeWidth="3" strokeLinejoin="round" className="stroke-blue-600" />
          </>
        )}

        {/* ---------- จุดสูงสุด ---------- */}
        {peak && peak.count > 0 && (
          <g>
            <line
              x1={x(peakIndex)} x2={x(peakIndex)} y1={y(peak.count)} y2={y(0)}
              strokeDasharray="5 5" strokeWidth="2" className="stroke-blue-600"
            />
            <circle cx={x(peakIndex)} cy={y(peak.count)} r="7" className="fill-blue-600 stroke-white" strokeWidth="3" />
            <text x={x(peakIndex) + 14} y={y(peak.count) - 10} className="fill-slate-800 text-[18px] font-bold">
              Peak {peak.count}
            </text>
          </g>
        )}
      </svg>
    </div>
  );
}
