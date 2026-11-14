// lib/allow-list.ts
// รายชื่อผู้มีสิทธิ์ลงทะเบียนของ "Event ปิด" (import จากไฟล์ CSV / Excel ในขั้นที่ 5 ของ Wizard)
// - เลือกตรวจด้วย "อีเมล" หรือ "เบอร์มือถือ" อย่างใดอย่างหนึ่ง
// - หน้า /r/<code> จะรับเฉพาะคนที่อีเมล/เบอร์ตรงกับรายชื่อ
// - เก็บค่าแบบ normalize แล้ว (อีเมลตัวเล็ก, เบอร์เหลือแต่ตัวเลขขึ้นต้น 0) เพื่อเทียบตรง ๆ ได้
import type { AllowList, AllowListKind, EventDraft } from "@/types/event";

export const ALLOW_KIND_LABEL: Record<AllowListKind, string> = { email: "อีเมล", phone: "เบอร์มือถือ" };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // ตรวจอีเมล

/** ทำให้อยู่ในรูปมาตรฐาน · คืน null ถ้ารูปแบบไม่ถูกต้อง */
export function normalizeContact(kind: AllowListKind, raw: string): string | null { // แปลงรูปแบบ (+66→0, เติม 0)
  const v = raw.trim();
  if (!v) return null;
  if (kind === "email") {
    const e = v.toLowerCase();
    return EMAIL_RE.test(e) ? e : null;
  }
  // เบอร์: ตัดทุกอย่างที่ไม่ใช่ตัวเลข, +66 / 66 นำหน้า → 0, Excel ตัด 0 หน้าทิ้ง (812345678) → เติม 0 กลับ
  let d = v.replace(/\D/g, "");
  if (d.startsWith("66") && d.length === 11) d = "0" + d.slice(2);
  if (!d.startsWith("0") && d.length === 9) d = "0" + d;
  return /^0\d{8,9}$/.test(d) ? d : null;
}

export function isActive(list: AllowList | undefined): list is AllowList {
  return !!list && list.closed && list.values.length > 0;
}

/** ผู้กรอกฟอร์มมีชื่อในรายชื่อไหม (รายชื่อไม่ได้เปิดใช้ = ผ่านเสมอ) */
export function isAllowed(list: AllowList | undefined, raw: string): boolean { // เช็กตอนลงทะเบียน
  if (!isActive(list)) return true;
  const v = normalizeContact(list.kind, raw);
  return v !== null && list.values.includes(v);
}

/** ปัญหาของ Event ปิดที่ต้องแก้ก่อนเผยแพร่ (ไม่มีปัญหา = undefined) */
export function allowListProblem(d: EventDraft): string | undefined {
  const list = d.allowList;
  if (!list?.closed) return undefined;
  const label = ALLOW_KIND_LABEL[list.kind];
  if (list.values.length === 0) return `Event ปิด: ยังไม่ได้ import รายชื่อ (ขั้นที่ 1)`;
  // ฟอร์มว่าง = หน้า /r ใช้ฟอร์มตั้งต้น (ชื่อ + อีเมล) ดู DEFAULT_FIELDS ใน lib/public-event.ts
  // ตรวจจากประเภทช่อง Email / Phone Number (หน้า /r ใช้ช่องประเภทนี้ช่องแรกเป็น key "email" / "phone")
  const kinds: string[] = d.form.fields.length > 0 ? d.form.fields.map((f) => f.kind) : ["short", "email"];
  if (!kinds.includes(list.kind)) return `Event ปิด: ฟอร์มลงทะเบียน (ขั้นที่ 3) ต้องมีช่องประเภท${label}`;
  return undefined;
}

// ============ อ่านไฟล์ ============
export interface ParseResult {
  values: string[]; // ค่าที่ถูกต้อง (ไม่ซ้ำ)
  invalid: string[]; // แถวที่รูปแบบผิด (ค่าดิบ)
  duplicates: number; // จำนวนแถวที่ซ้ำ (ตัดออกแล้ว)
  column: string; // ชื่อคอลัมน์ที่ใช้ (หรือ "คอลัมน์แรก")
}

const HEADER_HINTS: Record<AllowListKind, RegExp> = { //หาคอลัมน์ email/เบอร์
  email: /e-?mail|อีเมล/i,
  phone: /phone|mobile|tel|เบอร์|โทร|มือถือ/i,
};

/** อ่านไฟล์ .csv / .xlsx / .xls → แถวของ string (แถวแรกอาจเป็นหัวตาราง) */
export async function readRows(file: File): Promise<string[][]> {
  // โหลด SheetJS เฉพาะตอน import (ไม่ให้ bundle ของหน้าอื่นใหญ่ขึ้น) · อ่านได้ทั้ง CSV และ Excel
  const XLSX = await import("xlsx"); // อ่าน Excel/CSV
  const isCsv = /\.csv$/i.test(file.name);
  // CSV อ่านเป็นข้อความ UTF-8 (ภาษาไทยไม่เพี้ยน) · Excel อ่านเป็น binary
  const wb = isCsv
    ? XLSX.read(await file.text(), { type: "string", raw: true })
    : XLSX.read(await file.arrayBuffer(), { type: "array" });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  if (!sheet) return [];
  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, raw: false, defval: "" });
  return rows.map((r) => r.map((c) => String(c ?? "").trim())).filter((r) => r.some(Boolean));
}

/** เลือกคอลัมน์ตามชื่อหัวตาราง (ไม่เจอ → คอลัมน์แรก) แล้วตรวจ/ตัดซ้ำ */
export function parseRows(kind: AllowListKind, rows: string[][]): ParseResult { // อ่านแถว
  if (rows.length === 0) return { values: [], invalid: [], duplicates: 0, column: "-" };

  let col = rows[0].findIndex((h) => HEADER_HINTS[kind].test(h));
  let body = rows;
  let column = "คอลัมน์แรก";
  if (col >= 0) {
    column = rows[0][col];
    body = rows.slice(1);
  } else {
    col = 0;
    // แถวแรกไม่ใช่ข้อมูลที่ถูกต้อง (เช่นหัวตารางชื่ออื่น) → ถือเป็นหัวตาราง ข้ามไป
    if (normalizeContact(kind, rows[0][0] ?? "") === null) body = rows.slice(1);
  }

  const seen = new Set<string>(); // ตัดซ้ำ
  const invalid: string[] = [];
  let duplicates = 0;
  for (const r of body) {
    const raw = r[col] ?? "";
    if (!raw) continue;
    const v = normalizeContact(kind, raw);
    if (v === null) invalid.push(raw);
    else if (seen.has(v)) duplicates++;
    else seen.add(v);
  }
  return { values: [...seen], invalid, duplicates, column };
}

/** ไฟล์ตัวอย่างให้ดาวน์โหลด (มี BOM ให้ Excel เปิดภาษาไทยได้) */
export function templateCsv(kind: AllowListKind): string { // สร้างไฟล์ตัวอย่าง
  const rows =
    kind === "email"
      ? ["email", "somchai@example.com", "suda@example.com"]
      : ["phone", "0812345678", "0898765432"];
  return "﻿" + rows.join("\r\n");
}
