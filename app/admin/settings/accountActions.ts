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
