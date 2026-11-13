// lib/hooks/useNow.ts
"use client";
import { useEffect, useState } from "react";

// เวลาปัจจุบัน อัปเดตเองทุก 1 นาที (ตัวนับ "เหลือเวลา", "ข้อมูลถึง …", ช่องประ "ยังไม่ถึงเวลา")
// ⚠️ ใช้ได้เฉพาะ component ที่อยู่ใต้ <Suspense> — cacheComponents ห้ามอ่านเวลาตอน prerender
//    (หน้า [id]/dashboard ครอบ Suspense อยู่แล้วเพราะ useParams)
export function useNow(intervalMs = 60 * 1000): Date {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    // setNow อยู่ใน callback ของ setInterval (ไม่ได้เรียกตรงๆ ใน effect) → ผ่าน eslint set-state-in-effect
    const timer = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(timer);   // ออกจากหน้า → หยุดนับ กันรั่ว
  }, [intervalMs]);

  return now;
}
