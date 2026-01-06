// Reusable component to show password strength

"use client";
import { CircleCheck, CircleX } from "lucide-react";

const getStrength = (password: string) => {
  // Always return the same shape so callers can safely access properties
  if (!password) {
    return {
      lengthValid: false,
      hasLowercase: false,
      hasUppercase: false,
      hasNumber: false,
      hasSpecialChar: false,
    };
  }

  const lengthValid = password.length >= 7;
  const hasLowercase = /[a-z]/.test(password);
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecialChar = /[^A-Za-z0-9]/.test(password);

  const passedChecks = {
    lengthValid: lengthValid,
    hasLowercase: hasLowercase,
    hasUppercase: hasUppercase,
    hasNumber: hasNumber,
    hasSpecialChar: hasSpecialChar,
  };

  return passedChecks;
};

const PasswordStrength = ({ password }: { password: string }) => {
  const conditions = getStrength(password);

  if (!password) return null;

  return (
    <div className="mt-2 flex flex-col gap-1">
      <div className="flex items-start justify-start gap-0.5 flex-col mt-0.5">
        <p className="text-xs flex items-center justify-start gap-1">
          <CircleCheck
            size={16}
            className={`${conditions?.lengthValid ? "block" : "hidden"} text-success-600`}
          />
          <CircleX
            size={16}
            className={`${conditions?.lengthValid ? "hidden" : "block"} text-danger-600`}
          />
          <span
            className={`${conditions?.lengthValid ? "text-success-600" : "text-danger-600"}`}
          >
            Minimum of 8 characters (recommended: 12+)
          </span>
        </p>
        <p className="text-xs flex items-center justify-start gap-1">
          <CircleCheck
            size={16}
            className={`${conditions?.hasUppercase && conditions?.hasLowercase ? "block" : "hidden"} text-success-600`}
          />
          <CircleX
            size={16}
            className={`${conditions?.hasUppercase && conditions?.hasLowercase ? "hidden" : "block"} text-danger-600`}
          />
          <span
            className={`${conditions?.hasUppercase && conditions?.hasLowercase ? "text-success-600" : "text-danger-600"}`}
          >
            Include uppercase and lowercase letters
          </span>
        </p>
        <p className="text-xs flex items-center justify-start gap-1">
          <CircleCheck
            size={16}
            className={`${conditions?.hasNumber ? "block" : "hidden"} text-success-600`}
          />
          <CircleX
            size={16}
            className={`${conditions?.hasNumber ? "hidden" : "block"} text-danger-600`}
          />
          <span
            className={`${conditions?.hasNumber ? "text-success-600" : "text-danger-600"}`}
          >
            Include at least one number (0-9)
          </span>
        </p>
        <p className="text-xs flex items-center justify-start gap-1">
          <CircleCheck
            size={16}
            className={`${conditions?.hasSpecialChar ? "block" : "hidden"} text-success-600`}
          />
          <CircleX
            size={16}
            className={`${conditions?.hasSpecialChar ? "hidden" : "block"} text-danger-600`}
          />
          <span
            className={`${conditions?.hasSpecialChar ? "text-success-600" : "text-danger-600"}`}
          >
            Include at least one special character (e.g., ! @ # $ % ^ & *)
          </span>
        </p>
      </div>
    </div>
  );
};

export default PasswordStrength;
