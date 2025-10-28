// Match status table component for matching view

import { MatchedLineItem, OrgDataProps } from "@rever/types";
import { memo } from "react";
import StatusIcon from "./MatchStatusIcon";

const MatchingStatusTable = memo(
  ({
    matchedLineItems,
    orgDetails,
  }: {
    matchedLineItems: MatchedLineItem[];
    orgDetails?: OrgDataProps;
  }) => (
    <div>
      <table className="table-fixed w-full text-left">
        <colgroup>
          <col className="w-full" />
        </colgroup>

        <thead className="bg-gray-50 border-b">
          <tr>
            <th className="ps-4 pr-2 py-3 text-xs font-medium text-slate-500 whitespace-nowrap">
              Match status
            </th>
          </tr>
        </thead>

        <tbody>
          {matchedLineItems.length > 0 ? (
            matchedLineItems.map((item, index) => {
              function getOverallStatus() {
                const isConfirmedQtyMismatched =
                  item?.bill_item?.confirmed_quantity &&
                  item?.bill_item?.quantity !==
                    item?.bill_item?.confirmed_quantity;

                if (
                  orgDetails?.receipt_confirmation_enabled &&
                  isConfirmedQtyMismatched
                ) {
                  return "Mismatched";
                } else if (item?.overall_status === "matched") {
                  return "Matched";
                } else if (item?.overall_status === "mismatched") {
                  return "Mismatched";
                } else if (item?.overall_status === "partial") {
                  return "Partial matched";
                } else {
                  return null;
                }
              }

              return (
                <tr
                  key={index}
                  className="text-xs text-slate-800 hover:bg-slate-50 border-b"
                >
                  <td className="p-3 ps-4 grid items-center h-[60px] m-1">
                    <StatusIcon
                      status={
                        item?.overall_status
                          ? getOverallStatus()
                          : item?.purchase_order_item?.description
                            ? "none"
                            : "poNotAvailable"
                      }
                      tooltipContent={
                        item?.overall_status === "matched"
                          ? "Matched"
                          : item?.overall_status === "mismatched"
                            ? "Mismatched"
                            : item?.overall_status === "partial"
                              ? "Partial matched"
                              : ""
                      }
                      description_score={item.description_score}
                      description_status={
                        item?.description_status === "matched"
                          ? "Matched"
                          : item?.description_status === "mismatched"
                            ? "Mismatched"
                            : item?.description_status === "partial"
                              ? "Partial matched"
                              : ""
                      }
                      overall_status={getOverallStatus()}
                    />
                  </td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td
                colSpan={4}
                className="p-6 h-[60px] text-center text-slate-400 text-sm"
              >
                --
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  ),
);

export default MatchingStatusTable;
