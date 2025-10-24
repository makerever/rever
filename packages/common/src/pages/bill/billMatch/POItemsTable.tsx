// PO items table component for matching view

import { MatchedLineItem, OrgDetails, UnmatchedLineItem } from "@rever/types";
import { memo } from "react";
import { poMatchHeaders } from "@rever/constants";
import { CustomTooltip } from "@rever/common";
import { cn, formatNumber, formatPlainNumber } from "@rever/utils";

const POItemsTable = memo(
  ({
    matchedLineItems,
    orgDetails,
  }: {
    matchedLineItems: (MatchedLineItem | UnmatchedLineItem)[];
    orgDetails: OrgDetails | undefined;
  }) => (
    <div className="w-1/2">
      <h3 className="text-md font-semibold text-slate-700 mb-4">
        Purchase order items
      </h3>
      <table className="table-fixed w-full text-left">
        <colgroup>
          <col className="w-[30px]" />
          <col className="w-[35%]" />
          <col className="w-[20%]" />
          <col className="w-[20%]" />
          <col className="w-[20%]" />
        </colgroup>

        <thead className="bg-gray-50 border-b">
          <tr>
            {poMatchHeaders.map((h, i) => (
              <th
                key={i}
                className={cn(
                  `${i < 2 ? "" : "text-right"}`,
                  "text-xs pr-4 py-3 font-medium text-slate-500 whitespace-nowrap",
                  i === 0 ? "ps-2 w-[30px]" : ""
                )}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {matchedLineItems.length > 0 ? (
            matchedLineItems.map((poItem, index) => {
              const item = poItem?.purchase_order_item;
              const qty = Number(item.quantity) || 0;
              const unitPrice = Number(item.unit_price) || 0;
              const amount = qty * unitPrice;
              const balanceQty =
                Number(item?.quantity) -
                (Number(item?.received_quantity || 0) +
                  Number(item?.pending_approval_quantity || 0));

              // Type guard to check if it's a MatchedLineItem
              const isMatchedItem = (
                item: MatchedLineItem | UnmatchedLineItem
              ): item is MatchedLineItem => {
                return (
                  "description_status" in item ||
                  "quantity_status" in item ||
                  "unit_price_status" in item
                );
              };

              const matchedItem = isMatchedItem(poItem) ? poItem : null;

              return (
                <tr
                  key={index}
                  className="text-xs text-slate-800 hover:bg-slate-50 border-b"
                >
                  <td className="p-2.5">{index + 1}</td>
                  <td className="p-1 ps-0 grid items-center h-[60px] m-1 overflow-auto scrollbar_none">
                    <div className="flex items-center gap-1">
                      {item.description || "-"}
                    </div>
                  </td>
                  <td className="py-1 text-right pr-4">
                    <CustomTooltip
                      className="min-w-40"
                      content={
                        <div className="my-1">
                          <div className="mb-1 flex justify-between gap-2">
                            <div>Total:</div>{" "}
                            <div>{formatPlainNumber(item.quantity)}</div>
                          </div>
                          <div className="mb-1 flex justify-between gap-2">
                            <div>Under approval:</div>{" "}
                            <div>
                              {formatPlainNumber(
                                item.pending_approval_quantity
                              )}
                            </div>
                          </div>
                          <div className="mb-1 flex justify-between gap-2">
                            <div>Consumed:</div>{" "}
                            <div>
                              {formatPlainNumber(item.received_quantity)}
                            </div>
                          </div>
                          <div className="mb-1 flex justify-between gap-2">
                            <div>Available:</div>{" "}
                            <div>{formatPlainNumber(balanceQty)}</div>
                          </div>
                        </div>
                      }
                      side="right"
                    >
                      <span
                        className={`underline cursor-pointer rounded-md w-fit ${matchedItem?.quantity_status ? "" : "border border-transparent"}`}
                      >
                        {formatPlainNumber(balanceQty)}
                      </span>
                    </CustomTooltip>
                  </td>
                  <td className="py-1 text-right pr-4">
                    <span
                      className={`rounded-md w-fit ${matchedItem?.unit_price_status ? "" : ""}`}
                    >
                      {formatNumber(item.unit_price, orgDetails?.currency)}
                    </span>
                  </td>
                  <td className="py-1 text-right pr-4">
                    <span
                      className={`rounded-md w-fit ${matchedItem?.quantity_status && matchedItem?.unit_price_status ? "" : "border border-transparent"}`}
                    >
                      {formatNumber(amount, orgDetails?.currency)}
                    </span>
                  </td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td
                colSpan={5}
                className="p-6 h-[60px] text-center text-slate-400 text-sm"
              >
                No PO items to display.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
);

export default POItemsTable;
