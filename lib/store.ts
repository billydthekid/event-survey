// login + localStorage// lib/store.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { User } from "@/types";
import { getApi } from "@/lib/api";

interface StoreState {
  currentUser: User | null;
  hydrated: boolean;
  login: (username: string, password: string) => Promise<User>;
  logout: () => void;
  setHydrated: (v: boolean) => void;
}

export const useStore = create<StoreState>()(
  persist(
    (set) => ({
      currentUser: null,
      hydrated: false,

      login: async (username, password) => {
        const user = await getApi().auth.login(username, password);
        set({ currentUser: user });
        return user;
      },

      logout: () => set({ currentUser: null }),

      setHydrated: (v) => set({ hydrated: v }),
    }),
    {
      name: "esp.session",
      partialize: (s) => ({ currentUser: s.currentUser }),
      skipHydration: true,
    }
  )
);