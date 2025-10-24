// Match status icon component to reduce repetition

import { convertToPercentage } from "@rever/utils";
import { CircularProgressBar, CustomTooltip } from "@rever/common";
import { CircleCheck, CircleX, Info } from "lucide-react";
import { memo } from "react";
import { MatchStatus } from "@rever/types";

const StatusIcon = memo(
  ({
    status,
    description_score,
    description_status,
    overall_status,
  }: {
    status: MatchStatus | null;
    tooltipContent: string;
    description_score?: number;
    description_status?: string;
    overall_status?: string | null;
  }) => {
    // Fetching diff icons based on status
    const getIconByStatus = () => {
      switch (status) {
        case "Matched":
          return <CircleCheck className="text-green-600" width={16} />;
        case "Mismatched":
          return <CircleX className="text-red-500" width={16} />;
        case "Partial matched":
          return <Info className="text-yellow-500" width={16} />;
        case "poNotAvailable":
          return <Info className="text-yellow-500" width={16} />;
        default:
          return null;
      }
    };

    return status && status === "none" ? (
      "--"
    ) : status !== "poNotAvailable" ? (
      <CustomTooltip
        content={
          <div className="my-1">
            <div className="mb-0.5">
              Description status: {description_status}
            </div>
            <div className="flex items-center mb-1.5">
              Confidence score:&nbsp;
              <CircularProgressBar
                percentage={Number(convertToPercentage(description_score || 0))}
              />
            </div>

            <div className="mb-1">Overall status: {overall_status}</div>
          </div>
        }
        side="bottom"
      >
        <div className="w-fit">{getIconByStatus()}</div>
      </CustomTooltip>
    ) : (
      <CustomTooltip
        content={<div className="my-1">PO line item missing</div>}
        side="bottom"
      >
        <div>
          <Info className="text-slate-500" width={16} />
        </div>
      </CustomTooltip>
    );
  }
);

export default StatusIcon;
