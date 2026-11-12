// app/admin/events/[id]/report/charts.tsx
// กราฟที่วาดเอง (โปรเจกต์ไม่มีไลบรารีกราฟ): แท่งแนวนอน + แท่งแนวตั้ง + วงแหวน SVG
// เป็น component ธรรมดา ไม่มี state ใช้ได้ทั้งฝั่ง server และ client

// ============ แท่งแนวตั้งหลายแท่ง ============
//   14
//   ██  8
//   ██  ██  ┆┆   ← future = กรอบเส้นประ (ช่วงที่ยังมาไม่ถึง ไม่มีตัวเลข)
//  10:30 11:00 13:00
// ความสูงแท่ง = value ÷ ค่ามากสุด × ความสูงกราฟ (แท่งที่มากสุดสูงเต็ม)
// state: "normal" สีอ่อน | "peak" สีเข้ม (ช่วงที่มากสุด) | "future" เส้นประ
export type VBar = { label: string; value: number; state: "normal" | "peak" | "future" };

export function VBars({ bars, height = 112 }: { bars: VBar[]; height?: number }) {
  const max = Math.max(0, ...bars.filter((b) => b.state !== "future").map((b) => b.value));
  return (
    <div className="flex items-end gap-3">
      {bars.map((b) => {
        // แท่งค่า 0 ยังสูง 4px ให้เห็นว่ามีช่วงนี้ | future สูงคงที่ 12px
        const barHeight = b.state === "future" ? 12 : max > 0 ? Math.max(4, (b.value / max) * height) : 4;
        return (
          <div key={b.label} className="flex flex-1 flex-col items-center gap-1">
            <span className="h-4 text-xs font-semibold text-slate-700">{b.state === "future" ? "" : b.value}</span>
            <div className="flex w-full items-end justify-center" style={{ height }}>
              <div
                className={`w-full max-w-11 rounded-md ${
                  b.state === "peak"
                    ? "bg-blue-600"
                    : b.state === "future"
                      ? "border border-dashed border-slate-300"
                      : "bg-[#BFD0FB]"
                }`}
                style={{ height: barHeight }}
              />
            </div>
            <span className="text-xs text-slate-500">{b.label}</span>
          </div>
        );
      })}
    </div>
  );
}

// ============ แท่งแนวนอน 1 แถว ============
// label | ████████░░░░ | right
// ความยาวแท่ง = value ÷ max (แท่งที่ค่ามากสุดยาวเต็ม แบบเดียวกับ design)
export function HBar({
  label,
  value,
  max,
  right,
}: {
  label: string;
  value: number;
  max: number;
  right: string;
}) {
  const percent = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="w-28 shrink-0 truncate">{label}</span>
      <div className="h-1.5 flex-1 rounded-full bg-slate-100">
        <div className="h-1.5 rounded-full bg-blue-600" style={{ width: `${percent}%` }} />
      </div>
      <span className="w-20 shrink-0 text-right text-slate-600">{right}</span>
    </div>
  );
}

// ============ วงแหวน (donut) ============
// วาดวงกลมซ้อนกันหลายวง แต่ละวงแสดงเส้นแค่ "ช่วงของตัวเอง" ด้วย stroke-dasharray
export function Donut({
  segments,
  center,
  centerSub,
}: {
  segments: { value: number; color: string }[];
  center: string;
  centerSub: string;
}) {
  const r = 48;                      // รัศมี
  const C = 2 * Math.PI * r;         // เส้นรอบวง ≈ 301.59
  const total = segments.reduce((sum, s) => sum + s.value, 0);

  // offset สะสม: แต่ละช่วงเริ่มต่อจากช่วงก่อนหน้า
  const arcs = segments.reduce<{ len: number; start: number; color: string }[]>((list, s) => {
    const start = list.length ? list[list.length - 1].start + list[list.length - 1].len : 0;
    return [...list, { len: total > 0 ? (s.value / total) * C : 0, start, color: s.color }];
  }, []);

  return (
    <div className="relative h-32 w-32 shrink-0">
      {/* -rotate-90: ให้เริ่มวาดจากด้านบน (12 นาฬิกา) แทนด้านขวา (3 นาฬิกา) */}
      <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
        <circle cx="60" cy="60" r={r} fill="none" stroke="#F1F5F9" strokeWidth="14" />
        {arcs.map((a, i) => (
          <circle
            key={i}
            cx="60"
            cy="60"
            r={r}
            fill="none"
            stroke={a.color}
            strokeWidth="14"
            // "ยาวเส้น ช่องว่าง": วาดเส้นยาว len แล้วเว้นที่เหลือของวง
            strokeDasharray={`${a.len} ${C - a.len}`}
            // เลื่อนจุดเริ่มไปข้างหน้าเท่ากับความยาวของช่วงก่อนหน้า (ค่าติดลบ = เลื่อนไปตามเข็ม)
            strokeDashoffset={-a.start}
          />
        ))}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold">{center}</span>
        <span className="text-xs text-slate-500">{centerSub}</span>
      </div>
    </div>
  );
}
