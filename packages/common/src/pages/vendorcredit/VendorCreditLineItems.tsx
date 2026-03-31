// Component for vendor credit line items UI

"use client";

import { useFieldArray, useWatch } from "react-hook-form";
import {
  TextAreaInput,
  NumberInput,
  IconWrapper,
  Button,
} from "@rever/common";
import { Trash } from "lucide-react";
import { VendorCreditLineItemsTableProps } from "@rever/types";
import { useEffect, useMemo } from "react";
import { formatNumber } from "@rever/utils";
import { useUserStore } from "@rever/stores";
import { useTranslate } from "@rever/i18n";

export default function VendorCreditLineItemsTable({
  control,
  register,
  setValue,
  getValues,
  showItemsDescription,
}: VendorCreditLineItemsTableProps) {
  const translate = useTranslate();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  // Safer useWatch usage
  const watchedItems = useWatch({ control, name: "items" });
  const vendorCreditItems = useMemo(() => watchedItems || [], [watchedItems]);

  const orgDetails = useUserStore((state) => state.user?.organization);

  // Update amount when qty or unit_price changes, avoid extra updates
  useEffect(() => {
    vendorCreditItems.forEach((item, index) => {
      const qty = Number(item.quantity);
      const up = Number(item.unit_price);
      const newAmt = qty * up;

      const currentAmt = Number(getValues(`items.${index}.total_amount`));

      if (!Number.isNaN(qty) && !Number.isNaN(up) && currentAmt !== newAmt) {
        setValue(`items.${index}.total_amount`, String(newAmt), {
          shouldDirty: true,
          shouldValidate: true,
        });
      }
    });
  }, [vendorCreditItems.length, getValues, setValue]);

  const handleAddItem = () => {
    append({
      description: "",
      quantity: "",
      unit_price: "",
      total_amount: "0",
    });
  };

  return (
    <div className="-mx-4">
      <table className="table-fixed w-full text-left border-separate border-spacing-x-4">
        <colgroup>
          <col className="w-[35%]" />
          <col className="w-[15%]" />
          <col className="w-2/12" />
        </colgroup>
        <thead>
          <tr>
            {[
              translate("vendors.vendor_credit.create_vendor_credit.vendor_credit_line_items.description"),
              translate("vendors.vendor_credit.create_vendor_credit.vendor_credit_line_items.qty"),
              translate("vendors.vendor_credit.create_vendor_credit.vendor_credit_line_items.unit_price"),
              translate("vendors.vendor_credit.create_vendor_credit.vendor_credit_line_items.amount"),
              translate("vendors.vendor_credit.create_vendor_credit.vendor_credit_line_items.action"),
            ].map((h, i) => (
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
            const rowQty = Number(vendorCreditItems[index]?.quantity) || 0;
            const rowUp = Number(vendorCreditItems[index]?.unit_price) || 0;
            const rowAmt = rowQty * rowUp;

            return (
              <tr key={field.id}>
                <td>
                  <TextAreaInput
                    className="mt-1.5"
                    rows={1}
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
                    className="text-right"
                    noErrorIcon={
                      showItemsDescription &&
                      !getValues(`items.${index}.quantity`)
                    }
                  />
                </td>
                <td>
                  <NumberInput
                    id={`items.${index}.unit_price`}
                    register={register(`items.${index}.unit_price`)}
                    allowDecimal={true}
                    className="text-right"
                    noErrorIcon={
                      showItemsDescription &&
                      !getValues(`items.${index}.unit_price`)
                    }
                  />
                </td>
                <td className="text-right">
                  <p className="text-neutral-1100 font-medium text-sm">
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

      <div className="m-4">
        <Button
          onClick={handleAddItem}
          name={translate("vendors.vendor_credit.create_vendor_credit.new_item")}
          button_type="secondary"
          icon_type="plus"
        />
      </div>
    </div>
  );
}
