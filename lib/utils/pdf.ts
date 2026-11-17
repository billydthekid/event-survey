// lib/utils/pdf.ts

// แปลงตาราง (แถวแรก = หัวตาราง) → หน้าพิมพ์ แล้วเปิดหน้าต่างพิมพ์ให้เลือก "บันทึกเป็น PDF"
// ใช้ฟอนต์ของเบราว์เซอร์ ภาษาไทยจึงไม่เพี้ยน และไม่ต้องติดตั้งไลบรารีเพิ่ม
export function downloadPDF(title: string, rows: (string | number)[][]) {
  const esc = (v: string | number) =>
    String(v).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
  const [header, ...body] = rows;
  const printedAt = new Date().toLocaleString("th-TH", { timeZone: "Asia/Bangkok" });

  const html = `<!doctype html><html lang="th"><head><meta charset="utf-8"><title>${esc(title)}</title>
<style>
  @page { size: A4 landscape; margin: 12mm; }
  body { font-family: "Sarabun", "Tahoma", sans-serif; color: #1F1D2B; }
  h1 { font-size: 18px; margin: 0 0 4px; }
  p { font-size: 11px; color: #6E6A7C; margin: 0 0 12px; }
  table { width: 100%; border-collapse: collapse; font-size: 11px; }
  th { background: #2563EB; color: #fff; text-align: left; }
  th, td { border: 1px solid #DCD9E3; padding: 6px 8px; vertical-align: top; }
  tr:nth-child(even) td { background: #F7F6FA; }
  * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
</style></head><body>
<h1>${esc(title)}</h1><p>พิมพ์เมื่อ ${esc(printedAt)}</p>
<table><thead><tr>${header.map((h) => `<th>${esc(h)}</th>`).join("")}</tr></thead>
<tbody>${body.map((r) => `<tr>${r.map((c) => `<td>${esc(c)}</td>`).join("")}</tr>`).join("")}</tbody></table>
</body></html>`;

  // iframe ซ่อน → สั่งพิมพ์ → ผู้ใช้เลือก "Save as PDF"
  const frame = document.createElement("iframe");
  frame.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0";
  document.body.appendChild(frame);
  const doc = frame.contentDocument!;
  doc.open();
  doc.write(html);
  doc.close();
  frame.onload = () => {
    frame.contentWindow!.focus();
    frame.contentWindow!.print();
    setTimeout(() => frame.remove(), 1000);
  };
}
