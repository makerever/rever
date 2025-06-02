// Reusable component for checkbox input

import { checkBoxProps } from "@rever/types";

const CheckBox = ({ checked, onChange }: checkBoxProps) => {
  return (
    <input
      type="checkbox"
      checked={checked}
      onChange={onChange}
      className="w-4 h-4 min-w-4 min-h-4"
    />
  );
};

export default CheckBox;
