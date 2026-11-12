// app/admin/settings/accountActions.ts
// ฟังก์ชันเขียนข้อมูลบัญชีของ "ตัวฉันเอง" (Event Admin ที่ login อยู่)
// ไม่แก้ lib/store.ts → ใช้ useStore.setState จากภายนอกแทน
//
// สำคัญ: ข้อมูลผู้ใช้ถูกเก็บ 2 ที่
//   - currentUser  = สำเนาของคนที่ login (ใช้แสดงผลทั่วแอป เช่น Topbar, ภาษา)
//   - users[]      = รายชื่อทั้งหมด (login ตรวจรหัสจากที่นี่)
// ถ้าอัปเดตที่เดียว ข้อมูลจะไม่ตรงกัน → ทุกฟังก์ชันต้องผ่าน updateMe ที่อัปเดตทั้งสองที่พร้อมกัน
import { useStore } from "@/lib/store";
import { Lang, User } from "@/types";
import { failedRules, PasswordRule } from "./passwordRules";

// ฟิลด์ที่ผู้ใช้แก้เองได้ (username, org, role แก้ได้โดย Super Admin เท่านั้น)
type MyPatch = Partial<Pick<User, "name" | "lang" | "password">>;

// ============ ตัวช่วยกลาง: อัปเดต currentUser และ users[] ให้ตรงกัน ============
// รับ: ฟิลด์ที่จะเปลี่ยน เช่น { lang: "en" }
// ทำ: รวม patch เข้ากับ currentUser และกับ user คนเดียวกันใน users[]
// คืน: ไม่มี (ถ้ายังไม่ได้ login → ไม่ทำอะไร)
function updateMe(patch: MyPatch) {
  useStore.setState((s) => {
    const me = s.currentUser;
    if (!me) return {}; // guard: ไม่มีคน login → ไม่เปลี่ยนอะไรเลย

    return {
      currentUser: { ...me, ...patch },
      users: s.users.map((u) => (u.id === me.id ? { ...u, ...patch } : u)),
    };
  });
}

// ============ เปลี่ยนภาษา ============
// รับ: "th" หรือ "en"
// ทำ: บันทึกลงบัญชีทันที (ไม่เก็บ log ตามที่ตกลงไว้)
// ตัวอย่าง: setMyLang("en") → currentUser.lang = "en" และ users[...u-event-1].lang = "en"
export function setMyLang(lang: Lang) {
  updateMe({ lang });
}

// ============ เปลี่ยนชื่อที่แสดง ============
// รับ: ชื่อจากช่องกรอก (ตัดช่องว่างหัวท้ายให้)
// ทำ: บันทึกชื่อใหม่ + เก็บ log "update_profile"
// คืน: { ok: true } หรือ { ok: false, error: "empty" | "no_user" }
// ตัวอย่าง:
//   updateDisplayName("  ณัฐพล ใจดีมาก ") → { ok: true } + log 'เปลี่ยนชื่อ "ณัฐพล ใจดี" → "ณัฐพล ใจดีมาก"'
//   updateDisplayName("   ")              → { ok: false, error: "empty" } (ไม่บันทึกอะไร)
//   updateDisplayName("ณัฐพล ใจดี")        → { ok: true } แต่ชื่อเหมือนเดิม → ไม่บันทึก ไม่เก็บ log
export function updateDisplayName(
  name: string
): { ok: true } | { ok: false; error: "empty" | "no_user" } {
  const me = useStore.getState().currentUser;
  if (!me) return { ok: false, error: "no_user" };

  const next = name.trim();
  if (next === "") return { ok: false, error: "empty" };
  if (next === me.name) return { ok: true }; // ไม่มีอะไรเปลี่ยน → ไม่ต้องเก็บ log

  updateMe({ name: next });
  useStore.getState().addLog("update_profile", "user", me.id, `เปลี่ยนชื่อ "${me.name}" → "${next}"`);
  return { ok: true };
}

// ============ เปลี่ยนรหัสผ่าน ============
export type ChangePasswordResult =
  | { ok: true }
  | { ok: false; error: "no_user" | "wrong_current" | "mismatch" }
  | { ok: false; error: "weak"; failed: PasswordRule[] }; // failed = ข้อที่ไม่ผ่าน

// รับ: { current: รหัสปัจจุบัน, next: รหัสใหม่, confirm: ยืนยันรหัสใหม่ }
// ทำ: ตรวจตามลำดับ 1) รหัสปัจจุบันถูก 2) รหัสใหม่ผ่านทุกกฎ 3) ยืนยันตรงกัน
//     ผ่านครบ → บันทึกรหัสใหม่ + เก็บ log "change_password" (ไม่ใส่รหัสเก่า/ใหม่ใน log)
// คืน: ChangePasswordResult
// ตัวอย่าง (รหัสเดิมใน mock = "1234"):
//   { current: "0000", next: "Abcdefgh123!", confirm: "Abcdefgh123!" } → { ok: false, error: "wrong_current" }
//   { current: "1234", next: "abcdefghijkl", confirm: "abcdefghijkl" } → { ok: false, error: "weak", failed: ["upper", "digit", "special"] }
//   { current: "1234", next: "Abcdefgh123!", confirm: "Abcdefgh123?" } → { ok: false, error: "mismatch" }
//   { current: "1234", next: "Abcdefgh123!", confirm: "Abcdefgh123!" } → { ok: true } → login ครั้งหน้าใช้ "Abcdefgh123!"
export function changeMyPassword(input: { current: string; next: string; confirm: string }): ChangePasswordResult {
  const { currentUser: me, users } = useStore.getState();
  if (!me) return { ok: false, error: "no_user" };

  // 1) เทียบกับรหัสใน users[] เพราะ login ตรวจจากที่นี่
  //    (ถ้า Super รีเซ็ตรหัสให้ระหว่างที่ login อยู่ users[] จะใหม่กว่า currentUser)
  const saved = users.find((u) => u.id === me.id)?.password ?? me.password;
  if (input.current !== saved) return { ok: false, error: "wrong_current" };

  // 2) กฎของรหัสใหม่
  const failed = failedRules(input.next);
  if (failed.length > 0) return { ok: false, error: "weak", failed };

  // 3) ยืนยันต้องตรงกันทุกตัวอักษร
  if (input.next !== input.confirm) return { ok: false, error: "mismatch" };

  updateMe({ password: input.next });
  useStore.getState().addLog("change_password", "user", me.id, "เปลี่ยน password ด้วยตนเอง");
  return { ok: true };
}
