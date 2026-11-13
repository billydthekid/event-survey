"use client";
// lib/use-drag-sort.ts
// ลากเรียงลำดับรายการ (HTML5 drag & drop ของเบราว์เซอร์ ไม่ใช้ไลบรารี) — ใช้กับทุกอย่างที่เรียงได้:
// รูปโฆษณา, ช่องในฟอร์มลงทะเบียน, คำถามใน Survey Builder
//
// - ลากได้เฉพาะเมื่อกดที่ "ที่จับ" (ไอคอน ⋮⋮) → พิมพ์/เลือกข้อความในช่อง input ของการ์ดได้ตามปกติ
// - ระหว่างลาก เปลี่ยนแค่สไตล์ (จาง / มีกรอบ) ไม่ย้ายข้อมูล → ไม่กระตุก
// - ย้ายลำดับใน array ครั้งเดียวตอนปล่อย แล้วส่งให้ onChange

import { useState } from "react";

export function useDragSort<T>(items: T[], onChange: (next: T[]) => void) {
  const [armed, setArmed] = useState<number | null>(null); // กดที่จับค้างอยู่ (ยังไม่เริ่มลาก)
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);

  const end = () => {
    setArmed(null);
    setDragIdx(null);
    setOverIdx(null);
  };

  /** ใส่ที่ "ที่จับ" ของแต่ละรายการ */
  const handleProps = (i: number) => ({
    onPointerDown: () => setArmed(i),
    onPointerUp: () => setArmed(null),
    "aria-label": "ลากเพื่อเรียงลำดับ",
    className: "cursor-grab touch-none active:cursor-grabbing",
  });

  /** ใส่ที่ตัวรายการ (การ์ด / แถว) */
  const itemProps = (i: number) => ({
    draggable: armed === i || dragIdx === i,
    onDragStart: (e: React.DragEvent) => {
      setDragIdx(i);
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", String(i)); // Firefox ต้องมีข้อมูลถึงจะเริ่มลาก
    },
    onDragOver: (e: React.DragEvent) => {
      if (dragIdx === null) return; // ไม่ใช่การลากรายการของเรา (เช่น ลากไฟล์มาวาง)
      e.preventDefault();
      if (overIdx !== i) setOverIdx(i);
    },
    onDrop: (e: React.DragEvent) => {
      if (dragIdx === null) return;
      e.preventDefault();
      if (dragIdx !== i) {
        const next = [...items];
        const [moved] = next.splice(dragIdx, 1);
        next.splice(i, 0, moved);
        onChange(next);
      }
      end();
    },
    onDragEnd: end,
  });

  /** สถานะของรายการ i สำหรับใส่สไตล์ */
  const stateOf = (i: number) => ({
    dragging: dragIdx === i,
    over: overIdx === i && dragIdx !== null && dragIdx !== i,
  });

  return { handleProps, itemProps, stateOf };
}
