// Component for bill line items UI ReadOnly
"use client";

import { formatNumber } from "@rever/utils";
import { useUserStore } from "@rever/stores";
import { POLineItemsProps } from "@rever/types";
import { CustomTooltip } from "@rever/common";

// Table headers for the read-only bill items table
const billItemHeaders = [
  "#",
  "Description",
  "Quantity",
  "Available quantity",
  "Unit price",
  "Amount",
];

export default function poLineItemsReadOnly({
  poItems = [],
  poDetails,
}: POLineItemsProps) {
  const orgDetails = useUserStore((state) => state.user?.organization);

  return (
    <div className="space-y-4">
      {/* Bill items table (read-only) */}
      <table className="table-fixed w-full text-left">
        {/* Set column widths */}
        <colgroup>
          <col className="w-10" />
          <col className="w-4/12" />
          <col className="w-2/12" />
          <col className="w-1/5" />
          <col className="w-2/12" />
          <col className="w-2/12" />
        </colgroup>

        <thead className="bg-gray-50">
          <tr>
            {/* Render table headers */}
            {billItemHeaders.map((h, i) => (
              <th
                key={i}
                className="px-2 py-4 text-xs text-slate-500 font-medium"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {/* Render each bill item row, or a message if empty */}
          {poItems.length > 0 ? (
            poItems.map((item, index) => {
              const qty = Number(item.quantity) || 0;
              const unitPrice = Number(item.unit_price) || 0;
              const amount = qty * unitPrice;
              const balanceQty =
                Number(item?.quantity) -
                (Number(item?.received_quantity || 0) +
                  Number(item?.pending_approval_quantity || 0));

              return (
                <tr
                  key={index}
                  className="border-t text-slate-800 text-xs transition duration-300 hover:bg-slate-50"
                >
                  {/* Row number */}
                  <td className="p-2.5">{index + 1}</td>
                  {/* Description */}
                  <td className="p-2 whitespace-pre-wrap">
                    {item.description || "-"}
                  </td>
                  {/* Quantity */}
                  <td className="p-2">{item.quantity}</td>
                  {/* Available quantity */}
                  <td className="p-2">
                    <CustomTooltip
                      className="min-w-40"
                      content={
                        <div className="my-1">
                          <div className="mb-1 flex justify-between">
                            <div>Total Qty:</div> <div>{item?.quantity}</div>
                          </div>
                          <div className="mb-1 flex justify-between">
                            <div>Committed Qty:</div>{" "}
                            <div>{item?.pending_approval_quantity}</div>
                          </div>
                          <div className="mb-1 flex justify-between">
                            <div>Consumed Qty:</div>{" "}
                            <div>{item?.received_quantity}</div>
                          </div>
                          <div className="mb-1 flex justify-between">
                            <div>Available Qty:</div>{" "}
                            <div>{balanceQty?.toFixed(2)}</div>
                          </div>
                        </div>
                      }
                      side="right"
                    >
                      <div
                        className={`underline cursor-pointer rounded-md w-fit`}
                      >
                        {balanceQty?.toFixed(2)}
                      </div>
                    </CustomTooltip>
                  </td>
                  {/* Unit price */}
                  <td className="p-2">
                    {formatNumber(item.unit_price || 0, orgDetails?.currency)}
                  </td>
                  {/* Amount (computed) */}
                  <td className="p-2">
                    {formatNumber(amount, orgDetails?.currency)}
                  </td>
                </tr>
              );
            })
          ) : (
            // Show message if there are no line items
            <tr>
              <td
                colSpan={6}
                className="p-4 text-center text-sm text-slate-400"
              >
                No line items to display.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Bill summary section (sub total, tax, total) */}
      <div className="flex justify-end">
        <div className="p-3 w-72 font-medium text-slate-600 text-sm bg-gray-50 rounded-md">
          <div className="grid grid-cols-2">
            <p>Sub total:</p>
            <p>
              {formatNumber(poDetails?.sub_total || 0, orgDetails?.currency)}
            </p>
          </div>
          <div className="grid items-center grid-cols-2 pb-2 mt-4 mb-3 border-b">
            <div>
              <p>Total tax:</p>
              <span className="text-xs">
                {formatNumber(poDetails?.total_tax || 0, orgDetails?.currency)}
              </span>
            </div>
            <div>{poDetails?.tax_percentage || 0}%</div>
          </div>
          <div className="grid grid-cols-2 text-slate-800 font-semibold">
            <p>Total:</p>
            <p>{formatNumber(poDetails?.total || 0, orgDetails?.currency)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
