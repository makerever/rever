// Reusable component for a standard label

import { LabelProps } from "@rever/types";

const Label = ({ htmlFor, text, className = "", isRequired }: LabelProps) => {
  return (
    <label
      htmlFor={htmlFor}
      className={`block text-sm ${className ? className : "mb-1.5 font-semibold text-neutral-1100"}`}
    >
      {text} {isRequired ? <span className="text-red-500">*</span> : null}
    </label>
  );
};

export default Label;
