// UI for request confirmation history

"use client";

import { useUserStore } from "@rever/stores";
import { RequestedConfirationProps } from "@rever/types";
import {
  formatDate,
  getFirstLetter,
  getLabelForBillStatus,
  getStatusClass,
} from "@rever/utils";

const VersionHistory = ({
  confirmationHistoryList,
}: RequestedConfirationProps) => {
  const orgDetails = useUserStore((state) => state.user?.organization);
  return (
    <div className="ps-6 pr-1 mr-6 h-[calc(100vh-120px)] overflow-auto custom_scrollbar">
      {confirmationHistoryList?.map((v, i) => {
        return (
          <div
            key={i}
            className={`border rounded p-2 mb-4 ${v?.status === "revoked" ? "opacity-60" : ""}`}
          >
            <div className="text-xs flex items-center">
              <p className="text-slate-800 font-semibold">
                {formatDate(
                  v?.assigned_at,
                  orgDetails?.date_format,
                  "",
                  false,
                  true,
                )}
              </p>
            </div>

            <div className="flex items-baseline gap-2 mt-2">
              <div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-2xs text-slate-800">
                {getFirstLetter(v?.assignee_name)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-xs text-slate-800">{v?.assignee_name}</p>
                  <span
                    className={`text-2xs border px-2 rounded-md ${getStatusClass(
                      v?.status || "",
                    )}`}
                  >
                    {getLabelForBillStatus(v?.status || "")}
                  </span>
                </div>
                <p className="text-2xs text-slate-600 mt-1">
                  {v?.assignee_email}
                </p>
              </div>
            </div>
          </div>
        );
      })}

      {!confirmationHistoryList?.length && (
        <p className="text-slate-600 text-sm mt-10 text-center">
          No confirmation history found
        </p>
      )}
    </div>
  );
};

export default VersionHistory;
