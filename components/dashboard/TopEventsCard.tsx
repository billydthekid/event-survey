// components/dashboard/TopEventsCard.tsx

// การ์ด "Event ที่คนลงทะเบียนมากสุด" — ส่งรายการที่เรียงแล้วเข้ามา (จาก topByRegistrations)

export interface TopItem {
  id: string;
  name: string;
  count: number;
}

export function TopEventsCard({ items }: { items: TopItem[] }) {
  // แถบของอันดับ 1 ยาวเต็ม อันดับอื่นยาวตามสัดส่วน (180 ÷ 320 ≈ 56%)
  // ถ้าอันดับ 1 เป็น 0 ใช้ 1 แทน กันหารศูนย์
  const max = items[0]?.count || 1;

  return (
    <div className="h-full rounded-xl bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="font-bold">Event ที่คนลงทะเบียนมากสุด</h2>
        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs text-blue-600">Top {items.length}</span>
      </div>
      <p className="mt-1 text-sm text-slate-400">อัปเดตอันดับ วันต่อวัน</p>

      {items.length === 0 ? (
        <p className="mt-10 text-center text-sm text-slate-400">ยังไม่มี Event</p>
      ) : (
        <ol className="mt-6 flex flex-col gap-6">
          {items.map((item, i) => (
            <li key={item.id}>
              <div className="flex justify-between text-sm">
                <span>{i + 1}. {item.name}</span>
                <span className="font-semibold">{item.count.toLocaleString("th-TH")} คน</span>
              </div>
              {/* แถบพื้นเทา + แถบสีทับ กว้างเป็น % */}
              <div className="mt-2 h-2 rounded-full bg-slate-100">
                <div
                  className={`h-2 rounded-full ${i === 0 ? "bg-blue-600" : "bg-blue-300"}`}
                  style={{ width: `${(item.count / max) * 100}%` }}
                />
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
