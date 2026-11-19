// ฟ้าใส: lib/allow-list.ts
// ฟ้าใส: รายชื่อผู้มีสิทธิ์ลงทะเบียนของ "Event ปิด" (import จากไฟล์ CSV / Excel ในขั้นที่ 1 ของ Wizard)
// ฟ้าใส: - เลือกตรวจด้วย "อีเมล" หรือ "เบอร์มือถือ" อย่างใดอย่างหนึ่ง
// ฟ้าใส: - หน้า /r/<code> จะรับเฉพาะคนที่อีเมล/เบอร์ตรงกับรายชื่อ
// ฟ้าใส: - เก็บค่าแบบ normalize แล้ว (อีเมลตัวเล็ก, เบอร์เหลือแต่ตัวเลขขึ้นต้น 0) เพื่อเทียบตรง ๆ ได้
import type { AllowList, AllowListKind, EventDraft } from "@/types/event";

// ฟ้าใส: ชื่อชนิดรายชื่อ (ไทย)
export const ALLOW_KIND_LABEL: Record<AllowListKind, string> = { email: "อีเมล", phone: "เบอร์มือถือ" };
// ฟ้าใส: ชื่อชนิดรายชื่อ (อังกฤษ)
export const ALLOW_KIND_LABEL_EN: Record<AllowListKind, string> = { email: "email", phone: "mobile number" };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // ฟ้าใส: ตรวจอีเมล

/** ฟ้าใส: ทำให้อยู่ในรูปมาตรฐาน · คืน null ถ้ารูปแบบไม่ถูกต้อง */
export function normalizeContact(kind: AllowListKind, raw: string): string | null { // ฟ้าใส: แปลงรูปแบบ (+66→0, เติม 0)
  // ฟ้าใส: ตัดช่องว่างหน้า–หลัง
  const v = raw.trim();
  // ฟ้าใส: ค่าว่าง → ใช้ไม่ได้
  if (!v) return null;
  // ฟ้าใส: อีเมล: ตัวเล็กทั้งหมด แล้วตรวจรูปแบบ
  if (kind === "email") {
    // ฟ้าใส: อีเมลแบบตัวพิมพ์เล็ก
    const e = v.toLowerCase();
    return EMAIL_RE.test(e) ? e : null;
  }
  // ฟ้าใส: เบอร์: ตัดทุกอย่างที่ไม่ใช่ตัวเลข, +66 / 66 นำหน้า → 0, Excel ตัด 0 หน้าทิ้ง (812345678) → เติม 0 กลับ
  let d = v.replace(/\D/g, "");
  // ฟ้าใส: เบอร์ขึ้นต้น 66 (รหัสประเทศ) → เปลี่ยนเป็น 0
  if (d.startsWith("66") && d.length === 11) d = "0" + d.slice(2);
  // ฟ้าใส: เบอร์ 9 หลักที่ไม่มี 0 นำหน้า → เติม 0
  if (!d.startsWith("0") && d.length === 9) d = "0" + d;
  return /^0\d{8,9}$/.test(d) ? d : null;
}

// ฟ้าใส: Event นี้เปิดโหมดรายชื่ออยู่ไหม (ปิด + มีรายชื่อ)
export function isActive(list: AllowList | undefined): list is AllowList {
  return !!list && list.closed && list.values.length > 0;
}

/** ฟ้าใส: ผู้กรอกฟอร์มมีชื่อในรายชื่อไหม (รายชื่อไม่ได้เปิดใช้ = ผ่านเสมอ) */
export function isAllowed(list: AllowList | undefined, raw: string): boolean { // ฟ้าใส: เช็กตอนลงทะเบียน
  // ฟ้าใส: ไม่ได้ใช้รายชื่อ → ทุกคนลงทะเบียนได้
  if (!isActive(list)) return true;
  // ฟ้าใส: ทำค่าที่กรอกให้อยู่ในรูปแบบเดียวกับในรายชื่อ
  const v = normalizeContact(list.kind, raw);
  return v !== null && list.values.includes(v);
}

/**
 * Event ปิด (รับเฉพาะรายชื่อที่ import) ยังทำไม่เสร็จ → ปิดไว้ก่อนเทอมนี้
 * false = ส่วน "ผู้ที่ลงทะเบียนได้" ในขั้นที่ 1 เบลอ กดไม่ได้ และไม่ตรวจรายชื่อตอนกดถัดไป / เผยแพร่
 * เปิดใช้อีกครั้ง: เปลี่ยนเป็น true
 */
export const ALLOW_LIST_READY = false;

/** ฟ้าใส: ปัญหาของ Event ปิดที่ต้องแก้ก่อนเผยแพร่ (ไม่มีปัญหา = undefined) */
export function allowListProblem(d: EventDraft, lang: "th" | "en" = "th"): string | undefined {
  // ฟ้าใส: ภาษาอังกฤษไหม
  const en = lang === "en";
  // ฟ้าใส: การตั้งค่ารายชื่อของ Event
  const list = d.allowList;
  if (!ALLOW_LIST_READY || !list?.closed) return undefined; // ฟ้าใส: ยังไม่เปิดใช้ = ไม่ตรวจ
  // ฟ้าใส: ชื่อชนิดรายชื่อตามภาษา
  const label = (en ? ALLOW_KIND_LABEL_EN : ALLOW_KIND_LABEL)[list.kind];
  // ฟ้าใส: ยังไม่ได้ import รายชื่อ
  if (list.values.length === 0) return en ? "Closed event: no attendee list imported yet (step 1)" : `Event ปิด: ยังไม่ได้ import รายชื่อ (ขั้นที่ 1)`;
  // ฟ้าใส: ฟอร์มว่าง = หน้า /r ใช้ฟอร์มตั้งต้น (ชื่อ + อีเมล) ดู DEFAULT_FIELDS ใน lib/public-event.ts
  // ฟ้าใส: ตรวจจากประเภทช่อง Email / Phone Number (หน้า /r ใช้ช่องประเภทนี้ช่องแรกเป็น key "email" / "phone")
  const kinds: string[] = d.form.fields.length > 0 ? d.form.fields.map((f) => f.kind) : ["short", "email"];
  // ฟ้าใส: ฟอร์มต้องมีช่องชนิดเดียวกับที่ใช้ตรวจ (อีเมล / เบอร์)
  if (!kinds.includes(list.kind))
    return en ? `Closed event: the registration form (step 3) needs a ${label} field` : `Event ปิด: ฟอร์มลงทะเบียน (ขั้นที่ 3) ต้องมีช่องประเภท${label}`;
  return undefined;
}

// ฟ้าใส: ============ อ่านไฟล์ ============
export interface ParseResult {
  values: string[]; // ฟ้าใส: ค่าที่ถูกต้อง (ไม่ซ้ำ)
  invalid: string[]; // ฟ้าใส: แถวที่รูปแบบผิด (ค่าดิบ)
  duplicates: number; // ฟ้าใส: จำนวนแถวที่ซ้ำ (ตัดออกแล้ว)
  column: string; // ฟ้าใส: ชื่อคอลัมน์ที่ใช้ (หรือ "คอลัมน์แรก")
}

const HEADER_HINTS: Record<AllowListKind, RegExp> = { // ฟ้าใส: หาคอลัมน์ email/เบอร์
  email: /e-?mail|อีเมล/i,
  phone: /phone|mobile|tel|เบอร์|โทร|มือถือ/i,
};

/** ฟ้าใส: อ่านไฟล์ .csv / .xlsx / .xls → แถวของ string (แถวแรกอาจเป็นหัวตาราง) */
export async function readRows(file: File): Promise<string[][]> {
  // ฟ้าใส: โหลด SheetJS เฉพาะตอน import (ไม่ให้ bundle ของหน้าอื่นใหญ่ขึ้น) · อ่านได้ทั้ง CSV และ Excel
  const XLSX = await import("xlsx"); // ฟ้าใส: อ่าน Excel/CSV
  // ฟ้าใส: เป็นไฟล์ CSV ไหม
  const isCsv = /\.csv$/i.test(file.name);
  // ฟ้าใส: CSV อ่านเป็นข้อความ UTF-8 (ภาษาไทยไม่เพี้ยน) · Excel อ่านเป็น binary
  const wb = isCsv
    ? XLSX.read(await file.text(), { type: "string", raw: true })
    : XLSX.read(await file.arrayBuffer(), { type: "array" });
  // ฟ้าใส: ใช้ชีตแรกของไฟล์
  const sheet = wb.Sheets[wb.SheetNames[0]];
  // ฟ้าใส: ไม่มีชีต → ไม่มีข้อมูล
  if (!sheet) return [];
  // ฟ้าใส: อ่านทุกแถวเป็น array ของข้อความ
  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, raw: false, defval: "" });
  return rows.map((r) => r.map((c) => String(c ?? "").trim())).filter((r) => r.some(Boolean));
}

/** ฟ้าใส: เลือกคอลัมน์ตามชื่อหัวตาราง (ไม่เจอ → คอลัมน์แรก) แล้วตรวจ/ตัดซ้ำ */
export function parseRows(kind: AllowListKind, rows: string[][]): ParseResult { // ฟ้าใส: อ่านแถว
  // ฟ้าใส: ไฟล์ว่าง → ไม่มีรายชื่อ
  if (rows.length === 0) return { values: [], invalid: [], duplicates: 0, column: "-" };

  // ฟ้าใส: หาคอลัมน์จากหัวตาราง (email / phone)
  let col = rows[0].findIndex((h) => HEADER_HINTS[kind].test(h));
  // ฟ้าใส: แถวที่จะอ่าน (เริ่มจากทั้งหมด)
  let body = rows;
  // ฟ้าใส: ชื่อคอลัมน์ที่ใช้ (ไว้แสดงผล)
  let column = "คอลัมน์แรก";
  // ฟ้าใส: เจอหัวตาราง → ข้ามแถวหัวตาราง
  if (col >= 0) {
    column = rows[0][col];
    body = rows.slice(1);
  } else {
    col = 0;
    // ฟ้าใส: แถวแรกไม่ใช่ข้อมูลที่ถูกต้อง (เช่นหัวตารางชื่ออื่น) → ถือเป็นหัวตาราง ข้ามไป
    if (normalizeContact(kind, rows[0][0] ?? "") === null) body = rows.slice(1);
  }

  const seen = new Set<string>(); // ฟ้าใส: ตัดซ้ำ
  // ฟ้าใส: แถวที่รูปแบบผิด
  const invalid: string[] = [];
  // ฟ้าใส: จำนวนที่ซ้ำ
  let duplicates = 0;
  for (const r of body) {
    // ฟ้าใส: ค่าในคอลัมน์ที่ใช้
    const raw = r[col] ?? "";
    // ฟ้าใส: แถวว่าง → ข้าม
    if (!raw) continue;
    // ฟ้าใส: ทำให้อยู่ในรูปแบบมาตรฐาน
    const v = normalizeContact(kind, raw);
    // ฟ้าใส: รูปแบบผิด → เก็บไว้รายงาน
    if (v === null) invalid.push(raw);
    else if (seen.has(v)) duplicates++;
    else seen.add(v);
  }
  return { values: [...seen], invalid, duplicates, column };
}

/** ฟ้าใส: ไฟล์ตัวอย่างให้ดาวน์โหลด (มี BOM ให้ Excel เปิดภาษาไทยได้) */
export function templateCsv(kind: AllowListKind): string { // ฟ้าใส: สร้างไฟล์ตัวอย่าง
  // ฟ้าใส: แถวของไฟล์ตัวอย่าง
  const rows =
    kind === "email"
      ? ["email", "somchai@example.com", "suda@example.com"]
      : ["phone", "0812345678", "0898765432"];
  return "﻿" + rows.join("\r\n");
}
