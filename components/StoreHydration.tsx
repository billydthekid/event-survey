// read localStorage// components/StoreHydration.tsx
"use client";
import { useEffect } from "react";
import { useStore } from "@/lib/store";

export function StoreHydration() {
  useEffect(() => {
    const p = useStore.persist.rehydrate();
    Promise.resolve(p).then(() => useStore.getState().setHydrated(true));
  }, []);
  return null;
}