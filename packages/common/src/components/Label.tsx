// Reusable component for a standard label

import { LabelProps } from "@rever/types";

const Label = ({ htmlFor, text, className = "", isRequired }: LabelProps) => {
  return (
    <label
      htmlFor={htmlFor}
      className={`block text-xs font-medium text-slate-500 dark:text-slate-300 mb-1 ${className}`}
    >
      {text} {isRequired ? <span className="text-red-500">*</span> : null}
    </label>
  );
};

export default Label;
