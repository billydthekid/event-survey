// components/dashboard/EventStatusCard.tsx
import { ClipboardList, Lock, QrCode, TabletSmartphone, Users, type LucideIcon } from "lucide-react";
import { Event } from "@/types";
import { isEditLocked } from "@/lib/utils/eventInfo";

// การ์ด "สถานะ Event" (หน้า ③) — 5 แถว: QR ลงทะเบียน · Survey · จอ Kiosk · ทีมดูแล · แก้ไขข้อมูล
// ข้อมูลที่ Event ยังไม่ได้กรอก (เช่น Draft) แสดง "ยังไม่กำหนด"

const TONE = {
  green: "bg-green-50 text-green-600",
  blue: "bg-blue-50 text-blue-600",
  purple: "bg-purple-50 text-purple-600",
  pink: "bg-pink-50 text-pink-600",
  orange: "bg-orange-50 text-orange-600",
};

const KIOSK_LABEL: Record<Event["kiosk"]["screen"], string> = {
  register: "แสดง QR ลงทะเบียน",
  survey: "แสดง QR Survey",
  both: "แสดง QR ทั้งคู่",
};

// ช่วงเปิด-ปิดลงทะเบียน เทียบกับเวลาปัจจุบัน
function registrationState(event: Event, now: Date): { text: string; open: boolean } {
  const { opensAt, closesAt } = event.registration;
  if (!opensAt || !closesAt) return { text: "ยังไม่กำหนด", open: false };
  const t = now.getTime();
  if (t < new Date(opensAt).getTime()) return { text: "ยังไม่เปิด", open: false };
  if (t < new Date(closesAt).getTime()) return { text: "เปิดรับอยู่", open: true };
  return { text: "ปิดแล้ว", open: false };
}

function surveyState(event: Event): string {
  if (!event.survey) return "ยังไม่กำหนด";
  const count = event.survey.questions.length;
  return `${event.survey.enabled ? "เปิดใช้" : "ปิดอยู่"} · ${count} ข้อ`;
}

interface Row {
  icon: LucideIcon;
  tone: keyof typeof TONE;
  label: string;
  value: string;
  highlight?: boolean;   // ตัวหนังสือสีเขียว (เช่น เปิดรับอยู่)
}

interface EventStatusCardProps {
  event: Event;
  now: Date;
}

export function EventStatusCard({ event, now }: EventStatusCardProps) {
  const reg = registrationState(event, now);

  const rows: Row[] = [
    { icon: QrCode, tone: "green", label: "QR ลงทะเบียน", value: reg.text, highlight: reg.open },
    { icon: ClipboardList, tone: "blue", label: "Survey", value: surveyState(event) },
    { icon: TabletSmartphone, tone: "purple", label: "จอ Kiosk", value: KIOSK_LABEL[event.kiosk.screen] },
    { icon: Users, tone: "pink", label: "ทีมดูแล", value: `${event.adminIds.length} คน` },
    // กฎล็อกอยู่ใน isEditLocked (ตกลงกับ Jin 13 พ.ย.) — ใช้ร่วมกับหน้า Event
    {
      icon: Lock,
      tone: "orange",
      label: "แก้ไขข้อมูล",
      value: isEditLocked(event) ? "ล็อกแล้ว" : "แก้ไขได้",
    },
  ];

  return (
    <div className="h-full rounded-xl bg-white p-5 shadow-sm">
      <h2 className="font-bold">สถานะ Event</h2>

      <ul className="mt-2">
        {rows.map((r) => (
          <li key={r.label} className="flex items-center justify-between border-b border-slate-100 py-3 text-sm last:border-0">
            <span className="flex items-center gap-3">
              <span className={`rounded-lg p-1.5 ${TONE[r.tone]}`}>
                <r.icon size={16} />
              </span>
              {r.label}
            </span>
            <span className={r.highlight ? "text-green-600" : "text-slate-500"} suppressHydrationWarning>
              {r.value}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
