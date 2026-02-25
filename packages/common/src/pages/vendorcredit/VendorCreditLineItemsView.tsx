// Component for vendor credit line items UI ReadOnly

"use client";

import {
  formatNumber,
  formatPlainNumber,
  getAuditFieldValue,
  getLineItemAuditClass,
} from "@rever/utils";
import { useUserStore } from "@rever/stores";
import { VendorCreditLineItemsDetailsProps } from "@rever/types";

// Table headers for the read-only vendor credit items table
const vendorCreditItemHeaders = [
  "Description",
  "Qty",
  "Unit price",
  "Amount",
];

export default function VendorCreditLineItemsReadOnly({
  vendorCreditItems = [],
  showAuditHistory,
  itemsAuditValidation,
}: VendorCreditLineItemsDetailsProps) {
  const orgDetails = useUserStore((state) => state.user?.organization);
  return (
    <div className="rounded-xl border bg-white overflow-hidden">
      {/* vendor credit items table (read-only) */}
      <table className="table-fixed w-full text-left">
        {/* Set column widths */}
        <colgroup>
          <col className="w-[20%]" />
          <col className="w-[15%]" />
          <col className="w-[15%]" />
          <col className="w-[15%]" />
        </colgroup>

        <thead className="bg-secondary-100">
          <tr>
            {/* Render table headers */}
            {vendorCreditItemHeaders.map((h, i) => (
              <th
                key={i}
                className={`px-3 py-2 text-sm text-neutral-1100 font-semibold ${i < 1 ? "" : "text-right"}`}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {/* Render each vendor credit item row, or a message if empty */}
          {vendorCreditItems.length > 0 ? (
            vendorCreditItems.map((item, index) => {
              const qty = Number(item.quantity) || 0;
              const unitPrice = Number(item.unit_price) || 0;
              const amount = qty * unitPrice;
              const auditItem = itemsAuditValidation?.[index];
              const auditObj =
                typeof auditItem === "object" ? auditItem : undefined;

              return (
                <tr
                  key={index}
                  className="border-t text-neutral-1100 text-sm font-medium transition duration-300 hover:bg-secondary-100"
                >
                  {/* Description */}
                  <td
                    className={`px-3 py-2.5 
                      ${getLineItemAuditClass(
                        itemsAuditValidation,
                        index,
                        showAuditHistory,
                        getAuditFieldValue(auditObj, "description"),
                      )}`}
                  >
                    <p className="line-clamp-2">{item.description || "-"}</p>
                  </td>

                  {/* Qty */}
                  <td
                    className={`px-3 py-2.5 text-right 
                      ${getLineItemAuditClass(
                        itemsAuditValidation,
                        index,
                        showAuditHistory,
                        getAuditFieldValue(auditObj, "quanity"),
                      )}`}
                  >
                    {formatPlainNumber(item?.quantity)}
                  </td>

                  {/* Unit price */}
                  <td
                    className={`px-3 py-2.5 text-right 
                      ${getLineItemAuditClass(
                        itemsAuditValidation,
                        index,
                        showAuditHistory,
                        getAuditFieldValue(auditObj, "unit_price"),
                      )}`}
                  >
                    {formatNumber(item.unit_price || 0, orgDetails?.currency)}
                  </td>
                  {/* Amount (computed) */}
                  <td
                    className={`px-3 py-2.5 text-right 
                      ${getLineItemAuditClass(
                        itemsAuditValidation,
                        index,
                        showAuditHistory,
                        getAuditFieldValue(auditObj, "unit_price"),
                      )}`}
                  >
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
    </div>
  );
}
