// app/(public)/login/page.tsx
"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { useStore } from "@/lib/store";

const TEXT = {
  th: {
    title: "เข้าสู่ระบบ",
    subtitle: "สำหรับ Admin และ Organizer",
    username: "Username",
    password: "รหัสผ่าน",
    login: "เข้าสู่ระบบ",
    forgot: "ลืมรหัสผ่าน? ติดต่อ Admin เพื่อรีเซ็ต",
    required: "กรุณากรอก Username และรหัสผ่าน",
  },
  en: {
    title: "Sign in",
    subtitle: "For Admin and Organizer",
    username: "Username",
    password: "Password",
    login: "Sign in",
    forgot: "Forgot password? Contact Admin to reset",
    required: "Please enter username and password",
  },
};

export default function LoginPage() {
  const router = useRouter();
  const login = useStore((s) => s.login);

  // ref ไว้ดึงค่า input ตอนกดปุ่ม (ไม่ต้อง useState คุมทุกตัวอักษร)
  const userRef = useRef<HTMLInputElement>(null);
  const passRef = useRef<HTMLInputElement>(null);

  const [lang, setLang] = useState<"th" | "en">("th");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const t = TEXT[lang];

  const handleLogin = async () => {
    setError("");

    // ดึงค่าจาก input ทีเดียวตอนกดปุ่ม
    const username = userRef.current?.value.trim() ?? "";
    const password = passRef.current?.value.trim() ?? "";

    if (username === "" || password === "") {
      setError(t.required);
      return;
    }

    setLoading(true);
    try {
      const user = await login(username, password);
      // admin → หน้า /super (ระบบจัดการรวม), organizer → /admin (หน้าของ event ตัวเอง)
      // หมายเหตุ: path folder ยังไม่ rename ใน commit นี้ จะทำใน commit ถัดไป
      router.replace(user.role === "admin" ? "/super" : "/admin");
    } catch (err) {
      setError(err instanceof Error ? err.message : "เข้าสู่ระบบไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen relative"
      style={{
        background:
          "linear-gradient(180deg, #E6E3F6 0%, #E3ECFB 13%, rgba(244,242,247,0) 31%), #FFFFFF",
      }}
    >
      <div className="absolute top-6 left-6 flex items-center gap-2 font-semibold">
        <div className="h-8 w-8 rounded-md bg-blue-600" />
        Event & Survey
      </div>

      <div className="absolute top-6 right-6 flex rounded-lg bg-white shadow-sm overflow-hidden">
        {(["th", "en"] as const).map((l) => (
          <button
            key={l}
            onClick={() => setLang(l)}
            className={`px-3 py-1 text-sm ${lang === l ? "bg-slate-100 font-semibold" : ""}`}
          >
            {l.toUpperCase()}
          </button>
        ))}
      </div>

      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
          <h1 className="text-2xl font-bold">{t.title}</h1>
          <p className="mt-1 text-sm text-slate-500">{t.subtitle}</p>

          {error && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="mt-4">
            <label className="text-sm font-medium">{t.username}</label>
            <input
              ref={userRef}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
            />
          </div>

          <div className="mt-3">
            <label className="text-sm font-medium">{t.password}</label>
            <div className="relative mt-1">
              <input
                ref={passRef}
                type={showPassword ? "text" : "password"}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 pr-10 outline-none focus:border-blue-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            onClick={handleLogin}
            disabled={loading}
            className="mt-6 w-full rounded-lg bg-blue-600 py-2.5 font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {loading ? "..." : t.login}
          </button>

          <p className="mt-4 text-center text-sm text-slate-400">{t.forgot}</p>
        </div>
      </div>
    </div>
  );
}
