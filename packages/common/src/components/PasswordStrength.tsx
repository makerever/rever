// Reusable component to show password strength

"use client";

const getStrength = (password: string) => {
  if (!password) return { label: "", level: 0 };

  const lengthValid = password.length >= 7;
  const hasLowercase = /[a-z]/.test(password);
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecialChar = /[^A-Za-z0-9]/.test(password);

  const passedChecks = [
    hasLowercase,
    hasUppercase,
    hasNumber,
    hasSpecialChar,
  ].filter(Boolean).length;

  if (password.length >= 8 && passedChecks === 4) {
    return { label: "Password is strong", level: 3 };
  }

  if (lengthValid && passedChecks >= 3) {
    return { label: "Password is good", level: 2 };
  }

  return { label: "Password is weak", level: 1 };
};

const PasswordStrength = ({ password }: { password: string }) => {
  const { label, level } = getStrength(password);

  if (!password) return null;

  return (
    <div className="mt-2 flex flex-col gap-1">
      <div className="flex w-full gap-1">
        <div
          className={`h-1 flex-1 rounded-full transition-all ${level >= 1 ? "bg-red-500" : "bg-gray-200"}`}
        />
        <div
          className={`h-1 flex-1 rounded-full transition-all ${level >= 2 ? "bg-yellow-500" : "bg-gray-200"}`}
        />
        <div
          className={`h-1 flex-1 rounded-full transition-all ${level === 3 ? "bg-green-500" : "bg-gray-200"}`}
        />
      </div>
      <span className="text-2xs text-slate-600">{label}</span>
    </div>
  );
};

export default PasswordStrength;
