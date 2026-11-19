import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { EventDraft } from "@/types/event";
import type { Event } from "@/types";
import { createMockDrafts } from "@/lib/mock/event-draft";
import { migrateField } from "@/lib/form-types";
import { DEFAULT_PRESET, applyPreset } from "@/lib/theme-presets";

// ฟ้าใส: ชนิดของค่าที่ส่งให้ patch: ถ้าเป็น object ส่งแค่บางช่องได้ (Partial) แล้วจะรวมกับค่าเดิม
type PatchValue<K extends keyof EventDraft> = EventDraft[K] extends object | null
  ? EventDraft[K] extends null ? EventDraft[K] : Partial<NonNullable<EventDraft[K]>> | EventDraft[K]
  : EventDraft[K];

// ฟ้าใส: หน้าตาของ store: ข้อมูลทุก Event + Event ที่เปิดอยู่ + ขั้นที่อยู่ + ฟังก์ชันแก้ข้อมูล
interface State {
  drafts: Record<string, EventDraft>; // ฟ้าใส: Event ทั้งหมดของ Event Admin คนนี้
  draft: EventDraft; // ฟ้าใส: Event ที่กำลังแก้ในวิซาร์ด (mirror ของ drafts[id])
  step: number;
  // ฟ้าใส: เปลี่ยนขั้นที่กำลังทำ (จำไว้ใน localStorage)
  setStep: (n: number) => void;
  // ฟ้าใส: เลือก Event ที่จะแก้ในหน้าตั้งค่า
  load: (id: string) => void;
  /** ฟ้าใส: เชื่อม store หลัก: ถ้า Super สร้าง Draft Event ที่ wizard ยังไม่รู้จัก ให้เอามาเพิ่ม */
  ensureFromMainStore: (ev: Event) => void;
  patchEvent: <K extends keyof EventDraft>(id: string, key: K, value: PatchValue<K>) => void;
  patch: <K extends keyof EventDraft>(key: K, value: PatchValue<K>) => void;
  // ฟ้าใส: กดเผยแพร่ → เปลี่ยนสถานะใน Wizard เป็น scheduled
  publish: () => void;
  /** ฟ้าใส: ล้าง Event กลับเป็นตอนก่อนกรอกครั้งแรก (เก็บชื่อ Event ไว้) และกลับไปขั้นที่ 1 */
  resetDraft: (id: string) => void;
}

// ฟ้าใส: เช็กว่าเป็น object ธรรมดา (ไม่ใช่ array / null) ใช้ตัดสินว่าจะรวมค่าหรือแทนที่
const isPlain = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

// ฟ้าใส: แปลง Event (store หลัก) → EventDraft (ของวิซาร์ด) โครงเริ่มต้นแบบขั้นต่ำ
function toDraft(ev: Event): EventDraft {
  // ฟ้าใส: สถานะใน Wizard มีแค่ draft กับ scheduled (สถานะจริงอยู่ใน store หลัก)
  const status: EventDraft["status"] = ev.status === "draft" ? "draft" : "scheduled";
  return {
    id: ev.id,
    code: ev.code,
    status,
    assignedBy: "",
    general: {
      nameTh: ev.name?.th ?? "",
      nameEn: ev.name?.en ?? "",
      descTh: ev.description?.th ?? "",
      descEn: ev.description?.en ?? "",
      type: ev.type ?? "seminar",
      organizer: ev.organizerName ?? "",
      phone: ev.phone ?? "",
      email: ev.email ?? "",
      showContact: ev.showContact ?? true,
      mode: ev.mode ?? "onsite",
      date: ev.date ?? "",
      startTime: ev.startTime ?? "",
      endTime: ev.endTime ?? "",
      venue: ev.venue ?? "",
      spot: ev.meetingPoint ?? "",
      mapUrl: ev.mapUrl ?? "",
      cover: ev.coverImage ? { name: "cover", sizeKB: 0 } : null,
    },
    theme: {
      primary: ev.theme?.primary ?? "#2563EB",
      secondary: ev.theme?.secondary ?? "#DBEAFE",
      mode: ev.theme?.kind ?? "light",
      bgType: ev.theme?.background?.type ?? "color",
      bg: null,
      logo: null,
    },
    // ฟ้าใส: รูปโฆษณาเดิมใน store หลัก (URL) → รายการแรก
    ads: { items: ev.adImage ? [{ name: "โฆษณา", sizeKB: 0, cropped: true, dataUrl: ev.adImage }] : [], seconds: DEFAULT_AD_SECONDS },
    form: { fields: [] },
    schedule: {
      regOpen: ev.registration?.opensAt ?? "",
      regClose: ev.registration?.closesAt ?? "",
      maxAttendees: "", // ฟ้าใส: ไม่จำกัดจำนวนแล้ว
      surveyOpen: ev.surveyWindow?.opensAt ?? "",
      surveyClose: ev.surveyWindow?.closesAt ?? "",
      remindAfterEnd: false,
    },
    survey: { enabled: true, questions: [] }, // ฟ้าใส: Survey บังคับมีทุก Event (ไม่มีสวิตช์ปิดแล้ว)
  };
}

// ฟ้าใส: รูปโฆษณาเปลี่ยนทุก 6 วินาทีถ้าไม่ได้ตั้ง
export const DEFAULT_AD_SECONDS = 6;

// ฟ้าใส: ข้อมูลเก่าใน localStorage → รูปแบบปัจจุบัน (v5) · ทุกขั้นเรียกซ้ำได้ (ข้อมูลใหม่ผ่านแล้วไม่เปลี่ยน)
// ฟ้าใส: - v3: ad (รูปเดียว) → ads.items (หลายรูป) + seconds · เลิกจำกัดจำนวนรับ / เลิกส่งข้อความเตือน
// ฟ้าใส: - v4: Survey บังคับมีทุก Event → enabled = true เสมอ
// ฟ้าใส: - v5: ฟอร์มลงทะเบียน 12 ประเภท · ช่องพื้นฐานเดิม (basicKey) → ประเภทปกติ (lib/form-types.ts)
type DraftV2 = Omit<EventDraft, "ads"> & { ad?: EventDraft["ads"]["items"][number] | null; ads?: EventDraft["ads"] };
// ฟ้าใส: แปลงข้อมูลเก่าใน localStorage ให้เป็นรูปแบบล่าสุด
function migrateDraft(d: DraftV2): EventDraft {
  const { ad, ...rest } = d;
  return {
    ...rest,
    ads: rest.ads ?? { items: ad ? [ad] : [], seconds: DEFAULT_AD_SECONDS },
    schedule: { ...rest.schedule, maxAttendees: "", remindAfterEnd: false },
    survey: { ...rest.survey, enabled: true },
    form: { fields: rest.form.fields.map((f) => migrateField(f as Parameters<typeof migrateField>[0])) },
  };
}

/**
 * Event ว่างแบบตอนก่อนกรอกครั้งแรก — เก็บไว้แค่ id, รหัสงาน, สถานะ, ผู้มอบหมาย และชื่อ Event (ที่ Super ตั้งตอนสร้าง)
 * ที่เหลือ: ข้อมูลทั่วไปว่าง · ธีมมินิมอล ไม่มีรูป · ไม่มีโฆษณา / ฟอร์ม / คำถาม / ช่วงเวลา · Event เปิด
 */
export function blankDraft(d: EventDraft): EventDraft {
  return {
    id: d.id,
    code: d.code,
    status: d.status,
    assignedBy: d.assignedBy,
    general: {
      nameTh: d.general.nameTh,
      nameEn: d.general.nameEn,
      descTh: "",
      descEn: "",
      type: "seminar",
      typeOther: "",
      organizer: "",
      phone: "",
      email: "",
      showContact: true,
      mode: "onsite",
      date: "",
      startTime: "",
      endDate: "",
      endTime: "",
      venue: "",
      spot: "",
      mapUrl: "",
      cover: null,
    },
    theme: {
      ...(applyPreset(DEFAULT_PRESET) as Pick<EventDraft["theme"], "primary" | "secondary" | "mode" | "bgType" | "bgColor" | "preset">),
      bg: null,
      logo: null,
    },
    ads: { items: [], seconds: DEFAULT_AD_SECONDS },
    form: { fields: [] },
    schedule: { regOpen: "", regClose: "", maxAttendees: "", surveyOpen: "", surveyClose: "", remindAfterEnd: false },
    survey: { enabled: true, questions: [] },
  };
}

// ฟ้าใส: ข้อมูลตัวอย่างตอนเปิดเว็บครั้งแรก
const initial = createMockDrafts();

// ฟ้าใส: สร้าง store ของ Wizard + persist = บันทึกลง localStorage อัตโนมัติทุกครั้งที่ข้อมูลเปลี่ยน
export const useWizardStore = create<State>()(
  persist(
    (set, get) => ({
      drafts: initial,
      draft: Object.values(initial)[0],
      step: 1,
      // ฟ้าใส: เปลี่ยนขั้นที่อยู่
      setStep: (step) => set({ step }),
      // ฟ้าใส: เลือก Event ที่จะแก้ (เปลี่ยน Event = เริ่มที่ขั้น 1)
      load: (id) =>
        set((s) => {
          // ฟ้าใส: หา Event จาก id
          const d = s.drafts[id];
          // ฟ้าใส: ไม่พบ Event → ไม่เปลี่ยนอะไร
          if (!d) return s;
          return { draft: d, step: s.draft.id === id ? s.step : 1 };
        }),
      // ฟ้าใส: ถ้า Event นี้ยังไม่อยู่ใน wizard store → แปลงจาก store หลักมาเพิ่ม
      ensureFromMainStore: (ev) =>
        set((s) => (s.drafts[ev.id] ? s : { drafts: { ...s.drafts, [ev.id]: toDraft(ev) } })),
      // ฟ้าใส: แก้ข้อมูล 1 ส่วนของ Event ตาม id (เช่น general, theme)
      patchEvent: (id, key, value) =>
        set((s) => {
          // ฟ้าใส: Event ที่จะแก้
          const cur = s.drafts[id];
          // ฟ้าใส: ไม่พบ → ไม่เปลี่ยน
          if (!cur) return s;
          // ฟ้าใส: ค่าเดิมของส่วนนั้น
          const prev = cur[key] as unknown;
          // ฟ้าใส: ค่าใหม่: ถ้าเป็น object รวมกับค่าเดิม ถ้าไม่ใช่แทนที่เลย
          const next = {
            ...cur,
            [key]: isPlain(value) && isPlain(prev) ? { ...prev, ...(value as Record<string, unknown>) } : value,
          } as EventDraft;
          return { drafts: { ...s.drafts, [id]: next }, draft: s.draft.id === id ? next : s.draft };
        }),
      // ฟ้าใส: แก้ข้อมูลของ Event ที่เปิดอยู่ (ทางลัดของ patchEvent)
      patch: (key, value) => get().patchEvent(get().draft.id, key, value),
      // ฟ้าใส: เผยแพร่ Event ที่เปิดอยู่
      publish: () => get().patchEvent(get().draft.id, "status", "scheduled"),
      // ฟ้าใส: ปุ่มรีเซ็ต: ล้าง Event กลับเป็นตอนก่อนกรอก แล้วกลับขั้น 1
      resetDraft: (id) =>
        set((s) => {
          // ฟ้าใส: Event ที่จะรีเซ็ต
          const cur = s.drafts[id];
          // ฟ้าใส: ไม่พบ → ไม่ทำอะไร
          if (!cur) return s;
          // ฟ้าใส: สร้าง Event ว่าง (เก็บชื่อไว้)
          const next = blankDraft(cur);
          return { drafts: { ...s.drafts, [id]: next }, draft: s.draft.id === id ? next : s.draft, step: 1 };
        }),
    }),
    {
      name: "event-admin-store-v2",
      version: 5,
      // ฟ้าใส: เปิดเว็บด้วยข้อมูลเวอร์ชันเก่า → แปลงก่อนใช้
      migrate: (persisted, fromVersion) => {
        // ฟ้าใส: ข้อมูลที่อ่านมาจาก localStorage
        const s = persisted as { drafts?: Record<string, DraftV2>; draft?: DraftV2 };
        // ฟ้าใส: ข้อมูลเก่ากว่าเวอร์ชัน 5 ต้องแปลง
        if (fromVersion < 5) {
          // ฟ้าใส: แปลงทุก Event ใน drafts
          if (s.drafts) {
            s.drafts = Object.fromEntries(Object.entries(s.drafts).map(([k, d]) => [k, migrateDraft(d)]));
          }
          // ฟ้าใส: แปลง Event ที่เปิดอยู่ด้วย
          if (s.draft) s.draft = migrateDraft(s.draft);
        }
        return s as unknown as State;
      },
    }
  )
);
