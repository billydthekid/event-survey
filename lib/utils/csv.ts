// lib/utils/csv.ts

// แปลงตาราง (array ของ array) → ไฟล์ CSV แล้วดาวน์โหลด
export function downloadCSV(filename: string, rows: (string | number)[][]) {
  // ครอบทุกช่องด้วย " และ escape " ข้างใน (กัน comma ในข้อความทำคอลัมน์เพี้ยน)
  const text = rows
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");

  // \uFEFF (BOM) ทำให้ Excel อ่านภาษาไทยไม่เพี้ยน
  const blob = new Blob(["\uFEFF" + text], { type: "text/csv;charset=utf-8" });

  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}