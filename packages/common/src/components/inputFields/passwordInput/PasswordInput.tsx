// Reusable component for a standard password input field

"use client";

import { PasswordInputProps } from "@rever/types";
import { BadgeInfo, Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { FieldValues } from "react-hook-form";
import PasswordStrength from "../../PasswordStrength";

const PasswordInput = <T extends FieldValues>({
  id,
  placeholder = "",
  className = "",
  value,
  register,
  error,
  onChange,
  onEnterPress,
  showPasswordStrength,
  password,
}: PasswordInputProps<T>) => {
  const inputProps = register ? { ...register } : { value, onChange };
  const [inputTypePassword, setInputTypePassword] = useState(true);

  // Handle Enter key press event
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && onEnterPress) {
      onEnterPress();
    }
  };

  return (
    <div className="relative">
      {/* Password input field */}
      <input
        id={id as string}
        type={inputTypePassword ? "password" : "text"}
        placeholder={placeholder}
        {...inputProps}
        className={`rounded-md h-8 border px-3 text-sm w-full transition duration-200 hover:border-slate-400 focus:outline-none focus:border-primary-500 text-slate-800 dark:text-zinc-100 dark:bg-zinc-900 ${
          error && !showPasswordStrength
            ? "border-red-500"
            : "border-gray-200 dark:border-zinc-700"
        } autofill:shadow-[inset_0_0_0px_1000px_white] ${className}`}
        onKeyDown={handleKeyDown}
      />

      {/* Toggle password visibility icon */}
      <div
        onClick={() => setInputTypePassword(!inputTypePassword)}
        className="absolute right-2 top-1 cursor-pointer text-slate-500"
      >
        {inputTypePassword ? <Eye width={16} /> : <EyeOff width={16} />}
      </div>

      {/* Show password strength or error message */}
      {showPasswordStrength ? (
        <PasswordStrength password={password || ""} />
      ) : (
        <>
          {error && (
            <div className="flex items-center gap-1 text-red-500 text-xs mt-1">
              <BadgeInfo width={14} height={14} />
              <span>{error.message}</span>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default PasswordInput;
