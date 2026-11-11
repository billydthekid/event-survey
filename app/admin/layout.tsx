// app/admin/layout.tsx
// กรอบของทุกหน้า Event Admin (login แล้ว role = "event" จะถูกพามาที่ /admin)
"use client";
import { Suspense, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { EventSidebar } from "@/components/layout/EventSidebar";
import { EventTopbar } from "@/components/layout/EventTopbar";

export default function EventAdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const user = useStore((s) => s.currentUser);
  const hydrated = useStore((s) => s.hydrated);

  // พร้อมแสดง = โหลด localStorage เสร็จ + เป็น event admin
  const ready = hydrated && user?.role === "event";

  // guard: ไม่ใช่ event admin → เด้งกลับ /login
  useEffect(() => {
    if (hydrated && user?.role !== "event") {
      router.replace("/login");
    }
  }, [hydrated, user, router]);

  return (
    <div
      className={`flex min-h-screen ${ready ? "" : "invisible"}`}
      style={{
        background:
          "linear-gradient(180deg, #E6E3F6 0%, #E3ECFB 13%, rgba(244,242,247,0) 31%), #F4F2F7",
      }}
    >
      {/* EventSidebar ใช้ usePathname() ซึ่งรู้ค่าได้ตอนเปิดหน้าจริงเท่านั้น
          ครอบด้วย Suspense เพื่อให้ตอน build แสดงกรอบว่างไปก่อน (หน้า [id] จึง build ผ่าน) */}
      <Suspense fallback={<SidebarFallback />}>
        <EventSidebar />
      </Suspense>
      <div className="flex-1">
        <EventTopbar />
        <main className="px-8 pb-8">{children}</main>
      </div>
    </div>
  );
}

// กรอบ sidebar ว่าง ขนาด/สี/เส้นขอบเท่ากับ <aside> ใน EventSidebar → หน้าไม่กระตุกตอนเมนูจริงโหลดเข้ามา
function SidebarFallback() {
  return <aside className="h-screen w-60 border-r border-slate-200 bg-[#F4F2F7]" />;
}
