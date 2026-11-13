// components/dashboard/SatisfactionCard.tsx
import { Star } from "lucide-react";

// การ์ด "ความพึงพอใจ" (หน้า ③) — แถว 5★ ถึง 1★ แถบยาวตามสัดส่วนของแถวที่มากสุด
// รับผลจาก satisfactionSummary() ใน lib/utils/stats.ts

interface SatisfactionCardProps {
  levels: { score: number; count: number }[];   // เรียง 5 → 1
  total: number;
  average: number;
}

export function SatisfactionCard({ levels, total, average }: SatisfactionCardProps) {
  const max = Math.max(1, ...levels.map((l) => l.count));   // กันหารศูนย์

  return (
    <div className="h-full rounded-xl bg-white p-5 shadow-sm">
      <h2 className="font-bold">ความพึงพอใจ</h2>
      <p className="mt-1 text-sm text-slate-400">
        {total === 0 ? "ยังไม่มีคำตอบ" : `เฉลี่ย ${average} / 5 · ${total.toLocaleString("th-TH")} คำตอบ`}
      </p>

      <ul className="mt-5 flex flex-col gap-4">
        {levels.map((l) => (
          <li key={l.score} className="flex items-center gap-3 text-sm">
            <span className="flex w-8 items-center gap-0.5 font-semibold">
              {l.score}
              <Star size={12} className="fill-amber-400 text-amber-400" />
            </span>
            <div className="h-2 flex-1 rounded-full bg-slate-100">
              <div className="h-2 rounded-full bg-blue-600" style={{ width: `${(l.count / max) * 100}%` }} />
            </div>
            <span className="w-8 text-right font-semibold">{l.count}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
