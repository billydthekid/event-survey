// components/events/CreateEventModal.tsx
// Modal สร้าง Event (Draft) — เรียบง่ายที่สุด
//
// กรอกชื่อ → กดสร้าง → จบ (ยังไม่เลือกผู้ดูแล)
//   - Admin: ไปหน้า /super/events เพื่อ assign organizer ให้ event ที่เพิ่งสร้าง
//   - Organizer: auto-assign ตัวเอง + ไป Wizard กรอกรายละเอียด
"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { useStore } from "@/lib/store";

export default function CreateEventModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const currentUser = useStore((s) => s.currentUser);
  const createDraftEvent = useStore((s) => s.createDraftEvent);

  const nameRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");

  const handleCreate = () => {
    const name = nameRef.current?.value.trim() ?? "";
    if (name === "") {
      setError("กรุณากรอกชื่อ Event");
      return;
    }

    // Organizer → assign ตัวเองทันที · Admin → ยังไม่เลือก (ไป assign ที่ Event list)
    const adminId = currentUser?.role === "organizer" ? currentUser.id : null;
    const ev = createDraftEvent(name, adminId);
    onClose();

    if (currentUser?.role === "admin") {
      // ไปหน้า Event list พร้อม highlight event ที่เพิ่งสร้าง (ใช้ query param)
      router.push(`/super/events?new=${ev.id}`);
    } else {
      router.push(`/admin/events/${ev.id}/edit`);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40"
      onClick={onClose}
    >
      <div
        className="w-[480px] rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold">สร้าง Event ใหม่</h2>
            <p className="mt-1 text-sm text-slate-500">
              {currentUser?.role === "admin"
                ? "ตั้งชื่อก่อน แล้วไปเลือกผู้ดูแลที่หน้า Event"
                : "ตั้งชื่อก่อน แล้วไปกรอกรายละเอียดใน Wizard"}
            </p>
          </div>
          <button onClick={onClose} aria-label="ปิด">
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="mt-4">
          <label className="text-sm font-medium">ชื่อ Event *</label>
          <input
            ref={nameRef}
            autoFocus
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            placeholder="เช่น ปฐมนิเทศนักศึกษาใหม่ 2569"
            className="mt-1 w-full rounded-lg bg-slate-100 px-3 py-2 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-lg bg-slate-100 px-4 py-2 text-sm hover:bg-slate-200"
          >
            ยกเลิก
          </button>
          <button
            onClick={handleCreate}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            สร้าง Event
          </button>
        </div>
      </div>
    </div>
  );
}
