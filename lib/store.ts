// lib/store.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { User, Event, ActionLog, Role, Registration, SurveyResponse } from "@/types";
import { getApi } from "@/lib/api";
import { mockUsers } from "@/lib/mock/user";
import { mockEvents, makeDraftEvent, WORKSHOP_AD } from "@/lib/mock/events";
import { mockRegistrations, mockResponses } from "@/lib/mock/responses";
import { makeUsername } from "@/lib/utils/username";
import { KEEP_DAYS } from "@/lib/utils/status";

interface NewUserInput {
  name: string;
  base: string;      // ชื่อฐาน เช่น "pimchanok" → ระบบเติม .event/.super ให้
  org: string;
  role: Role;
  password: string;
}

interface StoreState {
  // ===== Session =====
  currentUser: User | null;
  hydrated: boolean;

  // ===== Data =====
  users: User[];
  events: Event[];
  logs: ActionLog[];
  registrations: Registration[];   // คนลงทะเบียน (Dashboard / Report ใช้)
  responses: SurveyResponse[];     // คำตอบ Survey

  // ===== Actions =====
  login: (username: string, password: string) => Promise<User>;
  logout: () => void;
  setHydrated: (v: boolean) => void;

  addUser: (input: NewUserInput) => User;
  createDraftEvent: (eventName: string, adminId: string) => Event;
  resetPassword: (userId: string, newPassword: string) => void;
  toggleActive: (userId: string) => void;
  addLog: (action: string, targetType: string, targetId: string, detail?: string) => void;
  deleteEvent: (eventId: string) => void;
  restoreEvent: (eventId: string) => void;
  purgeExpired: () => void;
}

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      currentUser: null,
      hydrated: false,
      users: mockUsers,
      events: mockEvents,
      logs: [],
      registrations: mockRegistrations,
      responses: mockResponses,

      // ---------- Session ----------
      login: async (username, password) => {
        const user = await getApi().auth.login(username, password);
        set({
          currentUser: user,
          users: get().users.map((u) =>
            u.id === user.id ? { ...u, lastLoginAt: new Date().toISOString() } : u
          ),
        });
        get().addLog("login", "user", user.id, "เข้าสู่ระบบสำเร็จ");
        return user;
      },

      logout: () => set({ currentUser: null }),
      setHydrated: (v) => set({ hydrated: v }),

      // ---------- ขั้นที่ 1: สร้างบัญชี ----------
      addUser: (input) => {
        const user: User = {
          id: "u-" + Date.now(),
          name: input.name.trim(),
          username: makeUsername(input.base, input.role),
          password: input.password,
          role: input.role,
          org: input.org.trim(),
          active: true,
          lang: "th",
          eventIds: [],
          createdAt: new Date().toISOString(),
        };
        set({ users: [...get().users, user] });
        get().addLog("create_user", "user", user.id, `สร้างบัญชี ${user.username}`);
        return user;
      },

      // ---------- ขั้นที่ 2: สร้าง Draft Event ให้บัญชีนั้น ----------
      createDraftEvent: (eventName, adminId) => {
        const me = get().currentUser;
        const event = makeDraftEvent("e-" + Date.now(), eventName.trim(), adminId, me?.id ?? "");
        set({
          events: [...get().events, event],
          users: get().users.map((u) =>
            u.id === adminId ? { ...u, eventIds: [...u.eventIds, event.id] } : u
          ),
        });
        get().addLog("create_event", "event", event.id, `สร้าง Draft "${event.name.th}"`);
        return event;
      },

          // ---------- รีเซ็ต password (Super ตั้งรหัสเองได้) ----------
        resetPassword: (userId, newPassword) => {
        set({
          users: get().users.map((u) => (u.id === userId ? { ...u, password: newPassword } : u)),
        });
        get().addLog("reset_password", "user", userId, "รีเซ็ต password");
      },

      // ---------- เปิด/ปิดบัญชี ----------
      toggleActive: (userId) => {
        const target = get().users.find((u) => u.id === userId);
        set({
          users: get().users.map((u) => (u.id === userId ? { ...u, active: !u.active } : u)),
        });
        get().addLog(
          target?.active ? "disable_user" : "enable_user",
          "user",
          userId,
          target?.active ? "ปิดใช้งานบัญชี" : "เปิดใช้งานบัญชี"
        );
      },

      // ---------- Action Log ----------
      addLog: (action, targetType, targetId, detail) => {
        const log: ActionLog = {
          id: "log-" + Date.now() + "-" + Math.floor(Math.random() * 1000),
          at: new Date().toISOString(),
          actorId: get().currentUser?.id ?? "",
          action,
          targetType,
          targetId,
          detail,
        };
        set({ logs: [log, ...get().logs] });
      },

      // ========== จุด C (ที่ขาดไป) ==========

      // ---------- ลบ (Soft delete เก็บ 30 วัน) ----------
      deleteEvent: (eventId) => {
        const ev = get().events.find((e) => e.id === eventId);
        if (!ev || ev.status === "deleted") return;
        const now = new Date();
        const purge = new Date(now.getTime() + KEEP_DAYS * 24 * 60 * 60 * 1000);
        set({
          events: get().events.map((e) =>
            e.id === eventId
              ? {
                  ...e,
                  prevStatus: e.status,
                  status: "deleted",
                  deletedAt: now.toISOString(),
                  purgeAt: purge.toISOString(),
                }
              : e
          ),
        });
        get().addLog("delete_event", "event", eventId, "ย้ายไปรายการที่ถูกลบ · เก็บข้อมูล 30 วัน");
      },

      // ---------- กู้คืน ----------
      restoreEvent: (eventId) => {
        set({
          events: get().events.map((e) =>
            e.id === eventId
              ? {
                  ...e,
                  status: e.prevStatus ?? "draft",
                  prevStatus: undefined,
                  deletedAt: undefined,
                  purgeAt: undefined,
                }
              : e
          ),
        });
        get().addLog("restore_event", "event", eventId, "กู้คืน Event");
      },

      // ---------- ลบถาวร (เรียกตอนเปิดหน้า ไม่มี scheduled job) ----------
      purgeExpired: () => {
        const now = Date.now();
        const expired = get().events.filter(
          (e) => e.status === "deleted" && e.purgeAt && new Date(e.purgeAt).getTime() <= now
        );
        if (expired.length === 0) return;
        const ids = expired.map((e) => e.id);
        set({
          events: get().events.filter((e) => !ids.includes(e.id)),
          users: get().users.map((u) => ({
            ...u,
            eventIds: u.eventIds.filter((id) => !ids.includes(id)),
          })),
        });
      },
    }),
    {
      name: "esp.session",
      // v1: ใส่รูปโฆษณา Kiosk ให้ Workshop Figma (e-workshop) ที่เก็บใน localStorage ไว้ก่อนแล้ว
      //     ไม่ต้องล้าง localStorage — ข้อมูลอื่นคงเดิม
      version: 1,
      migrate: (persisted, fromVersion) => {
        const s = persisted as Partial<StoreState>;
        if (fromVersion < 1 && Array.isArray(s.events)) {
          s.events = s.events.map((e) =>
            e.id === "e-workshop" && !e.adImage ? { ...e, adImage: WORKSHOP_AD } : e
          );
        }
        return s as StoreState;
      },
      partialize: (s) => ({
        currentUser: s.currentUser,
        users: s.users,
        events: s.events,
        logs: s.logs,
        registrations: s.registrations,
        responses: s.responses,
      }),
      skipHydration: true,
    }
  )
);