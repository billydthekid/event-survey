// lib/utils/username.ts
import { Role } from "@/types";

// ชื่อฐาน + role → username
//   makeUsername("thanapath","admin")     => "thanapath.admin"
//   makeUsername("nattapol","organizer")  => "nattapol.organizer"
export function makeUsername(base: string, role: Role): string {
  const clean = base.trim().toLowerCase().replace(/\s+/g, "");
  return clean + (role === "admin" ? ".admin" : ".organizer");
}

// เดา role จาก suffix ของ username
// รองรับ suffix เก่า (.super / .event) ด้วย เพื่อ login บัญชี mock เดิมได้
export function roleFromUsername(username: string): Role | null {
  if (username.endsWith(".admin") || username.endsWith(".super")) return "admin";
  if (username.endsWith(".organizer") || username.endsWith(".event")) return "organizer";
  return null;
}
