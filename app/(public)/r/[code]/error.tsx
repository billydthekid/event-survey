// app/(public)/r/[code]/error.tsx — โหลดหน้าลงทะเบียนไม่สำเร็จ (Figma E1)
"use client";
import { PublicError } from "@/components/public/public-error";

export default function RegisterError({ error, retry }: { error: unknown; retry: () => void }) {
  return <PublicError error={error} retry={retry} />;
}
