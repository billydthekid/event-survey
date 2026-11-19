// lib/utils/organizer.ts
import { Event } from "@/types";

// กติกา: Organizer 1 คน ดูแลได้ Event เดียว (ไม่นับ Event ที่ถูกลบ)
// คืน Event ที่คนนี้ดูแลอยู่ (ยกเว้น exceptId) · ไม่มี → undefined
export function organizerEventOf(userId: string, events: Event[], exceptId?: string): Event | undefined {
  return events.find((e) => e.id !== exceptId && e.status !== "deleted" && e.adminIds.includes(userId));
}
