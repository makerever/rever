// Store to manage sidebar collapse

import { SidebarStateProps } from "@rever/types";
import { create } from "zustand";
import { persist } from "zustand/middleware";

// Create a Zustand store for sidebar state, with persistence
export const useSidebarStore = create(
  persist<SidebarStateProps>(
    (set) => ({
      isCollapsed: false, // Initial state: sidebar is not collapsed
      toggleCollapse: () =>
        set((state) => ({ isCollapsed: !state.isCollapsed })), // Toggle the collapsed state
      setCollapse: (value) => set({ isCollapsed: value }), // Set collapsed state directly
    }),
    {
      name: "sidebar-collapse", // Key name for persisted state in storage
    },
  ),
);
