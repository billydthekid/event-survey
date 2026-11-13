// components/report/GenderCard.tsx
// การ์ด "เพศ" (Report ④) — โดนัท 3 สี วาดด้วย SVG: วงกลมทีละสี เลื่อนจุดเริ่มด้วย strokeDashoffset
import { percent } from "@/lib/utils/surveyStats";

const R = 52;
const CIRCLE = 2 * Math.PI * R;
const COLOR = ["stroke-blue-600", "stroke-orange-500", "stroke-teal-500"];   // ชาย · หญิง · ไม่ระบุ
const DOT = ["bg-blue-600", "bg-orange-500", "bg-teal-500"];

interface GenderCardProps {
  items: { key: string; label: string; count: number }[];   // จาก genderSummary()
}

export function GenderCard({ items }: GenderCardProps) {
  const total = items.reduce((sum, g) => sum + g.count, 0);
  // ความยาวเส้นของแต่ละสี + จุดเริ่ม (= ผลรวมความยาวของสีก่อนหน้า) → สีถัดไปวาดต่อจากสีก่อน
  const arcs = items.map((g) => (total === 0 ? 0 : (g.count / total) * CIRCLE));
  const starts = arcs.map((_, i) => arcs.slice(0, i).reduce((a, b) => a + b, 0));

  return (
    <div className="h-full rounded-xl bg-white p-5 shadow-sm">
      <h2 className="font-bold">เพศ</h2>
      <div className="mt-4 flex items-center gap-6">
        <div className="relative h-32 w-32 shrink-0">
          <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
            <circle cx="60" cy="60" r={R} fill="none" strokeWidth="16" className="stroke-slate-100" />
            {total > 0 &&
              items.map((g, i) =>
                g.count > 0 ? (
                  <circle
                    key={g.key} cx="60" cy="60" r={R} fill="none" strokeWidth="16" className={COLOR[i]}
                    strokeDasharray={`${arcs[i]} ${CIRCLE}`} strokeDashoffset={-starts[i]}
                  />
                ) : null
              )}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p className="text-2xl font-bold">{total.toLocaleString("th-TH")}</p>
            <p className="text-xs text-slate-400">คน</p>
          </div>
        </div>

        <ul className="flex-1 space-y-3 text-sm">
          {items.map((g, i) => (
            <li key={g.key} className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-2">
                <span className={`h-3 w-3 rounded ${DOT[i]}`} />
                {g.label}
              </span>
              <span className="text-slate-500">{g.count} · {percent(g.count, total)}%</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
