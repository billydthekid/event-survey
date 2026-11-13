// app/(public)/s/[code]/error.tsx — โหลดหน้าแบบประเมินไม่สำเร็จ (Figma E1)
"use client";
import { PublicError } from "@/components/public/public-error";

export default function SurveyError({ error, retry }: { error: unknown; retry: () => void }) {
  return <PublicError error={error} retry={retry} />;
}
