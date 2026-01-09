// Component to show duplicate flag

import { CustomTooltip } from "@rever/common";
import { Flag } from "lucide-react";

const DuplicateFlag = () => {
  return (
    <CustomTooltip content="Duplicate bill">
      <div>
        <Flag width={16} className="text-red-500" />
      </div>
    </CustomTooltip>
  );
};

export default DuplicateFlag;
