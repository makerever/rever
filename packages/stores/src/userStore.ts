// Store to add logged in user details

import { UserStoreProps } from "@rever/types";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useUserStore = create<UserStoreProps>()(
  persist(
    (set) => ({
      user: null, // Initial user state is null (no user logged in)
      setUser: (user) => set({ user }), // Function to set the user state
      logout: () => set({ user: null }), // Function to clear the user state (logout)
    }),
    {
      name: "user-storage", // Key in localStorage for persisted user state
    },
  ),
);
