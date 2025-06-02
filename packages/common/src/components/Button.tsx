// Reusable component for a standard button

import { ButtonProps } from "@rever/types";
import { Loader } from "lucide-react";

const Button = ({
  text,
  onClick,
  className = "",
  icon,
  type = "button",
  disabled = false,
  isLoading = false,
  width,
  isDefault = true,
}: ButtonProps) => {
  return (
    <button
      type={type ?? "button"}
      onClick={onClick}
      disabled={disabled}
      className={`${icon ? "py-1" : "py-2.5"} ${
        width ? width : "w-full"
      } h-8 px-3 flex items-center justify-center gap-1 disabled:cursor-not-allowed rounded-md text-xs font-medium ${isDefault ? "bg-primary-500 hover:bg-primary-600 disabled:hover:bg-primary-500 duration-300" : ""} ${className}`}
    >
      {isLoading ? (
        <Loader width={16} height={16} className="animate-spin text-white" />
      ) : (
        <>
          {" "}
          {icon && <div className="text-base">{icon}</div>}
          {text}
        </>
      )}
    </button>
  );
};

export default Button;
