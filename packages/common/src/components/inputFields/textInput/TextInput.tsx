// Reusable component for a standard text input field
"use client";

import { STEP } from "@rever/constants";
import { TextInputProps } from "@rever/types";
import { BadgeInfo, CircleX } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { FieldValues } from "react-hook-form";

// Generic TextInput component for use with react-hook-form
const TextInput = <T extends FieldValues>({
  id,
  placeholder = "",
  className = "",
  value,
  clearIcon,
  clearInput,
  register,
  error,
  onChange,
  stepNo,
  onEnterPress,
  type = "text",
  disabled = false,
  focusOnMount = false,
}: TextInputProps<T>) => {
  // Ref for the input element
  const inputRef = useRef<HTMLInputElement | null>(null);
  // State to track if component is mounted (for SSR/CSR compatibility)
  const [mounted, setMounted] = useState(false);

  // Props for react-hook-form or controlled input
  const inputProps = register
    ? {
        ...register,
        ref: (e: HTMLInputElement) => {
          register.ref(e);
          inputRef.current = e;
        },
      }
    : {
        value,
        onChange,
        ref: inputRef,
      };

  // Set mounted state on mount
  useEffect(() => {
    setMounted(true);
  }, []);

  // Focus input on mount if focusOnMount is true
  useEffect(() => {
    if (mounted && focusOnMount) {
      inputRef.current?.focus();
    }
  }, [mounted, focusOnMount]);

  // Handle Enter key press if onEnterPress callback is provided
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && onEnterPress) {
      onEnterPress();
    }
  };

  return (
    <div className="relative">
      {/* Main input field */}
      <input
        id={id as string}
        type={type}
        disabled={disabled}
        readOnly={stepNo ? stepNo !== STEP.EMAIL : false}
        placeholder={placeholder}
        {...inputProps}
        className={`disabled:bg-gray-100 disabled:hover:border-inherit rounded-md h-8 border px-3 text-sm w-full transition duration-200 hover:border-slate-400 focus:outline-none focus:border-primary-500 text-slate-800 dark:text-zinc-100 dark:bg-zinc-900 ${
          error ? "border-red-500" : "border-gray-200 dark:border-zinc-700"
        } autofill:shadow-[inset_0_0_0px_1000px_white] ${className}`}
        onKeyDown={handleKeyDown}
      />

      {/* Show clear icon if enabled and value exists */}
      {clearIcon && value ? (
        <div
          onClick={clearInput}
          className="absolute right-2 top-1 cursor-pointer text-slate-500"
        >
          <CircleX width={16} />
        </div>
      ) : null}

      {/* Show error message if error exists */}
      {error && (
        <div className="flex items-center gap-1 text-red-500 text-xs mt-1">
          <BadgeInfo width={14} height={14} />
          <span>{error.message}</span>
        </div>
      )}
    </div>
  );
};

export default TextInput;
