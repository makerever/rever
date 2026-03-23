// Component for Purchase Order line items UI

"use client";

import { useFieldArray, useWatch } from "react-hook-form";
import {
  TextAreaInput,
  NumberInput,
  IconWrapper,
  Button,
} from "@rever/common";
import { Trash } from "lucide-react";
import { poLineItemsTableProps } from "@rever/types";
import { useEffect, useMemo, useState } from "react";
import { formatNumber, isNamedObject } from "@rever/utils";
import { useUserStore } from "@rever/stores";
import { useTranslate } from "@rever/i18n";

export default function POLineItemsTable({
  control,
  register,
  setValue,
  getValues,
  showItemsDescription,
}: poLineItemsTableProps) {
  const translate = useTranslate();
  const poItemHeaders = [
    translate("purchase_order.create_po.po_line_items.description"),
    translate("purchase_order.create_po.po_line_items.qty"),
    translate("purchase_order.create_po.po_line_items.unit_price"),
    translate("purchase_order.create_po.po_line_items.amount"),
    translate("purchase_order.create_po.po_line_items.action"),
  ];

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  const watchedItems = useWatch({ control, name: "items" });
  const poItems = useMemo(() => watchedItems || [], [watchedItems]);

  const orgDetails = useUserStore((state) => state.user?.organization);

  // Recalculate amount when quantity or unit price changes
  useEffect(() => {
    poItems.forEach((item, index) => {
      const qty = Number(item.quantity);
      const up = Number(item.unit_price);
      const newAmt = qty * up;

      const currentAmt = Number(getValues(`items.${index}.amount`));

      if (!Number.isNaN(qty) && !Number.isNaN(up) && currentAmt !== newAmt) {
        setValue(`items.${index}.amount`, String(newAmt), {
          shouldDirty: true,
          shouldValidate: true,
        });
      }
    });
  }, [poItems.length, getValues, setValue]);

  const handleAddItem = () => {
    append({
      description: "",
      product_code: "",
      quantity: "",
      unit_price: "",
      amount: "0",
    });
  };

  return (
    <div>
      <table className="table-fixed w-full text-left border-separate border-spacing-x-4">
        <colgroup>
          <col className="w-3/12" />
        </colgroup>
        <thead>
          <tr>
            {poItemHeaders.map((h, i) => (
              <th
                key={i}
                className={`text-sm text-neutral-1100 font-semibold ${i < 1 ? "" : "text-right"}`}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {fields.map((field, index) => {
            const rowQty = Number(poItems[index]?.quantity) || 0;
            const rowUp = Number(poItems[index]?.unit_price) || 0;
            const rowAmt = rowQty * rowUp;

            return (
              <tr key={field.id} className="">
                <td>
                  <TextAreaInput
                    rows={1}
                    className="mt-1.5"
                    id={`items.${index}.description`}
                    register={register(`items.${index}.description`)}
                    noErrorIcon={
                      showItemsDescription &&
                      !getValues(`items.${index}.description`)
                    }
                  />
                </td>
                <td>
                  <NumberInput
                    id={`items.${index}.quantity`}
                    register={register(`items.${index}.quantity`)}
                    allowDecimal={true}
                    noErrorIcon={
                      showItemsDescription &&
                      !getValues(`items.${index}.quantity`)
                    }
                    className="text-right"
                  />
                </td>
                <td>
                  <NumberInput
                    id={`items.${index}.unit_price`}
                    register={register(`items.${index}.unit_price`)}
                    allowDecimal={true}
                    noErrorIcon={
                      showItemsDescription &&
                      !getValues(`items.${index}.unit_price`)
                    }
                    className="text-right"
                  />
                </td>
                <td className="p-2 text-right">
                  <p className="text-slate-600 text-sm">
                    {formatNumber(rowAmt, orgDetails?.currency)}
                  </p>
                </td>
                <td>
                  <div className="flex justify-end">
                    <IconWrapper
                      onClick={() => remove(index)}
                      className="hover:bg-red-100 hover:text-red-500"
                      icon={<Trash width={16} />}
                    />
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className="mt-4 px-4">
        <Button
          onClick={handleAddItem}
          name={translate("purchase_order.create_po.new_item")}
          button_type="secondary"
          icon_type="plus"
        />
      </div>
    </div>
  );
}
