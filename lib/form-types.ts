// ฟ้าใส: lib/form-types.ts
// ฟ้าใส: ประเภทช่องในฟอร์มลงทะเบียน 12 แบบ (แบบ Google Form) — ใช้ร่วมกัน: Wizard ขั้นที่ 3, Preview ฟอร์ม, หน้า /r
import {
  AlignLeft, Calendar, CheckSquare, ChevronDown, CircleDot, Clock, Hash, Mail, MapPin, Paperclip, Phone, Type,
  // ฟ้าใส: ชนิดของไอคอน
  type LucideIcon,
} from "lucide-react";
import type { FieldKind, FormField } from "@/types/event";

// ฟ้าใส: ประเภทช่องในฟอร์มทั้ง 12 แบบ
export const FORM_KINDS: {
  value: FieldKind;
  th: string; // ฟ้าใส: ชื่อประเภท (ไทย)
  en: string; // ฟ้าใส: ชื่อประเภทแบบ Google Form
  example: string; // ฟ้าใส: ตัวอย่างการใช้งาน → ใช้เป็นชื่อช่องตั้งต้นตอนเพิ่ม
  exampleEn: string; // ฟ้าใส: ตัวอย่าง (อังกฤษ) ใช้ตอนหน้าตั้งค่าเป็น EN
  icon: LucideIcon;
  hasOptions: boolean; // ฟ้าใส: ต้องตั้งตัวเลือก
}[] = [
  { value: "short", th: "ข้อความสั้น", en: "Short Answer", example: "ชื่อ – นามสกุล", exampleEn: "Full name", icon: Type, hasOptions: false },
  { value: "paragraph", th: "ข้อความยาว", en: "Paragraph", example: "ข้อมูลเพิ่มเติม", exampleEn: "Additional info", icon: AlignLeft, hasOptions: false },
  { value: "email", th: "อีเมล", en: "Email", example: "อีเมล", exampleEn: "Email", icon: Mail, hasOptions: false },
  { value: "phone", th: "เบอร์โทรศัพท์", en: "Phone Number", example: "เบอร์โทรศัพท์", exampleEn: "Phone number", icon: Phone, hasOptions: false },
  { value: "number", th: "ตัวเลข", en: "Number", example: "อายุ", exampleEn: "Age", icon: Hash, hasOptions: false },
  { value: "radio", th: "ตัวเลือกเดียว", en: "Multiple Choice", example: "เลือกรอบกิจกรรม", exampleEn: "Choose a session", icon: CircleDot, hasOptions: true },
  { value: "checkbox", th: "หลายตัวเลือก", en: "Checkboxes", example: "เลือกกิจกรรมที่สนใจ", exampleEn: "Activities you are interested in", icon: CheckSquare, hasOptions: true },
  { value: "dropdown", th: "Dropdown", en: "Dropdown", example: "เลือกคณะ / สาขา", exampleEn: "Faculty / major", icon: ChevronDown, hasOptions: true },
  { value: "date", th: "วันที่", en: "Date", example: "วันที่ต้องการเข้าร่วม", exampleEn: "Preferred date", icon: Calendar, hasOptions: false },
  { value: "time", th: "เวลา", en: "Time", example: "เวลาที่ต้องการเข้าร่วม", exampleEn: "Preferred time", icon: Clock, hasOptions: false },
  { value: "file", th: "แนบไฟล์", en: "File Upload", example: "แนบเอกสาร / รูปภาพ", exampleEn: "Attach a document / photo", icon: Paperclip, hasOptions: false },
  { value: "address", th: "ที่อยู่", en: "Address", example: "ที่อยู่", exampleEn: "Address", icon: MapPin, hasOptions: false },
];

// ฟ้าใส: หาข้อมูลของประเภทช่อง (ไม่พบ = ข้อความสั้น)
export const formKind = (k: FieldKind) => FORM_KINDS.find((x) => x.value === k) ?? FORM_KINDS[0];

// ฟ้าใส: ตัวเลือกตั้งต้นของช่องแบบเลือก
export const DEFAULT_OPTIONS = ["ตัวเลือก 1", "ตัวเลือก 2"];
/** ฟ้าใส: ตัวเลือกตั้งต้นตามภาษาของหน้าตั้งค่า (lib/wizard-lang.ts) */
export const defaultOptions = (lang: "th" | "en") => (lang === "en" ? ["Option 1", "Option 2"] : [...DEFAULT_OPTIONS]);

// ฟ้าใส: ============ ข้อมูลเก่า → ประเภทใหม่ ============
// ฟ้าใส: เดิมมี "ช่องพื้นฐาน" (basicKey) + 5 ประเภท (text/email/number/dropdown/multiselect)
type LegacyField = Omit<FormField, "kind"> & { kind: string; basicKey?: string };
// ฟ้าใส: ประเภทเก่า → ประเภทใหม่
const LEGACY_KIND: Record<string, FieldKind> = { text: "short", multiselect: "checkbox" };
// ฟ้าใส: ช่องพื้นฐานเก่า → ประเภทใหม่
const BASIC_KIND: Record<string, FieldKind> = {
  name: "short", email: "email", age: "number", gender: "radio", phone: "phone", idno: "short",
};

export function migrateField(f: LegacyField): FormField { // ฟ้าใส: แปลงข้อมูลเก่า → ประเภทใหม่ (ใช้ตอนอ่าน draft จาก localStorage / DB)
  // ฟ้าใส: หาประเภทใหม่ของช่องเก่า
  const kind = (f.basicKey && BASIC_KIND[f.basicKey]) || LEGACY_KIND[f.kind] || (f.kind as FieldKind);
  // ฟ้าใส: ตัวเลือก: ใช้ของเดิม / เพศ = ชาย หญิง ไม่ระบุ / ประเภทเลือก = ตัวเลือกตั้งต้น
  const options =
    f.options ?? (f.basicKey === "gender" ? ["ชาย", "หญิง", "ไม่ระบุ"] : formKind(kind).hasOptions ? [...DEFAULT_OPTIONS] : undefined);
  return { id: f.id, label: f.label, kind, hint: formKind(kind).th, required: f.required, options };
}

// ฟ้าใส: ============ key ที่ใช้เก็บคำตอบบนหน้า /r ============
// ฟ้าใส: หน้า Report / Event ปิด อ่านคำตอบจาก key มาตรฐาน: "name", "email", "phone"
// ฟ้าใส: → ช่องอีเมล/เบอร์ช่องแรก ใช้ key มาตรฐาน · ช่องข้อความสั้นช่องแรกที่ชื่อมีคำว่า "ชื่อ" ใช้ "name" · ที่เหลือใช้ id
export function answerKeys(fields: FormField[]): Record<string, string> {
  // ฟ้าใส: ผลลัพธ์: id ของช่อง → key ที่ใช้เก็บคำตอบ
  const keys: Record<string, string> = {};
  // ฟ้าใส: key ที่ใช้ไปแล้ว
  const used = new Set<string>();
  // ฟ้าใส: จอง key ให้ช่อง (ถ้ายังไม่มีใครใช้)
  const take = (f: FormField, k: string) => {
    // ฟ้าใส: ถูกใช้แล้ว → จองไม่ได้
    if (used.has(k)) return false;
    used.add(k);
    keys[f.id] = k;
    return true;
  };
  for (const f of fields) {
    // ฟ้าใส: ช่องอีเมลช่องแรก → key email
    if (f.kind === "email" && take(f, "email")) continue;
    // ฟ้าใส: ช่องเบอร์ช่องแรก → key phone
    if (f.kind === "phone" && take(f, "phone")) continue;
    // ฟ้าใส: ช่องข้อความสั้นที่มีคำว่า ชื่อ → key name
    if (f.kind === "short" && f.label.includes("ชื่อ") && take(f, "name")) continue;
    keys[f.id] = f.id;
  }
  return keys;
}
