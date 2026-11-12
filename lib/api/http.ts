// lib/api/http.ts
import { ApiClient, ApiError } from "./contract";

// เวอร์ชัน server จริง — วันนี้ยังไม่ใช้ (โครงเปล่าไว้ก่อน)
export function createHttpClient(baseUrl: string): ApiClient {
  return {
    auth: {
      async login(username, password) {
        const res = await fetch(`${baseUrl}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new ApiError(err.code ?? "error", err.message ?? "เข้าสู่ระบบไม่สำเร็จ");
        }
        return res.json(); // backend ส่ง User กลับมา
      },
    },
    users: {
      async list() {
        const res = await fetch(`${baseUrl}/users`);
        if (!res.ok) throw new ApiError("error", "โหลดผู้ใช้ไม่สำเร็จ");
        return res.json();
      },
    },
  };
}