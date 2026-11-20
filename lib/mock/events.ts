// lib/mock/events.ts
import { MOCK_DATES } from "./dates";
import { Event } from "@/types";

// สร้าง Event เปล่าสถานะ "ฉบับร่าง"
// adminId เป็น optional — Admin อาจสร้างโดยยังไม่เลือกผู้ดูแล แล้วค่อย assign ที่หน้า Event list
export function makeDraftEvent(id: string, name: string, adminId: string | null, createdBy: string): Event {
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
    adminIds: adminId ? [adminId] : [],
  };
}

// รูปโฆษณาตัวอย่างของ Workshop Figma (แสดงบนจอ Kiosk) — ไฟล์อยู่ใน public/kiosk/ads
export const WORKSHOP_AD = "/kiosk/ads/workshop-figma.png";

// Event ตัวอย่างเริ่มต้น (วันที่คิดจากวันนี้ ดู lib/mock/dates.ts)
export const mockEvents: Event[] = [
  {
    ...makeDraftEvent("e-workshop", "Workshop Figma เบื้องต้น", "u-organizer-1", "u-admin-1"),
    code: "FIG-1017",
    status: "active",
    date: MOCK_DATES.workshop,
    startTime: "08:00", // ช่วงกว้าง: เปิดเดโม่ช่วงกลางวันเมื่อไหร่ก็ "กำลังจัดงาน"
    endTime: "12:00",
    venue: "ห้อง Lab 4 อาคาร 11",
    organizerName: "คณะ IT",
    adImage: WORKSHOP_AD,
  },
  {
    ...makeDraftEvent("e-openhouse", "วันเปิดบ้าน 2569", "u-organizer-2", "u-admin-1"),
    code: "OPH-2569",
    status: "ended",
    date: MOCK_DATES.openhouse,
    startTime: "08:00",
    endTime: "16:00",
  },
  {
    ...makeDraftEvent("e-career", "เส้นทางอาชีพดิจิทัล", "u-organizer-2", "u-admin-1"),
    code: "CAR-1025",
    status: "scheduled",
    date: MOCK_DATES.career,
    startTime: "13:00",
    endTime: "16:00",
  },
  {
    ...makeDraftEvent("e-comm", "การสื่อสารยุคดิจิทัล", "u-organizer-3", "u-admin-1"),
    code: "COM-1018",
    status: "ended",
    date: MOCK_DATES.comm,
    startTime: "09:00",
    endTime: "12:00",
  },
];
