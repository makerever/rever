// Component to show pill UI design

import { PillItemProps } from "@rever/types";

const PillItem = ({ name, className }: PillItemProps) => {
  return (
    <div
      className={`font-medium flex items-center ms-1.5 px-1 py-0.5 text-[10px] rounded-full ${className}`}
    >
      {name}
    </div>
  );
};

export default PillItem;
