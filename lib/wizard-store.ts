import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { EventDraft } from "@/types/event";
import type { Event } from "@/types";
import { createMockDrafts } from "@/lib/mock/event-draft";
import { migrateField } from "@/lib/form-types";

type PatchValue<K extends keyof EventDraft> = EventDraft[K] extends object | null
  ? EventDraft[K] extends null ? EventDraft[K] : Partial<NonNullable<EventDraft[K]>> | EventDraft[K]
  : EventDraft[K];

interface State {
  drafts: Record<string, EventDraft>; // Event ทั้งหมดของ Event Admin คนนี้
  draft: EventDraft; // Event ที่กำลังแก้ในวิซาร์ด (mirror ของ drafts[id])
  step: number;
  setStep: (n: number) => void;
  load: (id: string) => void;
  /** เชื่อม store หลัก: ถ้า Super สร้าง Draft Event ที่ wizard ยังไม่รู้จัก ให้เอามาเพิ่ม */
  ensureFromMainStore: (ev: Event) => void;
  patchEvent: <K extends keyof EventDraft>(id: string, key: K, value: PatchValue<K>) => void;
  patch: <K extends keyof EventDraft>(key: K, value: PatchValue<K>) => void;
  publish: () => void;
}

const isPlain = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

// แปลง Event (store หลัก) → EventDraft (ของวิซาร์ด) โครงเริ่มต้นแบบขั้นต่ำ
function toDraft(ev: Event): EventDraft {
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
    // รูปโฆษณาเดิมใน store หลัก (URL) → รายการแรก
    ads: { items: ev.adImage ? [{ name: "โฆษณา", sizeKB: 0, cropped: true, dataUrl: ev.adImage }] : [], seconds: DEFAULT_AD_SECONDS },
    form: { fields: [] },
    schedule: {
      regOpen: ev.registration?.opensAt ?? "",
      regClose: ev.registration?.closesAt ?? "",
      maxAttendees: "", // ไม่จำกัดจำนวนแล้ว
      surveyOpen: ev.surveyWindow?.opensAt ?? "",
      surveyClose: ev.surveyWindow?.closesAt ?? "",
      remindAfterEnd: false,
    },
    survey: { enabled: true, questions: [] }, // Survey บังคับมีทุก Event (ไม่มีสวิตช์ปิดแล้ว)
  };
}

export const DEFAULT_AD_SECONDS = 6;

// ข้อมูลเก่าใน localStorage → รูปแบบปัจจุบัน (v5) · ทุกขั้นเรียกซ้ำได้ (ข้อมูลใหม่ผ่านแล้วไม่เปลี่ยน)
// - v3: ad (รูปเดียว) → ads.items (หลายรูป) + seconds · เลิกจำกัดจำนวนรับ / เลิกส่งข้อความเตือน
// - v4: Survey บังคับมีทุก Event → enabled = true เสมอ
// - v5: ฟอร์มลงทะเบียน 12 ประเภท · ช่องพื้นฐานเดิม (basicKey) → ประเภทปกติ (lib/form-types.ts)
type DraftV2 = Omit<EventDraft, "ads"> & { ad?: EventDraft["ads"]["items"][number] | null; ads?: EventDraft["ads"] };
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

const initial = createMockDrafts();

export const useWizardStore = create<State>()(
  persist(
    (set, get) => ({
      drafts: initial,
      draft: Object.values(initial)[0],
      step: 1,
      setStep: (step) => set({ step }),
      load: (id) =>
        set((s) => {
          const d = s.drafts[id];
          if (!d) return s;
          return { draft: d, step: s.draft.id === id ? s.step : 1 };
        }),
      // ถ้า Event นี้ยังไม่อยู่ใน wizard store → แปลงจาก store หลักมาเพิ่ม
      ensureFromMainStore: (ev) =>
        set((s) => (s.drafts[ev.id] ? s : { drafts: { ...s.drafts, [ev.id]: toDraft(ev) } })),
      patchEvent: (id, key, value) =>
        set((s) => {
          const cur = s.drafts[id];
          if (!cur) return s;
          const prev = cur[key] as unknown;
          const next = {
            ...cur,
            [key]: isPlain(value) && isPlain(prev) ? { ...prev, ...(value as Record<string, unknown>) } : value,
          } as EventDraft;
          return { drafts: { ...s.drafts, [id]: next }, draft: s.draft.id === id ? next : s.draft };
        }),
      patch: (key, value) => get().patchEvent(get().draft.id, key, value),
      publish: () => get().patchEvent(get().draft.id, "status", "scheduled"),
    }),
    {
      name: "event-admin-store-v2",
      version: 5,
      migrate: (persisted, fromVersion) => {
        const s = persisted as { drafts?: Record<string, DraftV2>; draft?: DraftV2 };
        if (fromVersion < 5) {
          if (s.drafts) {
            s.drafts = Object.fromEntries(Object.entries(s.drafts).map(([k, d]) => [k, migrateDraft(d)]));
          }
          if (s.draft) s.draft = migrateDraft(s.draft);
        }
        return s as unknown as State;
      },
    }
  )
);
