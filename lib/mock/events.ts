// lib/mock/events.ts
import { Event } from "@/types";

// สร้าง Event เปล่าสถานะ "ฉบับร่าง" — Super สร้างแค่ชื่อ ที่เหลือ Event Admin กรอกต่อใน Wizard
export function makeDraftEvent(id: string, name: string, adminId: string, createdBy: string): Event {
  return {
    id,
    code: "EV-" + id.slice(-4).toUpperCase(),
    status: "draft",
    name: { th: name },
    description: { th: "" },
    type: "seminar",
    mode: "onsite",
    date: "",
    startTime: "",
    endTime: "",
    organizerName: "",
    showContact: false,
    theme: {
      primary: "#2563EB",
      secondary: "#DBEAFE",
      kind: "light",
      background: { type: "color", value: "#FFFFFF" },
    },
    registration: { opensAt: "", closesAt: "", fields: [] },
    surveyWindow: { opensAt: "", closesAt: "" },
    kiosk: { screen: "both" },
    createdBy,
    adminIds: [adminId],
  };
}

// Event ตัวอย่างเริ่มต้น
export const mockEvents: Event[] = [
  {
    ...makeDraftEvent("e-workshop", "Workshop Figma เบื้องต้น", "u-event-1", "u-super-1"),
    code: "FIG-1017",
    status: "active",
    date: "2026-10-23",
    startTime: "10:00",
    endTime: "15:00",
    venue: "ห้อง Lab 4 อาคาร 11",
    organizerName: "คณะ IT",
  },
  {
    ...makeDraftEvent("e-openhouse", "วันเปิดบ้าน 2569", "u-event-2", "u-super-1"),
    code: "OPH-2569",
    status: "ended",
    date: "2026-10-20",
  },
  {
    ...makeDraftEvent("e-career", "เส้นทางอาชีพดิจิทัล", "u-event-2", "u-super-1"),
    code: "CAR-1025",
    status: "scheduled",
    date: "2026-10-25",
  },
  {
    ...makeDraftEvent("e-comm", "การสื่อสารยุคดิจิทัล", "u-event-3", "u-super-1"),
    code: "COM-1018",
    status: "ended",
    date: "2026-10-18",
  },
];