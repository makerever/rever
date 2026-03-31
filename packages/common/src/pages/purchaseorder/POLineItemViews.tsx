// Component for PO line items UI ReadOnly
"use client";

import { checkAuditValidation, formatNumber, formatPlainNumber, getAuditFieldValue, getLineItemAuditClass } from "@rever/utils";
import { useUserStore } from "@rever/stores";
import { POLineItemsProps } from "@rever/types";
import { CustomTooltip, Label } from "@rever/common";
import { useTranslate } from "@rever/i18n";

export default function poLineItemsReadOnly({
  showAuditHistory,
  poItems = [],
  poDetails,
  itemsAuditValidation,
  auditValidation
}: POLineItemsProps) {
  const translate = useTranslate();
  const poItemHeaders = [
    translate("purchase_order.create_po.po_line_items.description"),
    translate("purchase_order.create_po.po_line_items.qty"),
    translate("purchase_order.available_qty"),
    translate("purchase_order.create_po.po_line_items.unit_price"),
    translate("purchase_order.create_po.po_line_items.amount"),
  ];

  const orgDetails = useUserStore((state) => state.user?.organization);

  return (
    <>
      <div className="space-y-4 rounded-xl border border-neutral-300 overflow-y-hidden">
        {/* PO items table (read-only) */}
        <table className="table-fixed w-full text-left">
          {/* Set column widths */}
          <colgroup>
            <col className="w-6/12" />
            <col className="w-1/12" />
            <col className="w-1/5" />
            <col className="w-2/12" />
            <col className="w-2/12" />
          </colgroup>

          <thead className="bg-secondary-100">
            <tr>
              {/* Render table headers */}
              {poItemHeaders.map((h, i) => (
                <th
                  key={i}
                  className={`px-2 py-2.5 h-10 text-sm text-neutral-1100 font-semibold ${i < 1 ? "" : "text-right"}`}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {/* Render each PO item row, or a message if empty */}
            {poItems.length > 0 ? (
              poItems.map((item, index) => {
                const qty = Number(item.quantity) || 0;
                const unitPrice = Number(item.unit_price) || 0;
                const amount = qty * unitPrice;
                const auditItem = itemsAuditValidation?.[index];
                const auditObj = typeof auditItem === "object" ? auditItem : undefined;
                const balanceQty =
                  Number(item?.quantity) -
                  (Number(item?.received_quantity || 0) +
                    Number(item?.pending_approval_quantity || 0));

                return (
                  <tr
                    key={index}
                    className="border-t border-neutral-300 text-neutral-900 font-medium text-sm transition duration-300 hover:bg-slate-50"
                  >
                    {/* Description */}
                    <td
                      className={`px-3 py-2.5 ${getLineItemAuditClass(
                        itemsAuditValidation,
                        index,
                        showAuditHistory,
                        getAuditFieldValue(auditObj, "description")
                      )}`}
                    >
                      {item.description || "-"}
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

                    {/* Available quantity */}
                    <td className="h-10 align-middle p-2 text-right">
                      <CustomTooltip
                        className="min-w-40"
                        content={
                          <div className="my-1">
                            <div className="mb-1 flex justify-between gap-2">
                              <div>{translate("purchase_order.create_po.total")}:</div>{" "}
                              <div>{formatPlainNumber(item?.quantity)}</div>
                            </div>
                            <div className="mb-1 flex justify-between gap-2">
                              <div>{translate("purchase_order.stagebar.under_approval")}:</div>{" "}
                              <div>
                                {formatPlainNumber(
                                  item?.pending_approval_quantity,
                                )}
                              </div>
                            </div>
                            <div className="mb-1 flex justify-between gap-2">
                              <div>{translate("purchase_order.consumed")}:</div>{" "}
                              <div>
                                {formatPlainNumber(item?.received_quantity)}
                              </div>
                            </div>
                            <div className="mb-1 flex justify-between gap-2">
                              <div>{translate("purchase_order.available")}:</div>{" "}
                              <div>{formatPlainNumber(balanceQty)}</div>
                            </div>
                          </div>
                        }
                        side="right"
                      >
                        <span className="underline cursor-pointer rounded-md w-fit">
                          {formatPlainNumber(balanceQty)}
                        </span>
                      </CustomTooltip>
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
                        getAuditFieldValue(auditObj, "amount")
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
                  className="min-h-10 p-4 text-center text-sm text-slate-400"
                >
                  {translate("purchase_order.view_po.no_pos")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="mt-5 flex items-start justify-between flex-row">
        <div className="w-full flex flex-col">
          {/* Reject remarks */}
          {!showAuditHistory &&
            <>
              {(poDetails?.reject_reason !== null) &&
                <div className="mb-4">
                  <Label
                    text={translate("purchase_order.rejection_reason") + ":"}
                    className="max-w-60 w-full text-secondary-700 mb-0 font-medium"
                  />
                  <p className={`text-neutral-1100 text-sm ${checkAuditValidation({ showAuditHistory, field: auditValidation?.reject_reason })}`}>
                    {poDetails?.reject_reason || "--"}
                  </p>
                </div>}
            </>
          }
          {/* Notes */}
          <div className="">
            <Label
              text={translate("purchase_order.notes")}
              className="max-w-60 w-full text-secondary-700 mb-0 font-medium"
            />
            <p className={`text-neutral-1100 text-sm ${checkAuditValidation({ showAuditHistory, field: auditValidation?.comments })}`}>
              {poDetails?.comments || "--"}
            </p>
          </div>
        </div>
        {/* PO summary section (sub total, tax, total) */}
        <div className="flex justify-end">
          <div className="p-4 w-72 font-medium text-neutral-1100 text-sm bg-neutral-100 rounded-[20px] flex flex-col gap-5">
            <div className="grid grid-cols-2">
              <p className="text-sm font-medium">{translate("purchase_order.view_po.sub_total")}</p>
              <p className={`text-neutral-900 text-right ${checkAuditValidation({ showAuditHistory, field: auditValidation?.sub_total })}`}>
                {formatNumber(poDetails?.sub_total || 0, orgDetails?.currency)}
              </p>
            </div>
            <div className="grid grid-cols-2">
              <p className="text-sm font-medium flex flex-col">
                {translate("purchase_order.view_po.total_tax")}
                <span className={`text-neutral-900 text-xs ${checkAuditValidation({ showAuditHistory, field: auditValidation?.total })}`}>
                  {formatNumber(
                    (Number(poDetails?.total) || 0) -
                    (Number(poDetails?.sub_total) || 0),
                    orgDetails?.currency,
                  )}
                </span>
              </p>
              <p className={`text-right text-neutral-900 ${checkAuditValidation({ showAuditHistory, field: auditValidation?.tax_percentage })}`}>
                {poDetails?.tax_percentage || 0}%
              </p>
            </div>
            <div className="grid grid-cols-2 font-semibold">
              <p className="text-sm">{translate("purchase_order.view_po.grand_total")}</p>
              <p className={`text-neutral-900 text-right ${checkAuditValidation({ showAuditHistory, field: auditValidation?.total })}`}>
                {formatNumber(poDetails?.total || 0, orgDetails?.currency)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
