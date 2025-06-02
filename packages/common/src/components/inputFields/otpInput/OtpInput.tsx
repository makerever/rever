// Reusable component for a standard otp input field

"use client";

import { OtpInputProps } from "@rever/types";
import { useEffect, useRef, useState } from "react";
import { FieldValues } from "react-hook-form";

export default function OtpInput<T extends FieldValues>({
  name,
  length = 6,
  register,
  setValue,
  trigger,
  handleContinue,
}: OtpInputProps<T>) {
  const [otp, setOtp] = useState<string[]>(Array(length).fill(""));
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  // Register the input with react-hook-form on mount
  useEffect(() => {
    register(name);
  }, [register, name]);

  // Focus a specific input by index
  const focusInput = (index: number) => {
    const input = inputsRef.current[index];
    if (input) input.focus();
  };

  // Handle input change for each OTP digit
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    index: number,
  ) => {
    const value = e.target.value;
    // Only allow single digit numbers
    if (!/^\d$/.test(value)) return;

    const updated = [...otp];
    updated[index] = value;
    setOtp(updated);
    setValue(name, updated.join("") as T[typeof name]);

    trigger(name);

    // Move focus to next input if not last
    if (index < length - 1) focusInput(index + 1);
  };

  // Handle backspace and enter key events
  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number,
  ) => {
    if (e.key === "Backspace") {
      e.preventDefault();
      const updated = [...otp];

      if (otp[index]) {
        // Clear current digit if not empty
        updated[index] = "";
        setOtp(updated);
        setValue(name, updated.join("") as T[typeof name]);

        trigger(name);
      } else if (index > 0) {
        // Move focus to previous input and clear it
        focusInput(index - 1);
        updated[index - 1] = "";
        setOtp(updated);
        setValue(name, updated.join("") as T[typeof name]);
        trigger(name);
      }
    }

    // Call handleContinue if Enter is pressed and all digits are filled
    if (
      e.key === "Enter" &&
      handleContinue &&
      otp.every((digit) => digit !== "")
    ) {
      handleContinue();
    }
  };

  // Handle pasting OTP (e.g., from SMS)
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    // Extract only digits, limit to OTP length
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, length);
    if (!pasted) return;

    const updated = [...otp];
    for (let i = 0; i < pasted.length; i++) {
      updated[i] = pasted[i];
    }

    setOtp(updated);
    setValue(name, updated.join("") as T[typeof name]);
    trigger(name);

    // Focus the last filled input
    const nextIndex = Math.min(pasted.length, length - 1);
    focusInput(nextIndex);
  };

  return (
    <div className="flex gap-2">
      {/* Render OTP input fields */}
      {otp.map((digit, i) => (
        <input
          key={i}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          onChange={(e) => handleChange(e, i)}
          onKeyDown={(e) => handleKeyDown(e, i)}
          onPaste={handlePaste}
          ref={(el) => {
            inputsRef.current[i] = el;
          }}
          className="w-8 h-8 rounded-md border text-sm transition duration-200 hover:border-slate-400 focus:outline-none focus:border-primary-500 text-slate-800 dark:text-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 text-center outline-none focus:scale-110"
        />
      ))}
    </div>
  );
}
