// Component for Icon wrapper

import { IconWrapperProps } from "@rever/types";

const IconWrapper = ({
  icon,
  onClick,
  className,
  isDisabled,
}: IconWrapperProps) => {
  return (
    <div
      onClick={!isDisabled ? onClick : () => {}}
      className={`flex ${!isDisabled ? "cursor-pointer text-slate-800" : "cursor-not-allowed text-slate-500"} items-center justify-center w-7 h-7 rounded-md duration-300 transition ${
        className ? className : `${!isDisabled ? "hover:bg-slate-100" : ""}`
      }`}
    >
      {icon}
    </div>
  );
};

export default IconWrapper;
