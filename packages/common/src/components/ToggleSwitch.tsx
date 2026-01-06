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
        checked={!!isOn}
        onChange={toggleSwitch}
        disabled={disabled}
      />
      <div
        className={`switch ${isOn ? `${disabled ? "bg-primary-100 hover:bg-primary-100" : "active:bg-primary-700 bg-primary-600 hover:bg-primary-800"}` : `${disabled ? "bg-secondary-100 hover:bg-secondary-100" : "active:bg-secondary-300 bg-neutral-200 hover:bg-secondary-400"}`}`}
      >
        <div
          className={`switch-inner-circle switch-circle-shadow ${
            isOn ? "translate-x-3 bg-white" : "bg-white"
          }`}
        ></div>
      </div>
    </label>
  );
};

export default ToggleSwitch;
