// app/admin/layout.tsx
// กรอบของทุกหน้า Event Admin (login แล้ว role = "event" จะถูกพามาที่ /admin → ส่งต่อไป /admin/events)
"use client";
import { Suspense, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { EventSidebar } from "@/components/layout/EventSidebar";
import { EventTopbar } from "@/components/layout/EventTopbar";
import { isReportPrintPath } from "./events/[id]/report/printPath";

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
        <SidebarUnlessPrint />
      </Suspense>
      <div className="flex-1">
        {/* fallback = Topbar ตัวเดียวกัน → หน้าอื่นหน้าตาเหมือนเดิมระหว่างรอ ไม่กะพริบ */}
        <Suspense fallback={<EventTopbar />}>
          <TopbarUnlessPrint />
        </Suspense>
        <main className="px-8 pb-8">{children}</main>
      </div>
    </div>
  );
}

// หน้าพิมพ์รายงาน (/admin/events/<id>/report/print) ไม่ต้องมี Sidebar/Topbar
// usePathname() อยู่ในคอมโพเนนต์ลูกที่ถูกครอบ Suspense แล้ว (แบบเดียวกับ EventSidebar)
// ด่านตรวจ role ด้านบนยังทำงานกับหน้า print ตามปกติ เพราะไม่ได้แตะส่วนนั้น
function SidebarUnlessPrint() {
  const pathname = usePathname();
  return isReportPrintPath(pathname) ? null : <EventSidebar />;
}

function TopbarUnlessPrint() {
  const pathname = usePathname();
  return isReportPrintPath(pathname) ? null : <EventTopbar />;
}

// กรอบ sidebar ว่าง ขนาด/สี/เส้นขอบเท่ากับ <aside> ใน EventSidebar → หน้าไม่กระตุกตอนเมนูจริงโหลดเข้ามา
function SidebarFallback() {
  return <aside className="sticky top-0 h-screen w-60 border-r border-slate-200 bg-[#F4F2F7]" />;
}
