// Component for bill line items UI ReadOnly
"use client";

import { formatNumber, formatPlainNumber, getAuditFieldValue, getLineItemAuditClass } from "@rever/utils";
import { useUserStore } from "@rever/stores";
import { BillLineItemsProps } from "@rever/types";
import { useTranslate } from "@rever/i18n";

export default function BillLineItemsReadOnly({
  showAuditHistory,
  billItems = [],
  billDetails,
  itemsAuditValidation
}: BillLineItemsProps) {
  const translate = useTranslate();
  const billItemHeaders = [
    translate("create_bill.bill_line_items.description"),
    translate("create_bill.bill_line_items.product_code"),
    translate("create_bill.bill_line_items.qty"),
    translate("create_bill.confirmed_qty"),
    translate("create_bill.bill_line_items.unit_price"),
    translate("create_bill.bill_line_items.amount"),
  ];

  const orgDetails = useUserStore((state) => state.user?.organization);

  return (
    <div className="rounded-xl border bg-white overflow-hidden">
      {/* Bill items table (read-only) */}
      <table className="table-fixed w-full text-left">
        {/* Set column widths */}
        <colgroup>
          <col className="w-5/12" />
          <col className="w-2/12" />
          <col className="w-2/12" />
          <col className="w-2/12" />
          <col className="w-2/12" />
        </colgroup>

        <thead className="bg-secondary-100">
          <tr>
            {/* Render table headers */}
            {billItemHeaders.map((h, i) => (
              <th
                key={i}
                className={`px-3 py-2 text-sm text-neutral-1100 font-semibold ${i < 2 ? "" : "text-right"}`}
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
              const auditItem = itemsAuditValidation?.[index];
              const auditObj = typeof auditItem === "object" ? auditItem : undefined;

              return (
                <tr
                  key={index}
                  className={`border-t text-sm font-medium transition duration-300 text-neutral-1100 hover:bg-secondary-100`}
                >
                  {/* Description */}
                  <td
                    className={`px-3 py-2.5 
                      ${getLineItemAuditClass(
                      itemsAuditValidation,
                      index,
                      showAuditHistory,
                      getAuditFieldValue(auditObj, "description")
                    )}`}
                  >
                    <p className="line-clamp-2">{item?.description || "-"}</p>
                  </td>

                  {/* <td
                    className={`px-3 whitespace-pre-wrap
                      ${getLineItemAuditClass(
                      itemsAuditValidation,
                      index,
                      showAuditHistory,
                      getAuditFieldValue(auditObj, "item", "name")
                    )}`}
                  >
                    {item.item?.name || "-"}
                  </td>

                  <td
                    className={`px-3 whitespace-pre-wrap ${getLineItemAuditClass(
                      itemsAuditValidation,
                      index,
                      showAuditHistory,
                      getAuditFieldValue(auditObj, "chart_of_account", "name")
                    )}`}
                  >
                    {item.chart_of_account?.name || "-"}
                  </td> */}

                  {/* Product code */}
                  <td
                    className={`px-3 ${getLineItemAuditClass(
                      itemsAuditValidation,
                      index,
                      showAuditHistory,
                      getAuditFieldValue(auditObj, "product_code")
                    )}`}
                  >
                    {item.product_code || "-"}
                  </td>

                  {/* Qty */}
                  <td
                    className={`px-3 text-right
                      ${getLineItemAuditClass(
                      itemsAuditValidation,
                      index,
                      showAuditHistory,
                      getAuditFieldValue(auditObj, "quantity")
                    )}`}
                  >
                    {formatPlainNumber(item?.quantity)}
                  </td>

                  {/* Confirmed quantity */}
                  <td
                    className={`px-3 text-right 
                      ${getLineItemAuditClass(
                      itemsAuditValidation,
                      index,
                      showAuditHistory,
                      getAuditFieldValue(auditObj, "confirmed_quantity")
                    )}`}
                  >
                    {formatPlainNumber(item?.confirmed_quantity) || "-"}
                  </td>

                  {/* Unit price */}
                  <td
                    className={`px-3 text-right
                      ${getLineItemAuditClass(
                      itemsAuditValidation,
                      index,
                      showAuditHistory,
                      getAuditFieldValue(auditObj, "unit_price")
                    )}`}
                  >
                    {formatNumber(item.unit_price || 0, orgDetails?.currency)}
                  </td>

                  {/* Amount (computed) */}
                  <td
                    className={`px-3 text-right
                      ${getLineItemAuditClass(
                      itemsAuditValidation,
                      index,
                      showAuditHistory,
                      getAuditFieldValue(auditObj, "unit_price")
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
                {translate("purchase_order.view_po.no_pos")}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
