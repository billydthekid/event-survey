// components/report/ParticipantsTab.tsx
// แท็บ "ผู้เข้าร่วม" (Report ④) — ตารางผู้ลงทะเบียน + ค้นหาชื่อ + ตอบ Survey แล้วหรือยัง
// เบอร์โทรแสดงแบบปิดบางส่วนเสมอ (maskPhone)
"use client";
import { useState } from "react";
import { Search } from "lucide-react";
import { Registration, SurveyResponse } from "@/types";
import { formatShortDateTime } from "@/lib/utils/date";
import { GENDER_LABEL, maskPhone, registrationIdOf } from "@/lib/utils/surveyStats";

const PAGE = 50;   // แสดงทีละกี่แถว

interface ParticipantsTabProps {
  registrations: Registration[];
  responses: SurveyResponse[];
}

export function ParticipantsTab({ registrations, responses }: ParticipantsTabProps) {
  const [keyword, setKeyword] = useState("");
  const [limit, setLimit] = useState(PAGE);

  // id ผู้ลงทะเบียนที่ตอบแล้ว (Set = เช็กเร็ว)
  const answered = new Set(responses.map(registrationIdOf).filter(Boolean));
  // เรียงตามเวลาลงทะเบียน (เก่า → ใหม่) แล้วกรองชื่อ
  const rows = [...registrations]
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .filter((r) => String(r.answers.name ?? "").toLowerCase().includes(keyword.trim().toLowerCase()));

  return (
    <div className="rounded-xl bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold">ผู้เข้าร่วม {registrations.length.toLocaleString("th-TH")} คน</h2>
        <label className="flex w-72 items-center gap-2 rounded-lg bg-slate-100 px-3 py-2 text-sm">
          <Search size={16} className="text-slate-400" />
          <input
            value={keyword}
            onChange={(e) => { setKeyword(e.target.value); setLimit(PAGE); }}
            placeholder="ค้นหาชื่อ"
            className="w-full bg-transparent outline-none"
          />
        </label>
      </div>

      {rows.length === 0 ? (
        <p className="py-10 text-center text-sm text-slate-400">
          {registrations.length === 0 ? "ยังไม่มีผู้ลงทะเบียน" : "ไม่พบชื่อที่ค้นหา"}
        </p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs text-slate-500">
              <tr className="border-b border-slate-100">
                <th className="py-2 pr-3">#</th>
                <th className="py-2 pr-3">ชื่อ</th>
                <th className="py-2 pr-3">เพศ</th>
                <th className="py-2 pr-3">อายุ</th>
                <th className="py-2 pr-3">คณะ</th>
                <th className="py-2 pr-3">เบอร์โทร</th>
                <th className="py-2 pr-3">ลงทะเบียนเมื่อ</th>
                <th className="py-2">Survey</th>
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, limit).map((r, i) => (
                <tr key={r.id} className="border-b border-slate-50">
                  <td className="py-2.5 pr-3 text-slate-400">{i + 1}</td>
                  <td className="py-2.5 pr-3 font-medium">{String(r.answers.name ?? "—")}</td>
                  <td className="py-2.5 pr-3">{GENDER_LABEL[String(r.answers.gender)] ?? "ไม่ระบุ"}</td>
                  <td className="py-2.5 pr-3">{String(r.answers.age ?? "—")}</td>
                  <td className="py-2.5 pr-3">{String(r.answers.faculty ?? "—")}</td>
                  <td className="py-2.5 pr-3 text-slate-500">{maskPhone(r.answers.phone)}</td>
                  <td className="py-2.5 pr-3 text-slate-500">{formatShortDateTime(r.createdAt)}</td>
                  <td className="py-2.5">
                    {answered.has(r.id) ? (
                      <span className="rounded-full bg-green-50 px-2.5 py-1 text-xs text-green-600">ตอบแล้ว</span>
                    ) : (
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-500">ยังไม่ตอบ</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length > limit && (
            <button onClick={() => setLimit(limit + PAGE)} className="mt-4 w-full rounded-lg bg-slate-100 py-2 text-sm hover:bg-slate-200">
              แสดงเพิ่ม ({rows.length - limit} คน)
            </button>
          )}
        </div>
      )}
    </div>
  );
}
