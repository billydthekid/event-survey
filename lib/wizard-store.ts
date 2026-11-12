import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { EventDraft } from "@/types/event";
import type { Event } from "@/types";
import { createMockDrafts } from "@/lib/mock/event-draft";

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
    ad: null,
    form: { fields: [] },
    schedule: {
      regOpen: ev.registration?.opensAt ?? "",
      regClose: ev.registration?.closesAt ?? "",
      maxAttendees: ev.registration?.maxAttendees?.toString() ?? "",
      surveyOpen: ev.surveyWindow?.opensAt ?? "",
      surveyClose: ev.surveyWindow?.closesAt ?? "",
      remindAfterEnd: false,
    },
    survey: { enabled: !!ev.survey?.enabled, questions: [] },
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
    { name: "event-admin-store-v2", version: 2 }
  )
);
