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
