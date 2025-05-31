// Store to manage theme mode

import { ThemeStoreProps } from "@rever/types";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useThemeStore = create<ThemeStoreProps>()(
  persist(
    (set, get) => ({
      theme: "light", // Initial theme mode is set to 'light'
      setTheme: (mode) => set({ theme: mode }), // Function to set the theme mode directly
      toggleTheme: () =>
        set({ theme: get().theme === "light" ? "dark" : "light" }), // Toggle between 'light' and 'dark' modes
    }),
    {
      name: "theme-storage", // Key name for persisted theme state in storage
    },
  ),
);
