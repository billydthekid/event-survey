// app/super/action-log/page.tsx
"use client";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { downloadCSV } from "@/lib/utils/csv";
import { ActionLog } from "@/types";

const fmt = new Intl.DateTimeFormat("th-TH", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Bangkok",
});

// แปลงรหัส action → ป้ายที่คนอ่าน + สี
const ACTION_LABEL: Record<string, { text: string; color: string }> = {
  login: { text: "Login", color: "bg-blue-50 text-blue-600" },
  create_user: { text: "สร้าง", color: "bg-blue-50 text-blue-600" },
  create_event: { text: "สร้าง", color: "bg-blue-50 text-blue-600" },
  reset_password: { text: "แก้ไข", color: "bg-blue-50 text-blue-600" },
  disable_user: { text: "แก้ไข", color: "bg-blue-50 text-blue-600" },
  enable_user: { text: "แก้ไข", color: "bg-blue-50 text-blue-600" },
  delete_event: { text: "ลบ", color: "bg-red-50 text-red-600" },
  restore_event: { text: "กู้คืน", color: "bg-green-50 text-green-600" },
  export: { text: "Export", color: "bg-blue-50 text-blue-600" },
};

const PER_PAGE = 8;

export default function ActionLogPage() {
  const logs = useStore((s) => s.logs);
  const users = useStore((s) => s.users);
  const events = useStore((s) => s.events);

  const [userFilter, setUserFilter] = useState("all");
  const [actionFilter, setActionFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  //  search name 
  const actorOf = (log: ActionLog) => users.find((u) => u.id === log.actorId);

  const targetName = (log: ActionLog) => {
    if (log.targetType === "event")
      return events.find((e) => e.id === log.targetId)?.name.th ?? "-";
    if (log.targetType === "user") {
      const u = users.find((x) => x.id === log.targetId);
      return u ? `ผู้ใช้: ${u.name}` : "-";
    }
    return "ระบบ EventSurvey";
  };

  const labelOf = (action: string) =>
    ACTION_LABEL[action] ?? {
      text: action,
      color: "bg-slate-100 text-slate-600",
    };

  // กรอง
  const filtered = logs.filter((log) => {
    const matchUser = userFilter === "all" || log.actorId === userFilter;
    const matchAction =
      actionFilter === "all" || labelOf(log.action).text === actionFilter;
    const q = search.toLowerCase();
    const matchSearch =
      q === "" ||
      targetName(log).toLowerCase().includes(q) ||
      (log.detail ?? "").toLowerCase().includes(q);
    return matchUser && matchAction && matchSearch;
  });

  // ---------- แบ่งหน้า ----------
  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const current = Math.min(page, totalPages);
  const rows = filtered.slice((current - 1) * PER_PAGE, current * PER_PAGE);

  const clearFilters = () => {
    setUserFilter("all");
    setActionFilter("all");
    setSearch("");
    setPage(1);
  };

  // ---------- Export log ----------
  const handleExport = () => {
    downloadCSV("action-log.csv", [
      ["เวลา", "ผู้ใช้", "Username", "Action", "สิ่งที่ถูกกระทำ", "รายละเอียด"],
      ...filtered.map((log) => [
        fmt.format(new Date(log.at)),
        actorOf(log)?.name ?? "-",
        actorOf(log)?.username ?? "-",
        labelOf(log.action).text,
        targetName(log),
        log.detail ?? "",
      ]),
    ]);
  };

  // รายชื่อป้าย action ที่ไม่ซ้ำ (ใช้ทำ dropdown)
  const actionOptions = Array.from(
    new Set(Object.values(ACTION_LABEL).map((a) => a.text)),
  );

  return (
    <div>
      {/* หัวข้อ */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-400">ผู้ดูแลระบบ / Action Log</p>
          <h1 className="mt-1 text-3xl font-bold">Action Log</h1>
          <p className="mt-1 text-slate-500">
            ตรวจสอบประวัติการใช้งานและการเปลี่ยนแปลงจากผู้ใช้ทุกคน
          </p>
        </div>
        <button
          onClick={handleExport}
          className="rounded-lg bg-slate-100 px-4 py-2 text-sm hover:bg-slate-200"
        >
          Export log
        </button>
      </div>

      {/* ตัวกรอง */}
      <div className="mt-6 rounded-xl bg-white p-5 shadow-sm">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm">ผู้ใช้</label>
            <select
              value={userFilter}
              onChange={(e) => {
                setUserFilter(e.target.value);
                setPage(1);
              }}
              className="mt-1 w-full rounded-lg bg-slate-100 px-3 py-2 text-sm outline-none"
            >
              <option value="all">ผู้ใช้ทั้งหมด</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm">ประเภท action</label>
            <select
              value={actionFilter}
              onChange={(e) => {
                setActionFilter(e.target.value);
                setPage(1);
              }}
              className="mt-1 w-full rounded-lg bg-slate-100 px-3 py-2 text-sm outline-none"
            >
              <option value="all">ทุกประเภท</option>
              {actionOptions.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-4 flex gap-2">
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="ค้นหาสิ่งที่ถูกกระทำ หรือรายละเอียด"
            className="w-full rounded-lg bg-slate-100 px-3 py-2 text-sm outline-none"
          />
          <button
            onClick={clearFilters}
            className="shrink-0 rounded-lg bg-slate-100 px-4 py-2 text-sm"
          >
            ล้างตัวกรอง
          </button>
        </div>
      </div>

      {/* ตาราง */}
      <div className="mt-6 rounded-xl bg-white shadow-sm">
        <div className="flex items-center justify-between p-5">
          <h2 className="font-bold">ประวัติการใช้งาน</h2>
          <span className="text-xs text-slate-400">
            เวลา Asia/Bangkok (UTC+7)
          </span>
        </div>

        <table className="w-full text-sm">
          <thead className="bg-slate-100 text-left text-slate-500">
            <tr>
              <th className="px-5 py-3">เวลา</th>
              <th className="px-5 py-3">ผู้ใช้</th>
              <th className="px-5 py-3">Action</th>
              <th className="px-5 py-3">สิ่งที่ถูกกระทำ</th>
              <th className="px-5 py-3">รายละเอียด</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-5 py-10 text-center text-slate-400"
                >
                  ยังไม่มีประวัติการใช้งาน
                </td>
              </tr>
            )}
            {rows.map((log) => {
              const actor = actorOf(log);
              const label = labelOf(log.action);
              return (
                <tr key={log.id} className="border-t border-slate-100">
                  <td className="px-5 py-4 text-slate-500">
                    {fmt.format(new Date(log.at))}
                  </td>
                  <td className="px-5 py-4">
                    <p className="font-semibold">{actor?.name ?? "-"}</p>
                    <p className="text-xs text-slate-400">{actor?.username}</p>
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`rounded-full px-3 py-1 text-xs ${label.color}`}
                    >
                      {label.text}
                    </span>
                  </td>
                  <td className="px-5 py-4">{targetName(log)}</td>
                  <td className="px-5 py-4 text-slate-500">{log.detail}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* แบ่งหน้า */}
        <div className="flex items-center justify-between p-5">
          <span className="text-sm text-slate-400">
            แสดง {filtered.length === 0 ? 0 : (current - 1) * PER_PAGE + 1}–
            {Math.min(current * PER_PAGE, filtered.length)} จาก{" "}
            {filtered.length} รายการ
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(current - 1)}
              disabled={current === 1}
              className="rounded-lg bg-slate-100 px-4 py-2 text-sm disabled:opacity-40"
            >
              ก่อนหน้า
            </button>
            <span className="rounded-full bg-blue-50 px-3 py-1 text-sm text-blue-600">
              {current} / {totalPages}
            </span>
            <button
              onClick={() => setPage(current + 1)}
              disabled={current === totalPages}
              className="rounded-lg bg-slate-100 px-4 py-2 text-sm disabled:opacity-40"
            >
              ถัดไป
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
