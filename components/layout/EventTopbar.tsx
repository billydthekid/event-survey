// components/layout/EventTopbar.tsx
// Topbar ของ Event Admin (แยกจาก Topbar ของ Super ที่เขียนคำว่า "Super Admin" ไว้)
// ตามที่ทีมตัดสินใจ: ไม่มีช่องค้นหาและกระดิ่งแจ้งเตือน → เหลือปุ่มภาษา + ข้อมูลผู้ใช้ ชิดขวา
"use client";
import { useStore } from "@/lib/store";

export function EventTopbar() {
  const user = useStore((s) => s.currentUser);

  return (
    // justify-end: ไม่มีของฝั่งซ้ายแล้ว → ดันทุกอย่างไปชิดขวา (ตามต้นแบบ myevent.png)
    <header className="flex items-center justify-end px-8 py-4">
      <div className="flex items-center gap-3">
        <button className="rounded-full bg-white px-4 py-2 text-sm shadow-sm">ไทย</button>

        {/* ชื่อ + role */}
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 font-semibold text-blue-600">
            {user?.name.charAt(0)}
          </div>
          <div className="text-sm">
            <p className="font-semibold">{user?.name}</p>
            <p className="text-xs text-slate-400">Event Admin · {user?.username}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
