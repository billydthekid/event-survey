// app/super/layout.tsx
"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";

export default function SuperLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const user = useStore((s) => s.currentUser);
  const hydrated = useStore((s) => s.hydrated);

  // พร้อมแสดง = โหลด localStorage เสร็จ + เป็น admin
  const ready = hydrated && user?.role === "admin";

  // guard: ไม่ใช่ admin → เด้งกลับ /login
  useEffect(() => {
    if (hydrated && user?.role !== "admin") {
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
      <Sidebar />
      <div className="flex-1">
        <Topbar />
        <main className="px-8 pb-8">{children}</main>
      </div>
    </div>
  );
}
