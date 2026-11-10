// lib/api/contract.ts
import { User } from "@/types";

// error ที่มี code ให้ UI แยกข้อความได้
export class ApiError extends Error {
  constructor(public code: string, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

// สัญญาว่า api ต้องมีอะไรบ้าง — mock กับ http ทำตามนี้เหมือนกัน
export interface ApiClient {
  auth: {
    login(username: string, password: string): Promise<User>;
  };
  users: {
    list(): Promise<User[]>;
  };
}