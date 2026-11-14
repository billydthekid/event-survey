// lib/form-types.ts
// ประเภทช่องในฟอร์มลงทะเบียน 12 แบบ (แบบ Google Form) — ใช้ร่วมกัน: Wizard ขั้นที่ 4, Preview ฟอร์ม, หน้า /r
import {
  AlignLeft, Calendar, CheckSquare, ChevronDown, CircleDot, Clock, Hash, Mail, MapPin, Paperclip, Phone, Type,
  type LucideIcon,
} from "lucide-react";
import type { FieldKind, FormField } from "@/types/event";

export const FORM_KINDS: {
  value: FieldKind;
  th: string; // ชื่อประเภท (ไทย)
  en: string; // ชื่อประเภทแบบ Google Form
  example: string; // ตัวอย่างการใช้งาน → ใช้เป็นชื่อช่องตั้งต้นตอนเพิ่ม
  icon: LucideIcon;
  hasOptions: boolean; // ต้องตั้งตัวเลือก
}[] = [
  { value: "short", th: "ข้อความสั้น", en: "Short Answer", example: "ชื่อ – นามสกุล", icon: Type, hasOptions: false },
  { value: "paragraph", th: "ข้อความยาว", en: "Paragraph", example: "ข้อมูลเพิ่มเติม", icon: AlignLeft, hasOptions: false },
  { value: "email", th: "อีเมล", en: "Email", example: "อีเมล", icon: Mail, hasOptions: false },
  { value: "phone", th: "เบอร์โทรศัพท์", en: "Phone Number", example: "เบอร์โทรศัพท์", icon: Phone, hasOptions: false },
  { value: "number", th: "ตัวเลข", en: "Number", example: "อายุ", icon: Hash, hasOptions: false },
  { value: "radio", th: "ตัวเลือกเดียว", en: "Multiple Choice", example: "เลือกรอบกิจกรรม", icon: CircleDot, hasOptions: true },
  { value: "checkbox", th: "หลายตัวเลือก", en: "Checkboxes", example: "เลือกกิจกรรมที่สนใจ", icon: CheckSquare, hasOptions: true },
  { value: "dropdown", th: "Dropdown", en: "Dropdown", example: "เลือกคณะ / สาขา", icon: ChevronDown, hasOptions: true },
  { value: "date", th: "วันที่", en: "Date", example: "วันที่ต้องการเข้าร่วม", icon: Calendar, hasOptions: false },
  { value: "time", th: "เวลา", en: "Time", example: "เวลาที่ต้องการเข้าร่วม", icon: Clock, hasOptions: false },
  { value: "file", th: "แนบไฟล์", en: "File Upload", example: "แนบเอกสาร / รูปภาพ", icon: Paperclip, hasOptions: false },
  { value: "address", th: "ที่อยู่", en: "Address", example: "ที่อยู่", icon: MapPin, hasOptions: false },
];

export const formKind = (k: FieldKind) => FORM_KINDS.find((x) => x.value === k) ?? FORM_KINDS[0];

export const DEFAULT_OPTIONS = ["ตัวเลือก 1", "ตัวเลือก 2"];

// ============ ข้อมูลเก่า → ประเภทใหม่ ============
// เดิมมี "ช่องพื้นฐาน" (basicKey) + 5 ประเภท (text/email/number/dropdown/multiselect)
type LegacyField = Omit<FormField, "kind"> & { kind: string; basicKey?: string };
const LEGACY_KIND: Record<string, FieldKind> = { text: "short", multiselect: "checkbox" };
const BASIC_KIND: Record<string, FieldKind> = {
  name: "short", email: "email", age: "number", gender: "radio", phone: "phone", idno: "short",
};

export function migrateField(f: LegacyField): FormField { // แปลงข้อมูลเก่า → ประเภทใหม่ (ใช้ตอนอ่าน draft จาก localStorage / DB)
  const kind = (f.basicKey && BASIC_KIND[f.basicKey]) || LEGACY_KIND[f.kind] || (f.kind as FieldKind);
  const options =
    f.options ?? (f.basicKey === "gender" ? ["ชาย", "หญิง", "ไม่ระบุ"] : formKind(kind).hasOptions ? [...DEFAULT_OPTIONS] : undefined);
  return { id: f.id, label: f.label, kind, hint: formKind(kind).th, required: f.required, options };
}

// ============ key ที่ใช้เก็บคำตอบบนหน้า /r ============
// หน้า Report / Event ปิด อ่านคำตอบจาก key มาตรฐาน: "name", "email", "phone"
// → ช่องอีเมล/เบอร์ช่องแรก ใช้ key มาตรฐาน · ช่องข้อความสั้นช่องแรกที่ชื่อมีคำว่า "ชื่อ" ใช้ "name" · ที่เหลือใช้ id
export function answerKeys(fields: FormField[]): Record<string, string> {
  const keys: Record<string, string> = {};
  const used = new Set<string>();
  const take = (f: FormField, k: string) => {
    if (used.has(k)) return false;
    used.add(k);
    keys[f.id] = k;
    return true;
  };
  for (const f of fields) {
    if (f.kind === "email" && take(f, "email")) continue;
    if (f.kind === "phone" && take(f, "phone")) continue;
    if (f.kind === "short" && f.label.includes("ชื่อ") && take(f, "name")) continue;
    keys[f.id] = f.id;
  }
  return keys;
}
