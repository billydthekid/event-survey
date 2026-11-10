// lib/api/mock.ts
import { mockUsers } from "../mock/user";
import { ApiClient, ApiError } from "./contract";

export function createMockClient(): ApiClient {
  return {
    auth: {
      async login(username, password) {
        const user = mockUsers.find((u) => u.username === username.trim());
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
        return mockUsers;
      },
    },
  };
}