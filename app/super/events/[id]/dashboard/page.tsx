// app/super/events/[id]/dashboard/page.tsx
"use client";
import { Suspense } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useStore } from "@/lib/store";
import { STATUS_LABEL } from "@/lib/utils/status";
import { formatThaiDate } from "@/lib/utils/date";

// Dashboard เจาะ Event (ส่วน ③) — ตอนนี้เป็นหน้าชั่วคราว ให้ popup เลือก Event / ตารางหน้า ② มีที่ไป
// เนื้อหาจริงจะทำใน branch feature/event-dashboard
// [id] ในชื่อโฟลเดอร์ = dynamic route → /super/events/e-workshop/dashboard ได้ id = "e-workshop"

function EventDashboard() {
  const { id } = useParams<{ id: string }>();
  // ไม่นับ Event ที่ถูกลบ (เปิด URL ค้างไว้แล้ว Event โดนลบ → "ไม่พบ")
  const event = useStore((s) => s.events.find((e) => e.id === id && e.status !== "deleted"));

  if (!event) {
    return (
      <div className="mt-10 rounded-xl bg-white p-10 text-center shadow-sm">
        <p className="font-semibold">ไม่พบ Event นี้</p>
        <p className="mt-1 text-sm text-slate-500">อาจถูกลบไปแล้ว หรือลิงก์ไม่ถูกต้อง</p>
        <Link href="/super" className="mt-4 inline-block text-sm text-blue-600 hover:underline">
          ← กลับภาพรวมทุก Event
        </Link>
      </div>
    );
  }

  const s = STATUS_LABEL[event.status];
  return (
    <div>
      <p className="text-sm text-slate-400">ผู้ดูแลระบบ / {event.name.th}</p>
      <h1 className="mt-1 text-3xl font-bold">{event.name.th}</h1>
      <p className="mt-2 flex items-center gap-2 text-slate-500">
        <span className={`rounded-full px-3 py-1 text-xs ${s.color}`}>{s.text}</span>
        {event.code} · {formatThaiDate(event.date)}
      </p>

      <div className="mt-6 rounded-xl bg-white p-10 text-center text-slate-400 shadow-sm">
        Dashboard เจาะ Event (ส่วน ③) — กำลังทำ
      </div>
    </div>
  );
}

// ครอบ <Suspense>: useParams ต้องรอ URL ตอนเปิดหน้าจริง (cacheComponents) ไม่ครอบ build ไม่ผ่าน
export default function EventDashboardPage() {
  return (
    <Suspense fallback={null}>
      <EventDashboard />
    </Suspense>
  );
}
