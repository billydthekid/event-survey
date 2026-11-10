// lib/utils/username.ts
import { Role } from "@/types";

// ชื่อฐาน + role → username: makeUsername("thanapath","super") => "thanapath.super"
export function makeUsername(base: string, role: Role): string {
  const clean = base.trim().toLowerCase().replace(/\s+/g, "");
  return clean + (role === "super" ? ".super" : ".event");
}

// เดา role จาก suffix ของ username
export function roleFromUsername(username: string): Role | null {
  if (username.endsWith(".super")) return "super";
  if (username.endsWith(".event")) return "event";
  return null;
}