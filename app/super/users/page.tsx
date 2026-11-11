// app/super/users/page.tsx
"use client";
import { useRef, useState } from "react";
import { X, RefreshCw, Copy, KeyRound, CheckCircle2 } from "lucide-react";
import { useStore } from "@/lib/store";
import { Role, User } from "@/types";

// แสดงวันที่แบบไทย (ล็อก timezone ไว้ server/browser จะได้ตรงกัน)
const fmt = new Intl.DateTimeFormat("th-TH", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Bangkok",
});

function randomPassword() {
  return "Demo@" + Math.floor(1000 + Math.random() * 9000);
}

export default function UsersPage() {
  const users = useStore((s) => s.users);
  const events = useStore((s) => s.events);
  const addUser = useStore((s) => s.addUser);
  const createDraftEvent = useStore((s) => s.createDraftEvent);
  const resetPassword = useStore((s) => s.resetPassword);
  const toggleActive = useStore((s) => s.toggleActive);

  // ---------- ตัวกรอง ----------
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | Role>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");

  // ---------- Drawer (2 ขั้น) ----------
  const [drawerStep, setDrawerStep] = useState<0 | 1 | 2>(0);   // 0 = ปิด
  const [draftFor, setDraftFor] = useState<User | null>(null);  // user ที่จะสร้าง Draft ให้
  const [role, setRole] = useState<Role>("event");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState("");
  const nameRef = useRef<HTMLInputElement>(null);
  const baseRef = useRef<HTMLInputElement>(null);
  const orgRef = useRef<HTMLInputElement>(null);
  const eventNameRef = useRef<HTMLInputElement>(null);

  // ---------- Modal reset password ----------
  const [resetTarget, setResetTarget] = useState<User | null>(null);
  const [newPass, setNewPass] = useState("");

  // ---------- กรองรายการ ----------
  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    const matchSearch =
      u.name.toLowerCase().includes(q) ||
      u.username.toLowerCase().includes(q) ||
      u.org.toLowerCase().includes(q);
    const matchRole = roleFilter === "all" || u.role === roleFilter;
    const matchStatus =
      statusFilter === "all" || (statusFilter === "active" ? u.active : !u.active);
    return matchSearch && matchRole && matchStatus;
  });

  const eventNames = (u: User) =>
    u.role === "super"
      ? "ทุก Event"
      : u.eventIds.map((id) => events.find((e) => e.id === id)?.name.th).filter(Boolean).join(", ") || "-";

  // ---------- เปิด Drawer ขั้น 1 ----------
  const openAddUser = () => {
    setRole("event");
    setPassword(randomPassword());
    setFormError("");
    setDrawerStep(1);
  };

  // ---------- เปิด Drawer ขั้น 2 ตรงๆ (ปุ่ม + เพิ่ม Event ในตาราง) ----------
  const openAddEvent = (u: User) => {
    setDraftFor(u);
    setFormError("");
    setDrawerStep(2);
  };

  const closeDrawer = () => {
    setDrawerStep(0);
    setDraftFor(null);
  };

  // ---------- บันทึกขั้น 1: สร้างบัญชี ----------
  const handleAddUser = () => {
    const name = nameRef.current?.value.trim() ?? "";
    const base = baseRef.current?.value.trim() ?? "";
    const org = orgRef.current?.value.trim() ?? "";

    if (name === "" || base === "" || org === "" || password === "") {
      setFormError("กรุณากรอกข้อมูลให้ครบทุกช่อง");
      return;
    }
    const newUser = addUser({ name, base, org, role, password });

    if (role === "event") {
      // Event Admin → ไปขั้น 2 สร้าง Draft ต่อ
      setDraftFor(newUser);
      setFormError("");
      setDrawerStep(2);
    } else {
      // Super Admin → ไม่ต้องมี Draft ปิดเลย
      closeDrawer();
    }
  };

  // ---------- บันทึกขั้น 2: สร้าง Draft ----------
  const handleCreateDraft = () => {
    const eventName = eventNameRef.current?.value.trim() ?? "";
    if (eventName === "") {
      setFormError("กรุณากรอกชื่อ Event");
      return;
    }
    if (draftFor) createDraftEvent(eventName, draftFor.id);
    closeDrawer();
  };

  // ---------- Reset password ----------
  const handleConfirmReset = () => {
    if (!resetTarget) return;
    setNewPass(resetPassword(resetTarget.id));
  };

  const closeReset = () => {
    setResetTarget(null);
    setNewPass("");
  };

  return (
    <div>
      {/* หัวข้อ */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-400">ผู้ดูแลระบบ / จัดการผู้ใช้</p>
          <h1 className="mt-1 text-3xl font-bold">จัดการผู้ใช้</h1>
          <p className="mt-1 text-slate-500">จัดการบัญชี สิทธิ์การเข้าถึง และ Event ที่ผู้ใช้แต่ละคนดูแล</p>
        </div>
        <button
          onClick={openAddUser}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          + เพิ่มผู้ใช้
        </button>
      </div>

      {/* การ์ดสรุป */}
      <div className="mt-6 grid grid-cols-3 gap-4">
        {[
          { label: "ผู้ใช้ทั้งหมด", value: users.length },
          { label: "กำลังใช้งาน", value: users.filter((u) => u.active).length },
          { label: "Super Admin", value: users.filter((u) => u.role === "super").length },
        ].map((c) => (
          <div key={c.label} className="flex items-center justify-between rounded-xl bg-white p-5 shadow-sm">
            <span className="text-sm text-slate-500">{c.label}</span>
            <span className="text-2xl font-bold">{c.value} บัญชี</span>
          </div>
        ))}
      </div>

      {/* ตัวกรอง + ตาราง */}
      <div className="mt-6 rounded-xl bg-white shadow-sm">
        <div className="grid grid-cols-3 gap-4 p-5">
          <div>
            <label className="text-sm">ค้นหาผู้ใช้</label>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ค้นหาชื่อ, Username หรือหน่วยงาน"
              className="mt-1 w-full rounded-lg bg-slate-100 px-3 py-2 text-sm outline-none"
            />
          </div>
          <div>
            <label className="text-sm">Role</label>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as "all" | Role)}
              className="mt-1 w-full rounded-lg bg-slate-100 px-3 py-2 text-sm outline-none"
            >
              <option value="all">ทุก Role</option>
              <option value="super">Super Admin</option>
              <option value="event">Event Admin</option>
            </select>
          </div>
          <div>
            <label className="text-sm">สถานะ</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as "all" | "active" | "inactive")}
              className="mt-1 w-full rounded-lg bg-slate-100 px-3 py-2 text-sm outline-none"
            >
              <option value="all">ทุกสถานะ</option>
              <option value="active">ใช้งาน</option>
              <option value="inactive">ปิดใช้งาน</option>
            </select>
          </div>
        </div>

        <table className="w-full text-sm">
          <thead className="bg-slate-100 text-left text-slate-500">
            <tr>
              <th className="px-5 py-3">ชื่อ</th>
              <th className="px-5 py-3">Username</th>
              <th className="px-5 py-3">หน่วยงาน</th>
              <th className="px-5 py-3">Role</th>
              <th className="px-5 py-3">Event ที่ดูแล</th>
              <th className="px-5 py-3">สถานะ</th>
              <th className="px-5 py-3">Login ล่าสุด</th>
              <th className="px-5 py-3">จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((u) => (
              <tr key={u.id} className="border-t border-slate-100">
                <td className="px-5 py-4 font-semibold">{u.name}</td>
                <td className="px-5 py-4">{u.username}</td>
                <td className="px-5 py-4">{u.org}</td>
                <td className="px-5 py-4">
                  <span
                    className={`rounded-full px-3 py-1 text-xs ${
                      u.role === "super" ? "bg-blue-50 text-blue-600" : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {u.role === "super" ? "Super Admin" : "Event Admin"}
                  </span>
                </td>
                <td className="px-5 py-4">{eventNames(u)}</td>
                <td className="px-5 py-4">
                  <span
                    className={`rounded-full px-3 py-1 text-xs ${
                      u.active ? "bg-green-50 text-green-600" : "bg-slate-100 text-slate-400"
                    }`}
                  >
                    {u.active ? "ใช้งาน" : "ปิดใช้งาน"}
                  </span>
                </td>
                <td className="px-5 py-4 text-slate-500">
                  {u.lastLoginAt ? fmt.format(new Date(u.lastLoginAt)) : "-"}
                </td>
                <td className="px-5 py-4">
                  <div className="flex flex-col items-start gap-1 text-xs">
                    {u.role === "event" && (
                      <button onClick={() => openAddEvent(u)} className="text-blue-600 hover:underline">
                        + เพิ่ม Event
                      </button>
                    )}
                    <button onClick={() => setResetTarget(u)} className="text-blue-600 hover:underline">
                      รีเซ็ต password
                    </button>
                    <button
                      onClick={() => toggleActive(u.id)}
                      className={u.active ? "text-red-500 hover:underline" : "text-blue-600 hover:underline"}
                    >
                      {u.active ? "ปิดใช้งาน" : "เปิดใช้งาน"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <p className="p-5 text-sm text-slate-400">
          แสดง {filtered.length} จาก {users.length} รายการ
        </p>
      </div>

      {/* ================= Drawer ================= */}
      {drawerStep !== 0 && (
        <div className="fixed inset-0 z-40 flex justify-end bg-slate-900/40">
          <div className="flex h-full w-[480px] flex-col bg-white p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">
                {drawerStep === 1 ? "เพิ่มผู้ใช้" : "สร้าง Event (Draft)"}
              </h2>
              <button onClick={closeDrawer}><X size={20} /></button>
            </div>
            <p className="mt-1 text-sm text-slate-500">
              {drawerStep === 1
                ? "ขั้นที่ 1 จาก 2 · สร้างบัญชีสำหรับทีมผู้ดูแล Event"
                : "ขั้นที่ 2 จาก 2 · สร้าง Draft Event ให้บัญชีนี้"}
            </p>

            {formError && (
              <div className="mt-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">{formError}</div>
            )}

            {/* ----- ขั้นที่ 1 ----- */}
            {drawerStep === 1 && (
              <div className="mt-4 flex flex-col gap-4">
                <div>
                  <label className="text-sm font-medium">ชื่อ-นามสกุล *</label>
                  <input ref={nameRef} className="mt-1 w-full rounded-lg bg-slate-100 px-3 py-2 text-sm outline-none" />
                </div>
                <div>
                  <label className="text-sm font-medium">Username *</label>
                  <div className="mt-1 flex items-center rounded-lg bg-slate-100 pr-3">
                    <input ref={baseRef} placeholder="เช่น pimchanok"
                      className="w-full bg-transparent px-3 py-2 text-sm outline-none" />
                    <span className="text-sm text-slate-400">.{role}</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-400">ระบบเติม .{role} ท้ายให้อัตโนมัติตาม Role</p>
                </div>
                <div>
                  <label className="text-sm font-medium">หน่วยงาน *</label>
                  <input ref={orgRef} className="mt-1 w-full rounded-lg bg-slate-100 px-3 py-2 text-sm outline-none" />
                </div>
                <div>
                  <label className="text-sm font-medium">Role *</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as Role)}
                    className="mt-1 w-full rounded-lg bg-slate-100 px-3 py-2 text-sm outline-none"
                  >
                    <option value="event">Event Admin</option>
                    <option value="super">Super Admin</option>
                  </select>
                  <p className="mt-1 text-xs text-slate-400">
                    {role === "event"
                      ? "Event Admin จัดการได้เฉพาะ Event ที่ได้รับมอบหมาย"
                      : "Super Admin เห็นและจัดการได้ทุก Event"}
                  </p>
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">ตั้ง password ให้ *</label>
                    <button onClick={() => setPassword(randomPassword())}
                      className="flex items-center gap-1 text-sm text-blue-600">
                      <RefreshCw size={14} /> สุ่ม password
                    </button>
                  </div>
                  <div className="mt-1 flex items-center rounded-lg border border-slate-200 pr-3">
                    <input value={password} onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-3 py-2 text-sm outline-none" />
                    <button onClick={() => navigator.clipboard.writeText(password)}>
                      <Copy size={16} className="text-slate-400" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ----- ขั้นที่ 2 ----- */}
            {drawerStep === 2 && draftFor && (
              <div className="mt-4 flex flex-col gap-4">
                <div className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
                  ✓ บัญชี {draftFor.username} พร้อมแล้ว · ส่ง username + password ให้ Event Admin ได้เลย
                </div>
                <div>
                  <label className="text-sm font-medium">ชื่อ Event (สร้างเป็น Draft) *</label>
                  <input ref={eventNameRef} placeholder="เช่น ปฐมนิเทศนักศึกษาใหม่ 2569"
                    className="mt-1 w-full rounded-lg bg-slate-100 px-3 py-2 text-sm outline-none" />
                </div>
                <div>
                  <label className="text-sm font-medium">Event Admin</label>
                  <div className="mt-1 rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-500">
                    {draftFor.name} · {draftFor.username}
                  </div>
                </div>
                <p className="text-xs text-slate-400">
                  ระบบสร้าง Event เป็น Draft ให้ แล้ว Event Admin เข้าไปกรอกต่อใน Wizard 7 ขั้น
                </p>
              </div>
            )}

            {/* ปุ่มล่าง */}
            <div className="mt-auto flex justify-end gap-2 border-t border-slate-100 pt-4">
              <button onClick={closeDrawer} className="rounded-lg bg-slate-100 px-4 py-2 text-sm">
                {drawerStep === 1 ? "ยกเลิก" : "ข้าม ทำทีหลัง"}
              </button>
              <button
                onClick={drawerStep === 1 ? handleAddUser : handleCreateDraft}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
              >
                {drawerStep === 1 ? "เพิ่มผู้ใช้" : "สร้าง Draft"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= Modal Reset password ================= */}
      {resetTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40">
          <div className="w-[480px] rounded-2xl bg-white p-6">
            <div className="flex items-start justify-between">
              <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
                {newPass ? <CheckCircle2 size={22} /> : <KeyRound size={22} />}
              </div>
              <button onClick={closeReset}><X size={20} /></button>
            </div>

            {!newPass ? (
              <>
                <h3 className="mt-4 text-xl font-bold">ยืนยันรีเซ็ต password?</h3>
                <p className="mt-1 text-sm text-slate-500">รหัสผ่านเดิมจะใช้ไม่ได้ทันทีหลังยืนยัน</p>
                <div className="mt-4 rounded-lg bg-slate-100 p-4 text-sm">
                  <p className="font-semibold">{resetTarget.name}</p>
                  <p className="text-slate-500">Username: {resetTarget.username} · {resetTarget.org}</p>
                </div>
                <div className="mt-6 flex justify-end gap-2">
                  <button onClick={closeReset} className="rounded-lg bg-slate-100 px-4 py-2 text-sm">ยกเลิก</button>
                  <button onClick={handleConfirmReset}
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white">ยืนยันรีเซ็ต</button>
                </div>
              </>
            ) : (
              <>
                <h3 className="mt-4 text-xl font-bold">รีเซ็ต password สำเร็จ</h3>
                <p className="mt-1 text-sm text-slate-500">
                  {resetTarget.name} · Username: {resetTarget.username}
                </p>
                <p className="mt-4 text-sm font-medium">password ชั่วคราว</p>
                <div className="mt-1 flex items-center justify-between rounded-lg bg-slate-100 p-4">
                  <span className="text-xl font-bold">{newPass}</span>
                  <button onClick={() => navigator.clipboard.writeText(newPass)}
                    className="rounded-lg bg-white px-3 py-1 text-sm">Copy</button>
                </div>
                <div className="mt-6 flex justify-end">
                  <button onClick={closeReset}
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white">เสร็จสิ้น</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}