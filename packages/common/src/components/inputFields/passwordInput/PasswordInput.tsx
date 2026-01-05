// Reusable component for a standard password input field

"use client";

import { PasswordInputProps } from "@rever/types";
import { Eye, EyeOff, Info } from "lucide-react";
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
        className={`input px-3 ${
          error && !showPasswordStrength
            ? "input-danger input-shadow-danger"
            : "input-default input-shadow"
        } ${className}`}
        onKeyDown={handleKeyDown}
      />

      {/* Toggle password visibility icon */}
      <div
        onClick={() => setInputTypePassword(!inputTypePassword)}
        className={`absolute right-2 top-1 cursor-pointer text-neutral-1100`}
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
              <Info width={14} height={14} />
              <span>{error.message}</span>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default PasswordInput;
