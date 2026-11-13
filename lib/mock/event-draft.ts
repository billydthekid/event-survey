import { addDays, format } from "date-fns";
import type { EventDraft, SurveyQuestion } from "@/types/event";

const day = (n: number) => format(addDays(new Date(), n), "yyyy-MM-dd");
const dt = (n: number, t: string) => `${day(n)}T${t}`;

const q = (
  id: string,
  type: SurveyQuestion["type"],
  titleTh: string,
  options: string[] = [],
  required = true
): SurveyQuestion => ({ id, type, titleTh, titleEn: "", required, options });

const formFields = (): EventDraft["form"]["fields"] => [
  { id: "f-name", label: "ชื่อ – นามสกุล", kind: "text", hint: "ข้อความสั้น", required: true, basicKey: "name" },
  { id: "f-sid", label: "รหัสนักศึกษา", kind: "number", hint: "Custom · ตัวเลข 10 หลัก", required: true },
  { id: "f-year", label: "ชั้นปี", kind: "dropdown", hint: "Dropdown · ปี 1–4 / ศิษย์เก่า", required: true },
  { id: "f-email", label: "อีเมล", kind: "email", hint: "อีเมล", required: true, basicKey: "email" },
  { id: "f-track", label: "สายที่สนใจ", kind: "multiselect", hint: "Custom · หลายตัวเลือก", required: false },
];

interface Opts {
  id: string;
  code: string;
  status: EventDraft["status"];
  nameTh: string;
  descTh: string;
  type: EventDraft["general"]["type"];
  venue: string;
  spot: string;
  dayOffset: number;
  start: string;
  end: string;
  regOpenOffset: number;
  max: string;
  primary: string;
  secondary: string;
  questions: SurveyQuestion[];
}

function make(o: Opts): EventDraft {
  const date = day(o.dayOffset);
  return {
    id: o.id,
    code: o.code,
    status: o.status,
    assignedBy: "ศิริพร วัฒนกุล",
    general: {
      nameTh: o.nameTh, nameEn: "", descTh: o.descTh, descEn: "", type: o.type,
      organizer: "คณะเทคโนโลยีสารสนเทศ", phone: "", email: "event@example.ac.th", showContact: true,
      mode: "onsite", date, startTime: o.start, endTime: o.end,
      venue: o.venue, spot: o.spot, mapUrl: "", cover: { name: `cover-${o.code}.jpg`, sizeKB: 512 },
    },
    theme: { primary: o.primary, secondary: o.secondary, mode: "light", bgType: "color", bg: null, logo: null },
    ads: { items: [{ name: `poster-${o.code}.jpg`, sizeKB: 820, cropped: o.status !== "draft" }], seconds: 6 },
    form: { fields: formFields() },
    schedule: {
      regOpen: dt(o.regOpenOffset, "09:00"),
      regClose: `${date}T${o.start}`,
      maxAttendees: "", // ไม่จำกัดจำนวนแล้ว (เดิม o.max)
      surveyOpen: `${date}T${o.end}`,
      surveyClose: dt(o.dayOffset + 3, "23:59"),
      remindAfterEnd: false,
    },
    survey: { enabled: true, questions: o.questions },
  };
}

export const createMockDrafts = (): Record<string, EventDraft> => {
  const a = make({
    id: "evt-1017", code: "FIG-1017", status: "draft",
    nameTh: "Job Fair คณะเทคโนโลยีสารสนเทศ",
    descTh: "พบบริษัทชั้นนำด้านไอทีกว่า 20 บริษัท สัมภาษณ์งานและฝึกงานได้ภายในวัน",
    type: "jobfair", venue: "ลานกิจกรรม อาคาร 11", spot: "ชั้น 1",
    dayOffset: 7, start: "09:00", end: "16:00", regOpenOffset: -2, max: "300",
    primary: "#7C3AED", secondary: "#EDE9FE",
    questions: [
      q("q1", "rating", "ความพึงพอใจโดยรวมต่องาน Job Fair"),
      q("q2", "single", "คุณสนใจบริษัทกลุ่มไหนมากที่สุด", ["IT / Software", "Data / AI", "Network / Security", "Startup"]),
      q("q3", "long", "ข้อเสนอแนะเพิ่มเติม", [], false),
    ],
  });
  const b = make({
    id: "evt-1018", code: "WSP-1018", status: "scheduled",
    nameTh: "Workshop Figma เบื้องต้น",
    descTh: "เรียนรู้พื้นฐานการออกแบบ UI ด้วย Figma ตั้งแต่ศูนย์ พร้อมลงมือทำจริง",
    type: "workshop", venue: "ห้องปฏิบัติการคอมพิวเตอร์ 3", spot: "ชั้น 2",
    dayOffset: 2, start: "13:00", end: "16:00", regOpenOffset: -10, max: "60",
    primary: "#2563EB", secondary: "#DBEAFE",
    questions: [
      q("q1", "rating", "ความพึงพอใจโดยรวมต่อ Workshop"),
      q("q2", "single", "คุณรู้จักงานนี้จากช่องทางใด", ["เพื่อน", "โซเชียลมีเดีย", "ป้ายประชาสัมพันธ์", "อื่น ๆ"]),
      q("q3", "multi", "หัวข้อที่อยากให้จัดเพิ่ม", ["Prototype", "Design System", "Auto Layout", "Handoff"], false),
      q("q4", "long", "ข้อเสนอแนะเพิ่มเติม", [], false),
    ],
  });
  const c = make({
    id: "evt-1016", code: "OPH-1016", status: "scheduled",
    nameTh: "Open House คณะเทคโนโลยีสารสนเทศ",
    descTh: "เปิดบ้านต้อนรับน้อง ๆ ม.ปลาย ชมห้องแล็บและกิจกรรมของคณะ",
    type: "openhouse", venue: "อาคาร 11 ชั้น 1–3", spot: "จุดลงทะเบียนหน้าอาคาร",
    dayOffset: -4, start: "09:00", end: "15:00", regOpenOffset: -20, max: "300",
    primary: "#0F766E", secondary: "#FEF3C7",
    questions: [
      q("q1", "rating", "ความพึงพอใจโดยรวมต่องาน Open House"),
      q("q2", "dropdown", "คุณสนใจสาขาไหนมากที่สุด", ["วิทยาการคอมพิวเตอร์", "เทคโนโลยีสารสนเทศ", "วิทยาการข้อมูล", "ยังไม่แน่ใจ"]),
      q("q3", "date", "วันที่สะดวกให้ติดต่อกลับ", [], false),
      q("q4", "short", "ข้อเสนอแนะสั้น ๆ", [], false),
    ],
  });
  return { [a.id]: a, [b.id]: b, [c.id]: c };
};

export const BASIC_FIELDS = [
  { basicKey: "name", label: "ชื่อ – นามสกุล", kind: "text", hint: "ข้อความสั้น" },
  { basicKey: "email", label: "อีเมล", kind: "email", hint: "อีเมล" },
  { basicKey: "age", label: "อายุ", kind: "number", hint: "ตัวเลข" },
  { basicKey: "gender", label: "เพศ", kind: "dropdown", hint: "Dropdown" },
  { basicKey: "phone", label: "เบอร์โทร", kind: "text", hint: "เบอร์โทรศัพท์" },
  { basicKey: "idno", label: "เลขประจำตัว", kind: "text", hint: "ข้อความสั้น" },
] as const;
