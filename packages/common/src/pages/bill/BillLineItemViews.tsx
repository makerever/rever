// Component for bill line items UI ReadOnly
"use client";

import { formatNumber } from "@rever/utils";
import { useUserStore } from "@rever/stores";
import { BillLineItemsProps } from "@rever/types";

// Table headers for the read-only bill items table
const billItemHeaders = [
  "#",
  "Description",
  "Product code",
  "Quantity",
  "Unit price",
  "Amount",
];

export default function BillLineItemsReadOnly({
  billItems = [],
  billDetails,
}: BillLineItemsProps) {
  const orgDetails = useUserStore((state) => state.user?.organization);

  return (
    <div className="space-y-4">
      {/* Bill items table (read-only) */}
      <table className="table-fixed w-full text-left">
        {/* Set column widths */}
        <colgroup>
          <col className="w-10" />
          <col className="w-5/12" />
          <col className="w-2/12" />
          <col className="w-2/12" />
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
          {billItems.length > 0 ? (
            billItems.map((item, index) => {
              const qty = Number(item.quantity) || 0;
              const unitPrice = Number(item.unit_price) || 0;
              const amount = qty * unitPrice;

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
                  {/* Product code */}
                  <td className="p-2">{item.product_code || "-"}</td>
                  {/* Quantity */}
                  <td className="p-2">{item.quantity}</td>
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
              {formatNumber(billDetails?.sub_total || 0, orgDetails?.currency)}
            </p>
          </div>
          <div className="grid items-center grid-cols-2 pb-2 mt-4 mb-3 border-b">
            <div>
              <p>Total tax:</p>
              <span className="text-xs">
                {formatNumber(
                  billDetails?.total_tax || 0,
                  orgDetails?.currency,
                )}
              </span>
            </div>
            <div>{billDetails?.tax_percentage || 0}%</div>
          </div>
          <div className="grid grid-cols-2 text-slate-800 font-semibold">
            <p>Total:</p>
            <p>{formatNumber(billDetails?.total || 0, orgDetails?.currency)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
