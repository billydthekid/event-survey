import { AlignLeft, Calendar, ChevronDown, CircleDot, ListChecks, Star, Type, type LucideIcon } from "lucide-react";
import type { SurveyQType } from "@/types/event";

export const QTYPES: { value: SurveyQType; th: string; en: string; icon: LucideIcon; hasOptions: boolean }[] = [
  { value: "short", th: "ข้อความสั้น", en: "Short text", icon: Type, hasOptions: false },
  { value: "long", th: "ข้อความยาว", en: "Long text", icon: AlignLeft, hasOptions: false },
  { value: "single", th: "ตัวเลือกเดียว", en: "Single choice", icon: CircleDot, hasOptions: true },
  { value: "multi", th: "หลายตัวเลือก", en: "Multiple choice", icon: ListChecks, hasOptions: true },
  { value: "dropdown", th: "Dropdown", en: "Dropdown", icon: ChevronDown, hasOptions: true },
  { value: "rating", th: "Rating / Scale", en: "Rating / Scale", icon: Star, hasOptions: false },
  { value: "date", th: "วันที่", en: "Date", icon: Calendar, hasOptions: false },
];

export const qtype = (t: SurveyQType) => QTYPES.find((q) => q.value === t)!;
