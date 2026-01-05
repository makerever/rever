// Reusable component for a standard text input field

"use client";

import { STEP } from "@rever/constants";
import { TextAreaInputProps } from "@rever/types";
import { BadgeInfo, CircleX } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { FieldValues } from "react-hook-form";

// Generic TextAreaInput component for use with react-hook-form or controlled input
const TextAreaInput = <T extends FieldValues>({
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
  disabled = false,
  focusOnMount = false,
  rows = 2,
  noErrorIcon,
}: TextAreaInputProps<T>) => {
  // Ref for the textarea element
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  // State to track if component is mounted (for SSR/CSR compatibility)
  const [mounted, setMounted] = useState(false);

  // Props for react-hook-form or controlled input
  const inputProps = register
    ? {
        ...register,
        ref: (e: HTMLTextAreaElement) => {
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

  // Focus textarea on mount if focusOnMount is true
  useEffect(() => {
    if (mounted && focusOnMount) {
      inputRef.current?.focus();
    }
  }, [mounted, focusOnMount]);

  // Handle Enter key press if onEnterPress callback is provided
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && onEnterPress) {
      onEnterPress();
    }
  };

  return (
    <div className="relative">
      {/* Main textarea input */}
      <textarea
        id={id as string}
        rows={rows}
        disabled={disabled}
        readOnly={stepNo ? stepNo !== STEP.EMAIL : false}
        placeholder={placeholder}
        {...inputProps}
        className={`textarea px-3 ${
          error || noErrorIcon
            ? "input-danger input-shadow-danger"
            : "input-default input-shadow"
        } ${className}`}
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

      {/* Show error message if error exists and error icon is not suppressed */}
      {!noErrorIcon && error && (
        <div className="flex items-center gap-1 text-danger-500 text-xs mt-1">
          <BadgeInfo width={14} height={14} />
          <span>{error.message}</span>
        </div>
      )}
    </div>
  );
};

export default TextAreaInput;
