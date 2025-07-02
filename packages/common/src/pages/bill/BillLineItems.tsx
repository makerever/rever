// Component for bill line items UI

"use client";

import { useFieldArray, useWatch } from "react-hook-form";
import {
  TextInput,
  TextAreaInput,
  NumberInput,
  IconWrapper,
} from "@rever/common";
import { Plus, Trash } from "lucide-react";
import { BillLineItemsTableProps } from "@rever/types";
import { useEffect, useMemo } from "react";
import { formatNumber } from "@rever/utils";
import { useUserStore } from "@rever/stores";

const billItemHeaders = [
  "#",
  "Description",
  "Product code",
  "Quantity",
  "Unit price",
  "Amount",
  "Action",
];

export default function BillLineItemsTable({
  control,
  register,
  setValue,
  getValues,
  showItemsDescription,
}: BillLineItemsTableProps) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  // Safer useWatch usage
  const watchedItems = useWatch({ control, name: "items" });
  const billItems = useMemo(() => watchedItems || [], [watchedItems]);

  const orgDetails = useUserStore((state) => state.user?.organization);

  // Update amount when qty or unit_price changes, avoid extra updates
  useEffect(() => {
    billItems.forEach((item, index) => {
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
  }, [billItems.length, getValues, setValue]);

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
    <div className="space-y-4">
      <table className="table-fixed w-full text-left">
        <colgroup>
          <col className="w-8" />
          <col className="w-3/12" />
        </colgroup>
        <thead className="bg-gray-50">
          <tr>
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
          {fields.map((field, index) => {
            const rowQty = Number(billItems[index]?.quantity) || 0;
            const rowUp = Number(billItems[index]?.unit_price) || 0;
            const rowAmt = rowQty * rowUp;

            return (
              <tr
                key={field.id}
                className="border-t transition duration-300 hover:bg-slate-50"
              >
                <td className="p-2 text-xs">{index + 1}</td>
                <td className="p-2">
                  <TextAreaInput
                    rows={2}
                    id={`items.${index}.description`}
                    register={register(`items.${index}.description`)}
                    noErrorIcon={
                      showItemsDescription &&
                      !getValues(`items.${index}.description`)
                    }
                  />
                </td>
                <td className="p-2">
                  <TextInput
                    id={`items.${index}.product_code`}
                    register={register(`items.${index}.product_code`)}
                  />
                </td>

                <td className="p-2">
                  <NumberInput
                    id={`items.${index}.quantity`}
                    register={register(`items.${index}.quantity`)}
                    allowDecimal={true}
                    noErrorIcon={
                      showItemsDescription &&
                      !getValues(`items.${index}.quantity`)
                    }
                  />
                </td>
                <td className="p-2">
                  <NumberInput
                    id={`items.${index}.unit_price`}
                    register={register(`items.${index}.unit_price`)}
                    allowDecimal={true}
                    noErrorIcon={
                      showItemsDescription &&
                      !getValues(`items.${index}.unit_price`)
                    }
                  />
                </td>
                <td className="p-2">
                  <p className="text-slate-600 text-sm">
                    {formatNumber(rowAmt, orgDetails?.currency)}
                  </p>
                </td>
                <td className="p-2">
                  <IconWrapper
                    onClick={() => remove(index)}
                    className="hover:bg-red-100 hover:text-red-500"
                    icon={<Trash width={16} />}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div
        onClick={handleAddItem}
        className="flex items-center w-fit text-xs font-semibold text-primary-500 cursor-pointer"
      >
        <Plus width={16} className="mr-1" /> New bill item
      </div>
    </div>
  );
}
