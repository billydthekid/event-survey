export type EventType = "seminar" | "workshop" | "training" | "jobfair" | "openhouse";
/** สถานะที่เก็บจริง (draft → scheduled เมื่อกดเผยแพร่) ส่วน open/active/ended คำนวณจากเวลา ดู lib/utils/event-phase.ts */
export type EventStatus = "draft" | "scheduled";
export type FieldKind = "text" | "email" | "number" | "dropdown" | "multiselect";
export type BasicFieldKey = "name" | "email" | "age" | "gender" | "phone" | "idno";
export type SurveyQType = "short" | "long" | "single" | "multi" | "dropdown" | "rating" | "date";

export interface UploadedAsset {
  name: string;
  sizeKB: number;
  cropped?: boolean;
}

export interface FormField {
  id: string;
  label: string;
  kind: FieldKind;
  hint: string;
  required: boolean;
  basicKey?: BasicFieldKey;
}

export interface SurveyQuestion {
  id: string;
  type: SurveyQType;
  titleTh: string;
  titleEn: string;
  required: boolean;
  options: string[]; // ใช้กับ single / multi / dropdown
}

export interface EventDraft {
  id: string;
  code: string;
  status: EventStatus;
  assignedBy: string;
  general: {
    nameTh: string;
    nameEn: string;
    descTh: string;
    descEn: string;
    type: EventType;
    organizer: string;
    phone: string;
    email: string;
    showContact: boolean;
    mode: "onsite" | "online";
    date: string; // yyyy-MM-dd
    startTime: string; // HH:mm
    endTime: string;
    venue: string;
    spot: string;
    mapUrl: string;
    cover: UploadedAsset | null;
  };
  theme: {
    primary: string;
    secondary: string;
    mode: "light" | "dark" | "bold";
    bgType: "color" | "image";
    bg: UploadedAsset | null;
    logo: UploadedAsset | null;
  };
  ad: UploadedAsset | null;
  form: { fields: FormField[] };
  schedule: {
    regOpen: string; // yyyy-MM-ddTHH:mm
    regClose: string;
    maxAttendees: string;
    surveyOpen: string;
    surveyClose: string;
    remindAfterEnd: boolean;
  };
  survey: { enabled: boolean; questions: SurveyQuestion[] };
}

/** ผู้ลงทะเบียน: values เก็บตาม id ของ field ในฟอร์ม */
export interface Registration {
  id: string;
  values: Record<string, string>;
  registeredAt: string;
  checkedIn: boolean;
}

export interface SurveyResponse {
  id: string;
  registrationId: string;
  submittedAt: string;
  answers: Record<string, string | string[] | number>;
}
