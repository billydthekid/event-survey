// app/admin/page.tsx
// จุดเข้าของ Event Admin (หน้า Login ส่งมาที่ /admin หลังล็อกอิน)
// - มี Event ที่ได้รับมอบหมาย → ไป Dashboard ของ Event นั้นทันที (/admin/events/<id>)
// - ไม่มี Event เลย → แสดงการ์ด "ยังไม่ได้รับมอบหมาย Event" + ปุ่ม Logout (ไม่ redirect ซ้ำ → ไม่วนลูป)
// - ยังไม่ล็อกอิน / ไม่ใช่ organizer → ด่านใน admin/layout.tsx พาไป /login เอง
// เป็น Client Component เพราะต้องอ่าน store (localStorage) ก่อนจึงรู้ว่า Event ไหน
// (หน้าการ์ดนี้ไม่มีในต้นฉบับ — ออกแบบเพิ่มด้วยสไตล์การ์ดเดียวกับหน้าอื่น)
"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { CalendarX2, LogOut } from "lucide-react";
import { useStore } from "@/lib/store";
import { Lang } from "@/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAssignedEvent } from "./assignedEvent";

const TEXT = {
  th: {
    title: "ยังไม่ได้รับมอบหมาย Event",
    hint: "เมื่อ Super Admin มอบหมาย Event ให้คุณ ระบบจะพาไปที่ Dashboard ของ Event นั้นทันทีหลังเข้าสู่ระบบ",
    logout: "Logout",
  },
  en: {
    title: "No event assigned yet",
    hint: "Once a Super Admin assigns an event to you, you will land on its Dashboard right after signing in",
    logout: "Logout",
  },
};

export default function AdminIndex() {
  const router = useRouter();
  const user = useStore((s) => s.currentUser);
  const logout = useStore((s) => s.logout);
  const assigned = useAssignedEvent();

  const lang: Lang = user?.lang ?? "th";
  const t = TEXT[lang];

  // id ของ Event ที่จะไป (null = ยังไม่รู้ / ไม่มี)
  const targetId = assigned.status === "ok" ? assigned.event.id : null;

  // มี Event → แทนที่ประวัติด้วยหน้า Dashboard (กด Back แล้วไม่เด้งกลับมาที่ /admin)
  useEffect(() => {
    if (targetId) router.replace(`/admin/events/${targetId}`);
  }, [targetId, router]);

  // กำลังโหลด หรือกำลังจะ redirect → ไม่ต้องแสดงอะไร
  if (assigned.status !== "none") return null;

  const handleLogout = () => {
    logout();
    router.replace("/login");
  };

  return (
    <Card className="mt-8 items-center gap-2 rounded-2xl py-12 text-center ring-slate-200">
      <CalendarX2 size={32} className="text-slate-400" />
      <p className="text-lg font-semibold">{t.title}</p>
      <p className="max-w-md text-sm text-slate-500">{t.hint}</p>
      <Button variant="ghost" onClick={handleLogout} className="mt-3 text-red-500">
        <LogOut /> {t.logout}
      </Button>
    </Card>
  );
}
