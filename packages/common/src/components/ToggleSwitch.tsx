// Reusable componnet for toggle switch

import { ToggleSwitchProps } from "@rever/types";

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
  isOn,
  setIsOn,
  disabled = false,
}) => {
  const toggleSwitch = () => {
    if (!disabled) {
      setIsOn(!isOn);
    }
  };

  return (
    <label
      className={`inline-flex items-center ${
        !disabled ? "cursor-pointer" : "cursor-not-allowed"
      }`}
    >
      <input
        type="checkbox"
        className="sr-only hidden"
        checked={isOn}
        onChange={toggleSwitch}
        disabled={disabled}
      />
      <div
        className={`w-5 h-2 flex items-center rounded-full transition-colors duration-300 ${
          isOn ? "bg-primary-200" : "bg-slate-200"
        }`}
      >
        <div
          className={`w-3 h-3 rounded-full shadow-md transform transition-transform duration-300 ${
            isOn ? "translate-x-2 bg-primary-500" : "bg-slate-500"
          }`}
        ></div>
      </div>
    </label>
  );
};

export default ToggleSwitch;
