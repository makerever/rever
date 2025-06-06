// Full screen loader to show when user refresh page

"use client";

import { LoaderContextType } from "@rever/types";
import { createContext, useContext, useEffect, useState } from "react";

const LoaderContext = createContext<LoaderContextType>({
  show: false,
  setShow: () => {},
});

export const useLoader = () => useContext(LoaderContext);

export function HydrationLoader({ children }: { children: React.ReactNode }) {
  const [show, setShow] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // Reset loader on hydration
  useEffect(() => {
    const timeout = setTimeout(() => {
      setHydrated(true);
      setShow(false);
    }, 300);

    return () => clearTimeout(timeout);
  }, []);

  const shouldShowLoader = !hydrated || show;

  return (
    <LoaderContext.Provider value={{ show, setShow }}>
      {shouldShowLoader && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/90 backdrop-blur-sm">
          <div className="w-12 h-12 border-4 border-gray-300 border-t-primary-500 rounded-full animate-spin" />
        </div>
      )}
      {children}
    </LoaderContext.Provider>
  );
}
