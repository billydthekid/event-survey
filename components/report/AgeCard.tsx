// components/report/AgeCard.tsx
// การ์ด "กลุ่มอายุ" (Report ④) — แถบยาวเทียบกลุ่มที่คนเยอะสุด
interface AgeCardProps {
  groups: { label: string; count: number }[];   // จาก ageSummary()
  average: number;
  min: number;
  max: number;
}

export function AgeCard({ groups, average, min, max }: AgeCardProps) {
  const top = Math.max(1, ...groups.map((g) => g.count));
  return (
    <div className="h-full rounded-xl bg-white p-5 shadow-sm">
      <h2 className="font-bold">กลุ่มอายุ</h2>
      <p className="mt-1 text-sm text-slate-500">
        {average > 0 ? (
          <>เฉลี่ย <span className="font-semibold text-slate-800">{average}</span> ปี · ต่ำสุด {min} · สูงสุด {max}</>
        ) : (
          "ยังไม่มีข้อมูลอายุ"
        )}
      </p>
      <ul className="mt-4 space-y-3 text-sm">
        {groups.map((g) => (
          <li key={g.label} className="grid grid-cols-[88px_1fr_56px] items-center gap-3">
            <span>{g.label}</span>
            <span className="h-3 rounded-full bg-slate-100">
              <span className="block h-3 rounded-full bg-blue-600" style={{ width: `${(g.count / top) * 100}%` }} />
            </span>
            <span className="text-right text-slate-500">{g.count} คน</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
