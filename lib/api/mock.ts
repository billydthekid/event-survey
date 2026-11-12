// lib/api/mock.ts
import { ApiClient, ApiError } from "./contract";

export function createMockClient(): ApiClient {
  return {
    auth: {
      async login(username, password) {
        // ดึง store ตอนเรียกใช้ (import แบบนี้กัน 2 ไฟล์ import วนกัน)
        const { useStore } = await import("@/lib/store");
        const users = useStore.getState().users;

        const user = users.find((u) => u.username === username.trim());
        if (!user || user.password !== password) {
          throw new ApiError("invalid_credentials", "Username หรือรหัสผ่านไม่ถูกต้อง");
        }
        if (!user.active) {
          throw new ApiError("account_disabled", "บัญชีนี้ถูกปิดใช้งาน");
        }
        return user;
      },
    },
    users: {
      async list() {
        const { useStore } = await import("@/lib/store");
        return useStore.getState().users;
      },
    },
  };
}