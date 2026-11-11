// components/dashboard/KpiCard.tsx
import { type LucideIcon } from "lucide-react";

// การ์ดตัวเลขสรุป 1 ใบ — ใช้ทั้งหน้า ② (ภาพรวม) และหน้า ③ (เจาะ Event)
// รับข้อมูลผ่าน props อย่างเดียว ไม่อ่าน store เอง

// สีกล่องไอคอน — อยากได้สีเพิ่มก็เติมที่นี่
const TONE = {
  blue: "bg-blue-50 text-blue-600",
  green: "bg-green-50 text-green-600",
  purple: "bg-purple-50 text-purple-600",
};

interface KpiCardProps {
  icon: LucideIcon;
  label: string;
  value: number | string;
  sub?: string;                 // บรรทัดเล็กใต้ตัวเลข (ไม่ใส่ก็ได้)
  tone?: keyof typeof TONE;     // ไม่ใส่ = น้ำเงิน
}

export function KpiCard({ icon: Icon, label, value, sub, tone = "blue" }: KpiCardProps) {
  return (
    <div className="rounded-xl bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <span className={`rounded-lg p-2 ${TONE[tone]}`}>
          <Icon size={18} />
        </span>
        {label}
      </div>

      {/* ตัวเลขใส่ comma ให้ เช่น 1,234 */}
      <p className="mt-4 text-3xl font-bold">
        {typeof value === "number" ? value.toLocaleString("th-TH") : value}
      </p>

      {sub && <p className="mt-1 text-sm text-slate-400">{sub}</p>}
    </div>
  );
}
