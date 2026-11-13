// components/dashboard/DonutCard.tsx
import { responseRate } from "@/lib/utils/stats";

// กราฟโดนัท % ตอบ Survey — วาดด้วย SVG เอง (ไม่ลง library กราฟ)
// หลักการ: วงกลม 2 วงซ้อนกัน วงล่างสีเทาเต็มวง วงบนสีน้ำเงินแต่ "ขีดเส้น" แค่ x% ของเส้นรอบวง

const R = 52;                       // รัศมี (หน่วยใน viewBox 120 × 120)
const CIRCLE = 2 * Math.PI * R;     // เส้นรอบวง = 2πr

interface DonutCardProps {
  done: number;     // ตอบแล้ว
  total: number;    // ลงทะเบียนทั้งหมด
  title?: string;
}

export function DonutCard({ done, total, title = "สัดส่วนการตอบ Survey" }: DonutCardProps) {
  const rate = responseRate(done, total);   // เช่น 38.5
  const arc = (rate / 100) * CIRCLE;        // ความยาวเส้นสีน้ำเงิน

  return (
    <div className="h-full rounded-xl bg-white p-5 shadow-sm">
      <h2 className="font-bold">{title}</h2>

      <div className="relative mx-auto mt-4 h-40 w-40">
        {/* -rotate-90 = ให้เส้นเริ่มที่ 12 นาฬิกา (ปกติ SVG เริ่มที่ 3 นาฬิกา) */}
        <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
          <circle cx="60" cy="60" r={R} fill="none" strokeWidth="12" className="stroke-slate-100" />
          {/* strokeDasharray="ยาวเส้น ยาวช่องว่าง" → ขีดแค่ arc แล้วเว้นที่เหลือ · 0% ไม่วาด (กันจุดกลมโผล่) */}
          {rate > 0 && (
            <circle
              cx="60" cy="60" r={R} fill="none" strokeWidth="12" strokeLinecap="round"
              className="stroke-blue-600"
              strokeDasharray={`${arc} ${CIRCLE}`}
            />
          )}
        </svg>

        {/* ตัวเลขกลางวง */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-2xl font-bold">{rate}%</p>
          <p className="text-xs text-slate-400">
            {done.toLocaleString("th-TH")} จาก {total.toLocaleString("th-TH")} คน
          </p>
        </div>
      </div>

      <div className="mt-4 flex justify-between text-xs">
        <span className="rounded-full bg-blue-50 px-3 py-1 text-blue-600">
          ตอบแล้ว {done.toLocaleString("th-TH")}
        </span>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-500">
          ยังไม่ตอบ {(total - done).toLocaleString("th-TH")}
        </span>
      </div>
    </div>
  );
}
