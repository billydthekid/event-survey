// app/admin/page.tsx
// Dashboard ของ Event Admin — เห็นเฉพาะ Event ที่ตัวเองดูแล
"use client";
import { useStore } from "@/lib/store";
import { STATUS_LABEL } from "@/lib/utils/status";

export default function EventAdminDashboard() {
  const user = useStore((s) => s.currentUser);
  const events = useStore((s) => s.events);

  // Event ที่ฉันดูแล (ไม่รวมที่ถูกลบ)
  const myEvents = events.filter(
    (e) => user && e.adminIds.includes(user.id) && e.status !== "deleted"
  );

  const count = (status: string) => myEvents.filter((e) => e.status === status).length;

  const stats = [
    { label: "Event ทั้งหมด", value: myEvents.length },
    { label: "กำลังจัดงาน", value: count("active") },
    { label: "ใกล้ถึง", value: count("scheduled") },
    { label: "ฉบับร่าง", value: count("draft") },
  ];

  return (
    <div>
      <p className="text-sm text-slate-400">ผู้ดูแล Event / ภาพรวม</p>
      <h1 className="mt-1 text-3xl font-bold">สวัสดี, {user?.name}</h1>
      <p className="mt-1 text-slate-500">ดูภาพรวม Event ที่คุณดูแล</p>

      {/* การ์ดสรุปตัวเลข */}
      <div className="mt-6 grid grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">{s.label}</p>
            <p className="mt-1 text-3xl font-bold">{s.value}</p>
          </div>
        ))}
      </div>

      {/* ตาราง Event ของฉัน */}
      <div className="mt-6 rounded-xl bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-slate-100 text-left text-slate-500">
            <tr>
              <th className="px-5 py-3">ชื่อ Event</th>
              <th className="px-5 py-3">รหัส</th>
              <th className="px-5 py-3">วันที่จัด</th>
              <th className="px-5 py-3">สถานะ</th>
            </tr>
          </thead>
          <tbody>
            {myEvents.length === 0 && (
              <tr>
                <td colSpan={4} className="px-5 py-8 text-center text-slate-400">
                  ยังไม่มี Event ที่คุณดูแล
                </td>
              </tr>
            )}
            {myEvents.map((e) => {
              const s = STATUS_LABEL[e.status];
              return (
                <tr key={e.id} className="border-t border-slate-100">
                  <td className="px-5 py-4 font-semibold">{e.name.th}</td>
                  <td className="px-5 py-4 text-slate-500">{e.code}</td>
                  <td className="px-5 py-4">{e.date || "ยังไม่กำหนด"}</td>
                  <td className="px-5 py-4">
                    <span className={`rounded-full px-3 py-1 text-xs ${s.color}`}>{s.text}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
