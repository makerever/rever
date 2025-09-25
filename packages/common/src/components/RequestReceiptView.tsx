// Component to handle the request receipt view for a bill

"use client";

import { Bill } from "@rever/types";
import { useState } from "react";
import { formatDate, formatPlainNumber } from "@rever/utils";
import Label from "./Label";
import { useUserStore } from "@rever/stores";
import { Button, NumberInput, TextAreaInput } from "@rever/common";

type Props = {
  bill: Partial<Bill>;
  onSubmit: (data: {
    items: { id: string; confirmed_quantity: string }[];
    comment: string;
  }) => void;
  isLoading: boolean;
};

export default function RequestReceiptView({
  bill,
  onSubmit,
  isLoading,
}: Props) {
  const orgDetails = useUserStore((state) => state.user?.organization);

  const [receivedQuantities, setReceivedQuantities] = useState<
    Record<string, string>
  >(() => {
    const map: Record<string, string> = {};
    bill.items?.forEach((item) => {
      if (item?.id) {
        map[item.id] = item.quantity || "";
      }
    });
    return map;
  });

  const [comment, setComment] = useState("");

  const handleQtyChange = (id: string, value: string) => {
    setReceivedQuantities((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const items = Object.entries(receivedQuantities).map(([id, qty]) => ({
      id,
      confirmed_quantity: qty,
    }));

    onSubmit({
      items,
      comment,
    });
  };

  return (
    <div>
      <form onSubmit={handleSubmit} className="rounded-xl max-w-4xl w-full">
        <div className="">
          <div className="flex items-center mt-4">
            <div className="flex items-center mr-2">
              <p className="text-slate-800 text-lg font-semibold mr-1">
                {bill?.bill_number}{" "}
              </p>
            </div>
          </div>

          <div className="grid lg:grid-cols-4 mt-6">
            <div>
              <Label text="Due date" />
              <p className="text-slate-800 text-sm font-medium mb-5">
                {formatDate(bill?.due_date, orgDetails?.date_format) || "--"}
              </p>
            </div>
            {/* <div>
              <Label text="Assigned on" />
              <p className="text-slate-800 text-sm font-medium mb-5">
                {formatDate(bill?.due_date, orgDetails?.date_format) || "--"}
              </p>
            </div>
            <div>
              <Label text="Requested by" />
              <p className="text-slate-800 text-sm font-medium mb-5">
                Ravi sharma
              </p>
            </div> */}
            <div>
              <Label text="Vendor" />
              <p className="text-slate-800 text-sm font-medium mb-5">
                {bill?.vendor?.name || "--"}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <p className="text-slate-800 mb-6 text-lg font-semibold">
            Bill line items
          </p>
          <table className="table-fixed w-full text-left text-xs">
            <colgroup>
              <col className="w-10" />
              <col className="w-7/12" />
              <col className="w-3/12" />
              <col className="w-2/12" />
            </colgroup>
            <thead className="bg-gray-50">
              <tr>
                <th className="px-2 py-4 text-xs text-slate-500 font-medium">
                  #
                </th>
                <th className="px-2 py-4 text-xs text-slate-500 font-medium">
                  Description
                </th>
                <th className="px-2 py-4 text-xs text-slate-500 font-medium">
                  Qty
                </th>
                {bill?.receipt_status === "confirmed" ? (
                  <th className="px-2 py-4 text-xs text-slate-500 font-medium">
                    Confirmed Qty
                  </th>
                ) : (
                  <th className="px-2 py-4 text-xs text-slate-500 font-medium">
                    Received Qty
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {bill?.items?.map((item, index) => (
                <tr key={item.id} className="border-t">
                  <td className="p-2">{index + 1}</td>
                  <td className="p-2 whitespace-pre-wrap">
                    {item?.description}
                  </td>
                  <td className="p-2">{formatPlainNumber(item?.quantity)}</td>

                  {bill?.receipt_status === "confirmed" ? (
                    <td className="p-2 py-4">
                      {formatPlainNumber(item?.confirmed_quantity)}
                    </td>
                  ) : (
                    <td className="p-2">
                      <NumberInput
                        id={`items.${index}.quantity`}
                        value={receivedQuantities[item?.id || ""]}
                        onChange={(e) =>
                          handleQtyChange(item?.id || "", e.target.value)
                        }
                        allowDecimal
                      />
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {bill?.receipt_status !== "confirmed" ? (
          <>
            <div className="grid grid-cols-3 mt-4">
              <div>
                <Label htmlFor="comments" text="Comments" />
                <TextAreaInput
                  rows={3}
                  id="comments"
                  placeholder="Enter comments"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />
              </div>
            </div>
          </>
        ) : (
          <div className="grid grid-cols-3 mt-4">
            <div>
              <Label htmlFor="comments" text="Comments" />
              <p className="mt-2 text-slate-800 text-sm font-medium">
                {bill?.receipt_comment || "--"}
              </p>
            </div>
          </div>
        )}

        {bill?.receipt_status !== "confirmed" ? (
          <>
            <div className="w-fit mt-6">
              <Button
                disabled={isLoading}
                isLoading={isLoading}
                className="text-white"
                text="Submit"
                type="submit"
              />
            </div>
          </>
        ) : null}
      </form>
    </div>
  );
}
