// Component to show pill UI design

import { PillItemProps } from "@rever/types";
import { CircleCheck, Info, TriangleAlert } from "lucide-react";

const PillItemIcons = {
  info: <Info size={12} />,
  warning: <TriangleAlert size={12} />,
  check: <CircleCheck size={12} />,
};

const PillItem = ({
  name,
  className,
  icon,
  isRounded = false,
  onClick,
}: PillItemProps) => {
  return (
    <div
      className={`pill-badge ${className} ${isRounded ? "rounded-full" : "rounded"} ${name ? "px-2" : "px-1"} ${onClick ? "cursor-pointer" : ""}`}
      onClick={onClick}
    >
      {icon && PillItemIcons[icon]}
      {name && name}
    </div>
  );
};

export default PillItem;
