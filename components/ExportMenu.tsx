// components/ExportMenu.tsx
// ปุ่ม Export ปุ่มเดียว กดแล้วเลือกได้ว่าจะเอา CSV หรือ PDF
"use client";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, Download, FileSpreadsheet, FileText } from "lucide-react";

export function ExportMenu({
  onExport,
  label = "Export",
  className = "",
}: {
  onExport: (type: "csv" | "pdf") => void;
  label?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // คลิกนอกเมนู → ปิด
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  const pick = (type: "csv" | "pdf") => {
    setOpen(false);
    onExport(type);
  };

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
      >
        <Download size={16} /> {label} <ChevronDown size={14} />
      </button>
      {open && (
        <div className="absolute right-0 z-20 mt-2 w-48 overflow-hidden rounded-xl border border-slate-100 bg-white py-1 shadow-lg">
          <button onClick={() => pick("csv")} className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm hover:bg-slate-50">
            <FileSpreadsheet size={16} className="text-green-600" /> CSV (Excel)
          </button>
          <button onClick={() => pick("pdf")} className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm hover:bg-slate-50">
            <FileText size={16} className="text-red-500" /> PDF
          </button>
        </div>
      )}
    </div>
  );
}
