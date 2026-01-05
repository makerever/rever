// Reusable component for a number input field

"use client";

import { useEffect, useRef, useState } from "react";
import { FieldValues } from "react-hook-form";
import { BadgeInfo, CircleX } from "lucide-react";
import { TextInputProps } from "@rever/types";

export interface NumberInputProps<T extends FieldValues>
  extends Omit<TextInputProps<T>, "type"> {
  allowDecimal?: boolean;
}

const NumberInput = <T extends FieldValues>({
  id,
  placeholder = "",
  className = "",
  value,
  clearIcon,
  clearInput,
  register,
  error,
  onChange,
  onEnterPress,
  disabled = false,
  focusOnMount = false,
  allowDecimal = false,
  noErrorIcon,
}: NumberInputProps<T>) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [mounted, setMounted] = useState(false);

  // Focus on mount if requested
  useEffect(() => {
    setMounted(true);
  }, []);
  useEffect(() => {
    if (mounted && focusOnMount) {
      inputRef.current?.focus();
    }
  }, [mounted, focusOnMount]);

  // Keydown: only digits and optionally one decimal
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const controls = [
      "Backspace",
      "Tab",
      "Enter",
      "Escape",
      "ArrowLeft",
      "ArrowRight",
      "Delete",
    ];

    if (e.ctrlKey || e.metaKey) {
      return;
    }

    if (e.key === "Enter") {
      onEnterPress?.();
      return;
    }
    const isDigit = /^[0-9]$/.test(e.key);
    const isDot = e.key === ".";
    const hasDot = inputRef.current?.value.includes(".");
    if (
      !controls.includes(e.key) &&
      !isDigit &&
      !(allowDecimal && isDot && !hasDot)
    ) {
      e.preventDefault();
    }
  };

  // Paste: restrict to digits and at most one dot
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    // let the paste happen first, then sanitize
    setTimeout(() => {
      if (!inputRef.current) return;

      let val = inputRef.current.value;

      if (allowDecimal) {
        val = val.replace(/[^0-9.]/g, "");
        const parts = val.split(".");
        if (parts.length > 2) {
          val = parts[0] + "." + parts.slice(1).join("");
        }
        if (parts[1] && parts[1].length > 2) {
          val = parts[0] + "." + parts[1].slice(0, 2);
        }
      } else {
        val = val.replace(/[^0-9]/g, "");
      }

      inputRef.current.value = val;
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        "value",
      )?.set;
      nativeInputValueSetter?.call(inputRef.current, val);

      const event = new Event("input", { bubbles: true });
      inputRef.current.dispatchEvent(event);
    }, 0);
  };

  // Change: strip non-allowed chars and collapse extra dots
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    if (allowDecimal) {
      val = val.replace(/[^0-9.]/g, "");
      const parts = val.split(".");
      if (parts.length > 2) {
        val = parts[0] + "." + parts.slice(1).join("");
      }
      if (parts[1] && parts[1].length > 2) {
        val = parts[0] + "." + parts[1].slice(0, 2);
      }
    } else {
      val = val.replace(/[^0-9]/g, "");
    }
    e.target.value = val;
    if (register) {
      register.onChange(e);
    } else {
      onChange?.(e);
    }
  };

  // Assemble input props
  const inputProps = register
    ? {
        ...register,
        onChange: handleChange,
        onKeyDown: handleKeyDown,
        onPaste: handlePaste,
        ref: (e: HTMLInputElement) => {
          register.ref(e);
          inputRef.current = e;
        },
      }
    : {
        value,
        onChange: handleChange,
        onKeyDown: handleKeyDown,
        onPaste: handlePaste,
        ref: inputRef,
      };

  return (
    <div className="relative">
      <input
        id={id as string}
        type="text"
        disabled={disabled}
        placeholder={placeholder}
        className={`input px-3 ${
          error || noErrorIcon
            ? "input-danger input-shadow-danger"
            : "input-default input-shadow"
        } ${className}`}
        {...inputProps}
      />

      {clearIcon && value ? (
        <div
          onClick={clearInput}
          className={`absolute right-2 top-1 cursor-pointer ${disabled ? "text-neutral-500" : "text-neutral-1100"}`}
        >
          <CircleX width={16} />
        </div>
      ) : null}

      {!noErrorIcon && error && (
        <div className="flex items-center gap-1 text-danger-600 text-xs mt-1">
          <BadgeInfo width={14} height={14} />
          <span>{error.message}</span>
        </div>
      )}
    </div>
  );
};

export default NumberInput;
