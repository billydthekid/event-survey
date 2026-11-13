// components/public/public-error.tsx
// หน้า "โหลดข้อมูลไม่สำเร็จ" (Figma E1) — ใช้ใน error.tsx ของ /r/<code> และ /s/<code>
"use client";
import { useEffect } from "react";
import { CircleAlert } from "lucide-react";
import { PrimaryButton, PublicShell, StateMessage, palette, usePublicLang } from "./public-ui";

export function PublicError({ error, retry }: { error: unknown; retry: () => void }) {
  const [lang, setLang] = usePublicLang();
  const pal = palette(null);

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <PublicShell event={null} pal={pal} lang={lang} setLang={setLang}>
      <StateMessage
        icon={CircleAlert}
        tone="red"
        pal={pal}
        title={lang === "th" ? "โหลดข้อมูลไม่สำเร็จ" : "Couldn't load this page"}
        lines={[lang === "th" ? "ตรวจสอบอินเทอร์เน็ต แล้วลองอีกครั้ง" : "Check your internet connection and try again"]}
      >
        <PrimaryButton pal={pal} onClick={() => retry()} className="mt-6 h-11 min-w-40">
          {lang === "th" ? "ลองอีกครั้ง" : "Try again"}
        </PrimaryButton>
      </StateMessage>
    </PublicShell>
  );
}
