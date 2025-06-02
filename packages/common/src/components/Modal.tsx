"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { ModalProps } from "@rever/types";

// Modal component to display a Modal
export default function Modal({
  isOpen,
  onClose,
  children,
  title,
}: ModalProps) {
  // Add Escape key handler to close modal when open
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      {/* BACKDROP CLICK TO CLOSE */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* MODAL CARD */}
      <div
        className={`${title ? "p-5" : ""} relative z-10 w-[90vw] sm:w-full max-w-xl rounded-2xl bg-white shadow-lg transform transition-all duration-300 scale-100 opacity-100 animate-fadeIn`}
        onClick={(e) => e.stopPropagation()}
      >
        {title ? (
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-sm text-slate-800 font-semibold">
              {title ? title : ""}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        ) : null}
        <div>{children}</div>
      </div>

      <style jsx>{`
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
}
