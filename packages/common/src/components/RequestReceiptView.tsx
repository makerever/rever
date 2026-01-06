// Component to handle the request receipt view for a bill

"use client";

import { Bill } from "@rever/types";
import { useEffect, useRef, useState } from "react";
import {
  formatDate,
  formatPlainNumber,
  getLabelForBillStatus,
  getStatusClass,
} from "@rever/utils";
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
  const billDetailsSection = useRef<HTMLDivElement | null>(null);
  const [billDetailsHeight, setBillDetailsHeight] = useState<number | null>(
    null,
  );

  //to get current height of PO Detials section
  useEffect(() => {
    if (!isLoading) {
      setBillDetailsHeight(billDetailsSection?.current?.offsetHeight ?? 0);
    }
  }, [isLoading]);

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
      <form onSubmit={handleSubmit} className="w-full">
        {/* Header */}
        <div className="flex items-center justify-between bg-white rounded-b-[20px] p-4 pt-16 border border-secondary-200">
          <div className="flex items-center gap-3">
            <p className="text-neutral-1100 text-2xl font-medium">
              {bill?.bill_number}{" "}
            </p>
          </div>
        </div>
        {/* Bill details */}
        <div
          ref={billDetailsSection}
          className={`border border-secondary-200 rounded-[20px] bg-white p-4`}
        >
          <p className="text-neutral-1100 text-xl mb-5 font-medium">
            Confirmation Details
          </p>
          <div className="grid grid-cols-1 gap-x-5">
            <div className="flex flex-row items-center border-b border-secondary-200 pb-3">
              <Label
                text="Vendor:"
                className="max-w-60 w-full text-secondary-700 mb-0 font-medium"
              />
              <p className="text-neutral-1100 text-sm">
                {bill?.vendor?.name || "--"}
              </p>
            </div>

            {/* <div className="flex flex-row items-center border-b border-secondary-200 py-3">
              <Label
                text="Requested by:"
                className="max-w-60 w-full text-secondary-700 mb-0 font-medium"
              />
              <p className="text-neutral-1100 text-sm">
                {bill?.vendor?.name || "--"}
              </p>
            </div> */}

            <div className="flex flex-row items-center border-b border-secondary-200 py-3">
              <Label
                text="Bill Date:  "
                className="max-w-60 w-full text-secondary-700 mb-0 font-medium"
              />
              <p className="text-neutral-1100 text-sm">
                {bill?.bill_date || "--"}
              </p>
            </div>

            <div className="flex flex-row items-center pt-3">
              <Label
                text="Due Date:  "
                className="max-w-60 w-full text-secondary-700 mb-0 font-medium"
              />
              <p className="text-neutral-1100 text-sm">
                {bill?.due_date || "--"}
              </p>
            </div>
          </div>
        </div>
        <div
          className={`rounded-[20px] bg-white p-4 border border-secondary-200`}
          style={{
            minHeight: `calc(100vh - 10rem - ${billDetailsHeight ?? 0}px - 2px)`, //is for mesh UI - border 1px y-axis, padding 1px y-axis
          }}
        >
          <p className="text-neutral-1100 text-xl font-medium mb-4">
            Bill Line Items
          </p>
          <div className="rounded-xl border bg-white overflow-hidden">
            <table className="table-fixed w-full text-left">
              <colgroup>
                <col className="w-10" />
                <col className="w-7/12" />
                <col className="w-3/12" />
                <col className="w-2/12" />
              </colgroup>
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-sm text-center text-neutral-1100 font-semibold ">
                    #
                  </th>
                  <th className="px-3 py-2 text-sm text-neutral-1100 font-semibold ">
                    Description
                  </th>
                  <th className="px-3 py-2 text-sm text-neutral-1100 font-semibold ">
                    Qty
                  </th>
                  {bill?.receipt_status === "confirmed" ? (
                    <th className="px-3 py-2 text-sm text-neutral-1100 font-semibold ">
                      Confirmed Qty
                    </th>
                  ) : (
                    <th className="px-3 py-2 text-sm text-neutral-1100 font-semibold ">
                      Received Qty
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {bill?.items?.map((item, index) => (
                  <tr
                    key={item.id}
                    className="border-t text-neutral-1100 text-sm font-medium transition duration-300 hover:bg-secondary-100"
                  >
                    <td className="px-3 py-2.5 text-center">{index + 1}</td>
                    <td className="px-3 whitespace-pre-wrap">
                      {item?.description}
                    </td>
                    <td className="px-3">
                      {formatPlainNumber(item?.quantity)}
                    </td>

                    {bill?.receipt_status === "confirmed" ? (
                      <td className="px-3 py-4">
                        {formatPlainNumber(item?.confirmed_quantity)}
                      </td>
                    ) : (
                      <td className="px-3 py-4">
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
          <div className="w-full">
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
          </div>
          {bill?.receipt_status !== "confirmed" ? (
            <>
              <div className="w-fit mt-4">
                <Button
                  disabled={isLoading}
                  icon_type={isLoading ? "loader" : null}
                  type="submit"
                  button_type="primary"
                  name="Submit"
                />
              </div>
            </>
          ) : null}
        </div>
      </form>
    </div>
  );
}
