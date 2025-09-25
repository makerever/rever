// Reusable component for radio input

import { RadioBtnProps } from "@rever/types";

const RadioBtn = ({ checked, onChange, isDisable }: RadioBtnProps) => {
  return (
    <input
      type="radio"
      checked={checked}
      onChange={onChange}
      className={`
        w-4 h-4 min-w-4 min-h-4
        rounded-full border-2 border-primary-500
        appearance-none
        relative
        checked:border-primary-500
        ${isDisable ? "cursor-not-allowed opacity-50" : "cursor-pointer"}
        checked:after:content-['']
        checked:after:block
        checked:after:w-2 checked:after:h-2
        checked:after:rounded-full
        checked:after:bg-primary-500
        checked:after:absolute
        checked:after:top-1/2 checked:after:left-1/2
        checked:after:-translate-x-1/2 checked:after:-translate-y-1/2
      `}
      disabled={isDisable}
    />
  );
};

export default RadioBtn;
