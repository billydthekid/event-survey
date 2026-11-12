"use client";

import { useEffect, useState } from "react";

/** รอให้ zustand persist โหลดจาก localStorage เสร็จก่อนแสดงผล (กัน hydration mismatch) */
export function useHydrated() {
  const [h, setH] = useState(false);
  useEffect(() => setH(true), []);
  return h;
}
