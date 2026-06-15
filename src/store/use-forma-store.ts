import { create } from "zustand";

type ThemeMode = "light" | "dark";

type FormaStore = {
  theme: ThemeMode;
  activeSection: string;
  setTheme: (theme: ThemeMode) => void;
  setActiveSection: (section: string) => void;
};

export const useFormaStore = create<FormaStore>((set) => ({
  theme: "light",
  activeSection: "Dashboard",
  setTheme: (theme) => set({ theme }),
  setActiveSection: (activeSection) => set({ activeSection }),
}));
