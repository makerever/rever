// Reusable component for radio input

import { RadioBtnProps, RadioBtnVisualState } from "@rever/types";

const RadioBtn = ({
  checked,
  onChange,
  isDisable,
  variant = "primary",
  visualState,
}: RadioBtnProps) => {
  const state: RadioBtnVisualState =
    visualState ?? (checked ? "checked" : "unchecked");

  const stateClass = state === "checked" ? "checked" : "";

  return (
    <input
      type="radio"
      checked={checked}
      onChange={onChange}
      disabled={isDisable}
      className={`radio ${variant} ${stateClass}`}
    />
  );
};

export default RadioBtn;
