import { create } from "zustand";
import type { AuthHealthSnapshot, Platform } from "../../shared/types";

type AuthStoreState = {
  authBusy: Platform | null;
  authMessage: string;
  authHealth: AuthHealthSnapshot | null;
  authHealthBusy: boolean;
  setAuthBusy: (platform: Platform | null) => void;
  setAuthMessage: (message: string) => void;
  setAuthHealth: (snapshot: AuthHealthSnapshot | null) => void;
  setAuthHealthBusy: (busy: boolean) => void;
  resetAuthUi: () => void;
};

export const useAuthStore = create<AuthStoreState>((set) => ({
  authBusy: null,
  authMessage: "",
  authHealth: null,
  authHealthBusy: false,
  setAuthBusy: (platform) => set({ authBusy: platform }),
  setAuthMessage: (message) => set({ authMessage: message }),
  setAuthHealth: (snapshot) => set({ authHealth: snapshot }),
  setAuthHealthBusy: (busy) => set({ authHealthBusy: busy }),
  resetAuthUi: () =>
    set({
      authBusy: null,
      authMessage: "",
      authHealthBusy: false,
    }),
}));
