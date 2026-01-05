// Reusable component for a standard text input field
"use client";

import { STEP } from "@rever/constants";
import { TextInputProps } from "@rever/types";
import { CircleX, Info } from "lucide-react";
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
        className={`input px-3 ${
          error
            ? "input-danger input-shadow-danger"
            : "input-default input-shadow"
        } ${className}`}
        onKeyDown={handleKeyDown}
      />

      {/* Show clear icon if enabled and value exists */}
      {clearIcon && value ? (
        <div
          onClick={clearInput}
          className={`absolute right-2 top-1 cursor-pointer ${disabled ? "text-neutral-500" : "text-neutral-1100"}`}
        >
          <CircleX width={16} />
        </div>
      ) : null}

      {/* Show error message if error exists */}
      {error && (
        <div className="flex items-center gap-1 text-danger-600 text-xs mt-1 font-medium">
          <Info width={14} height={14} />
          <span>{error.message}</span>
        </div>
      )}
    </div>
  );
};

export default TextInput;
