"use client";
// ฟ้าใส: lib/use-drag-sort.ts
// ฟ้าใส: ลากเรียงลำดับรายการ (HTML5 drag & drop ของเบราว์เซอร์ ไม่ใช้ไลบรารี) — ใช้กับทุกอย่างที่เรียงได้:
// ฟ้าใส: รูปโฆษณา, ช่องในฟอร์มลงทะเบียน, คำถามใน Survey Builder
//
// ฟ้าใส: - ลากได้เฉพาะเมื่อกดที่ "ที่จับ" (ไอคอน ⋮⋮) → พิมพ์/เลือกข้อความในช่อง input ของการ์ดได้ตามปกติ
// ฟ้าใส: - ระหว่างลาก เปลี่ยนแค่สไตล์ (จาง / มีกรอบ) ไม่ย้ายข้อมูล → ไม่กระตุก
// ฟ้าใส: - ย้ายลำดับใน array ครั้งเดียวตอนปล่อย แล้วส่งให้ onChange

import { useState } from "react";

// ฟ้าใส: hook ลากเรียงลำดับ: รับรายการ + ฟังก์ชันบันทึกลำดับใหม่
export function useDragSort<T>(items: T[], onChange: (next: T[]) => void) {
  const [armed, setArmed] = useState<number | null>(null); // ฟ้าใส: กดที่จับค้างอยู่ (ยังไม่เริ่มลาก)
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);

  // ฟ้าใส: จบการลาก → ล้างสถานะทั้งหมด
  const end = () => {
    setArmed(null);
    setDragIdx(null);
    setOverIdx(null);
  };

  /** ฟ้าใส: ใส่ที่ "ที่จับ" ของแต่ละรายการ */
  const handleProps = (i: number) => ({
    // ฟ้าใส: กดที่จับ → พร้อมลาก
    onPointerDown: () => setArmed(i),
    // ฟ้าใส: ปล่อยเมาส์ → ยกเลิกพร้อมลาก
    onPointerUp: () => setArmed(null),
    "aria-label": "ลากเพื่อเรียงลำดับ",
    className: "cursor-grab touch-none active:cursor-grabbing",
  });

  /** ฟ้าใส: ใส่ที่ตัวรายการ (การ์ด / แถว) */
  const itemProps = (i: number) => ({
    draggable: armed === i || dragIdx === i,
    // ฟ้าใส: เริ่มลาก: จำว่าลากรายการไหน
    onDragStart: (e: React.DragEvent) => {
      setDragIdx(i);
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", String(i)); // ฟ้าใส: Firefox ต้องมีข้อมูลถึงจะเริ่มลาก
    },
    // ฟ้าใส: ลากผ่านรายการอื่น: จำว่าจะวางตรงไหน
    onDragOver: (e: React.DragEvent) => {
      if (dragIdx === null) return; // ฟ้าใส: ไม่ใช่การลากรายการของเรา (เช่น ลากไฟล์มาวาง)
      e.preventDefault();
      // ฟ้าใส: เปลี่ยนตำแหน่งที่จะวางเมื่อย้ายไปรายการใหม่
      if (overIdx !== i) setOverIdx(i);
    },
    // ฟ้าใส: ปล่อยรายการ: ย้ายลำดับ
    onDrop: (e: React.DragEvent) => {
      // ฟ้าใส: ไม่ได้ลากรายการของเรา → ไม่ทำอะไร
      if (dragIdx === null) return;
      e.preventDefault();
      // ฟ้าใส: วางคนละที่กับที่หยิบ → ย้ายจริง
      if (dragIdx !== i) {
        // ฟ้าใส: คัดลอกรายการก่อนแก้ (ไม่แก้ของเดิมตรง ๆ)
        const next = [...items];
        const [moved] = next.splice(dragIdx, 1); // ฟ้าใส: ย้ายลำดับsplice ครั้งเดียวตอนปล่อย
        next.splice(i, 0, moved);
        onChange(next);
      }
      end();
    },
    onDragEnd: end,
  });

  /** ฟ้าใส: สถานะของรายการ i สำหรับใส่สไตล์ */
  const stateOf = (i: number) => ({
    dragging: dragIdx === i,
    over: overIdx === i && dragIdx !== null && dragIdx !== i,
  });

  return { handleProps, itemProps, stateOf };
}
