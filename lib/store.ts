// lib/store.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { User, Event, ActionLog, Role, Registration, SurveyResponse } from "@/types";
import { mockUsers } from "@/lib/mock/user";
import { mockEvents, makeDraftEvent, WORKSHOP_AD } from "@/lib/mock/events";
import { mockRegistrations, mockResponses } from "@/lib/mock/responses";
import { makeUsername } from "@/lib/utils/username";
import { KEEP_DAYS } from "@/lib/utils/status";

interface NewUserInput {
  name: string;
  base: string;      // ชื่อฐาน เช่น "pimchanok" → ระบบเติม .admin/.organizer ให้
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
  deleteUser: (userId: string) => void;
  // adminId ปล่อยว่าง (null) = สร้าง event ยังไม่เลือกผู้ดูแล, ไป assign ที่หน้า /super/events ทีหลัง
  createDraftEvent: (eventName: string, adminId?: string | null) => Event;
  // เปลี่ยน/เพิ่มผู้ดูแล event (ใช้บนหน้า Event list ของ Admin)
  setEventAdmin: (eventId: string, adminId: string) => void;
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
      // ตรวจ login จาก mock users ใน store ตรงๆ (ไม่ผ่าน api layer แล้ว)
      login: async (username, password) => {
        const user = get().users.find((u) => u.username === username.trim());
        if (!user || user.password !== password) {
          throw new Error("Username หรือรหัสผ่านไม่ถูกต้อง");
        }
        if (!user.active) {
          throw new Error("บัญชีนี้ถูกปิดใช้งาน");
        }
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

      // ---------- สร้างบัญชี ----------
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

      // ---------- ลบบัญชี (hard delete) ----------
      // กันลบตัวเอง: ให้ UI เช็กก่อนเรียก; ถ้าหลุดเข้ามาก็ไม่ทำอะไร
      deleteUser: (userId) => {
        const me = get().currentUser;
        if (me?.id === userId) return;

        const target = get().users.find((u) => u.id === userId);
        if (!target) return;

        // ลบบัญชี + ถอด user ออกจาก adminIds ของทุก event
        set({
          users: get().users.filter((u) => u.id !== userId),
          events: get().events.map((e) => ({
            ...e,
            adminIds: e.adminIds.filter((id) => id !== userId),
          })),
        });
        get().addLog("delete_user", "user", userId, `ลบบัญชี ${target.username}`);
      },

      // ---------- สร้าง Draft Event ----------
      // adminId = null → ยังไม่เลือกผู้ดูแล (Admin จะไป assign ที่หน้า /super/events)
      createDraftEvent: (eventName, adminId) => {
        const me = get().currentUser;
        const event = makeDraftEvent(
          "e-" + Date.now(),
          eventName.trim(),
          adminId ?? null,
          me?.id ?? ""
        );
        set({
          events: [...get().events, event],
          users: adminId
            ? get().users.map((u) =>
                u.id === adminId ? { ...u, eventIds: [...u.eventIds, event.id] } : u
              )
            : get().users,
        });
        get().addLog("create_event", "event", event.id, `สร้าง Draft "${event.name.th}"`);
        return event;
      },

      // ---------- เปลี่ยน/เพิ่มผู้ดูแล Event ----------
      // ลบ event id ออกจาก organizer คนเดิม + ใส่ให้คนใหม่ + ตั้ง adminIds = [newAdminId]
      setEventAdmin: (eventId, newAdminId) => {
        const event = get().events.find((e) => e.id === eventId);
        if (!event) return;
        const oldAdminIds = event.adminIds;

        set({
          events: get().events.map((e) =>
            e.id === eventId ? { ...e, adminIds: [newAdminId] } : e
          ),
          users: get().users.map((u) => {
            // ลบ event id ออกจาก organizer เดิม
            if (oldAdminIds.includes(u.id) && u.id !== newAdminId) {
              return { ...u, eventIds: u.eventIds.filter((id) => id !== eventId) };
            }
            // เพิ่มให้ organizer ใหม่ (ถ้ายังไม่มี)
            if (u.id === newAdminId && !u.eventIds.includes(eventId)) {
              return { ...u, eventIds: [...u.eventIds, eventId] };
            }
            return u;
          }),
        });

        const newUser = get().users.find((u) => u.id === newAdminId);
        get().addLog(
          "assign_event_admin",
          "event",
          eventId,
          `มอบหมายให้ ${newUser?.name ?? newAdminId}`
        );
      },

      // ---------- รีเซ็ต password (Admin ตั้งรหัสเองได้) ----------
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

      // ---------- ลบ Event (Soft delete เก็บ 30 วัน) ----------
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
      // v1: ใส่รูปโฆษณา Kiosk ให้ Workshop Figma (e-workshop)
      // v2: เปลี่ยนชื่อ role: "super" → "admin", "event" → "organizer"
      // v3: แปลง username suffix เก่า (.super/.event) ให้ตรงชื่อใหม่ (.admin/.organizer)
      version: 3,
      migrate: (persisted, fromVersion) => {
        const s = persisted as Partial<StoreState> & Record<string, unknown>;

        // v0 → v1: เติม adImage ให้ Workshop Figma
        if (fromVersion < 1 && Array.isArray(s.events)) {
          s.events = s.events.map((e) =>
            e.id === "e-workshop" && !e.adImage ? { ...e, adImage: WORKSHOP_AD } : e
          );
        }

        // v1 → v2: แปลง role เก่า → ใหม่
        if (fromVersion < 2) {
          const renameRole = (r: unknown): Role =>
            r === "super" ? "admin" : r === "event" ? "organizer" : (r as Role);

          if (Array.isArray(s.users)) {
            s.users = s.users.map((u) => ({ ...u, role: renameRole(u.role) }));
          }
          if (s.currentUser) {
            s.currentUser = {
              ...s.currentUser,
              role: renameRole(s.currentUser.role),
            };
          }
        }

        // v2 → v3: แปลง username suffix เก่า → ใหม่
        //   nattapol.event → nattapol.organizer
        //   thanapath.super → thanapath.admin
        if (fromVersion < 3) {
          const renameUsername = (u: string): string =>
            u.endsWith(".super")
              ? u.slice(0, -".super".length) + ".admin"
              : u.endsWith(".event")
                ? u.slice(0, -".event".length) + ".organizer"
                : u;

          if (Array.isArray(s.users)) {
            s.users = s.users.map((u) => ({
              ...u,
              username: renameUsername(u.username),
            }));
          }
          if (s.currentUser) {
            s.currentUser = {
              ...s.currentUser,
              username: renameUsername(s.currentUser.username),
            };
          }
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
