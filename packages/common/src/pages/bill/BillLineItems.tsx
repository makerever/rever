// Component for bill line items UI

"use client";

import { useFieldArray, useWatch } from "react-hook-form";
import {
  TextInput,
  TextAreaInput,
  NumberInput,
  IconWrapper,
  SelectComponent,
  Button,
} from "@rever/common";
import { Plus, Trash } from "lucide-react";
import { BillLineItemsTableProps, Option } from "@rever/types";
import { useEffect, useMemo, useState } from "react";
import { formatNumber, isNamedObject } from "@rever/utils";
import { useUserStore } from "@rever/stores";
import { useApi } from "@rever/services";

const billItemHeaders = [
  // "#",
  "Description",
  "Product code",
  "Qty",
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

  const [coaList, setCoaList] = useState<Option[]>([]);

  const [itemList, setItemList] = useState<Option[]>([]);

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
    <div className="-mx-4">
      <table className="table-fixed w-full text-left border-separate border-spacing-x-4">
        <colgroup>
          {/* <col className="w-8" /> */}
          <col className="w-[35%]" />
          <col className="w-[15%]" />
          <col className="w-2/12" />
        </colgroup>
        <thead>
          <tr>
            {billItemHeaders.map((h, i) => (
              <th
                key={i}
                className={`text-sm text-neutral-1100 font-semibold ${i < 2 ? "" : "text-right"}`}
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
              <tr key={field.id}>
                {/* <td className="p-2 text-xs">{index + 1}</td> */}
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
                  <TextInput
                    id={`items.${index}.product_code`}
                    register={register(`items.${index}.product_code`)}
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
          name="New bill item"
          button_type="secondary"
          icon_type="plus"
        />
      </div>
    </div>
  );
}
