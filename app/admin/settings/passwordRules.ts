// app/admin/settings/passwordRules.ts
// กฎของรหัสผ่านใหม่ (แยกไว้ให้ทั้ง accountActions และหน้าจอใช้ชุดเดียวกัน)
// กฎ: ≥ 12 ตัว, มีตัวพิมพ์ใหญ่ A-Z, ตัวพิมพ์เล็ก a-z, ตัวเลข 0-9, อักขระพิเศษ ASCII, ห้ามมีช่องว่าง
// (ไม่ปฏิเสธอักษรไทย และไม่ห้ามซ้ำรหัสเดิม ตามที่ตกลงไว้)

// ชื่อกฎแต่ละข้อ (ใช้เป็น key ของข้อความ TH/EN ใน text.ts)
export const PASSWORD_RULES = ["length", "upper", "lower", "digit", "special", "noSpace"] as const;
export type PasswordRule = (typeof PASSWORD_RULES)[number];

export const MIN_PASSWORD_LENGTH = 12;

// อักขระพิเศษ ASCII ทั้ง 32 ตัว: ! " # $ % & ' ( ) * + , - . / : ; < = > ? @ [ \ ] ^ _ ` { | } ~
// เขียนเป็นช่วงรหัส ASCII 4 ช่วง: !-/   :-@   [-`   {-~
const SPECIAL = /[!-/:-@[-`{-~]/;

// ============ ตรวจทุกข้อ ============
// รับ: รหัสผ่านใหม่
// คืน: ผลของแต่ละข้อ (true = ผ่าน)
// ตัวอย่าง:
//   checkPassword("Abcdefgh123!") → ผ่านทุกข้อ
//   checkPassword("abc 123")      → { length: false, upper: false, lower: true, digit: true, special: false, noSpace: false }
export function checkPassword(pw: string): Record<PasswordRule, boolean> {
  return {
    length: pw.length >= MIN_PASSWORD_LENGTH,
    upper: /[A-Z]/.test(pw),
    lower: /[a-z]/.test(pw),
    digit: /[0-9]/.test(pw),
    special: SPECIAL.test(pw),
    noSpace: !/\s/.test(pw), // \s = ช่องว่างทุกแบบ (space, tab, ขึ้นบรรทัดใหม่)
  };
}

// ============ รายชื่อข้อที่ไม่ผ่าน ============
// ตัวอย่าง: failedRules("abcdefghijkl") → ["upper", "digit", "special"]
export function failedRules(pw: string): PasswordRule[] {
  const result = checkPassword(pw);
  return PASSWORD_RULES.filter((rule) => !result[rule]);
}
