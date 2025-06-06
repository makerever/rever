// Reusbale side panel component

"use client";

import { SidePanelProps } from "@rever/types";
import { useEffect } from "react";

export default function SidePanel({
  isOpen,
  onClose,
  children,
}: SidePanelProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  return (
    <div
      className={`fixed inset-0 z-50 ${isOpen ? "pointer-events-auto" : "pointer-events-none"}`}
    >
      {/* Overlay */}
      <div
        className={`absolute inset-0 bg-black transition-opacity duration-400 ${isOpen ? "opacity-60" : "opacity-0"}`}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={`absolute rounded-md right-0 top-[80px] overflow-auto h-[calc(100%-50px)] bg-white w-full lg:w-[70vw] md:w-[70vw] sm:w-[70vw] shadow-xl transform transition-transform duration-400 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {children}
      </div>
    </div>
  );
}
