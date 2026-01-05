// Reusable component for checkbox input

import { checkBoxProps, CheckBoxVisualState } from "@rever/types";
import React from "react";

const CheckBox: React.FC<checkBoxProps> = ({
  checked,
  onChange,
  isDisable = false,
  variant = "primary",
  visualState, // if not passed, derive from checked
}) => {
  // derive visual state from checked if not provided
  const state: CheckBoxVisualState =
    visualState ?? (checked ? "checked" : "unchecked");

  const stateClass =
    state === "checked"
      ? "checked"
      : state === "indeterminate"
        ? "indeterminate"
        : "";

  return (
    <input
      type="checkbox"
      checked={checked}
      onChange={onChange}
      disabled={isDisable}
      className={`checkbox ${variant} ${stateClass}`}
    />
  );
};

export default CheckBox;
