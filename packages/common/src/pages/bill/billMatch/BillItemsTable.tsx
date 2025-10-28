// Bill items table component for matching view

import { useEffect, useState, useRef } from "react";
import { showSuccessToast } from "@rever/common";
import { BillItemsTableProps } from "@rever/types";
import { dragNDropMatchApi } from "@rever/services";
import { cn, formatNumber, formatPlainNumber } from "@rever/utils";
import { billMatchHeaders } from "@rever/constants";
import { GripVertical, TriangleAlert } from "lucide-react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";

const BillItemsTable = ({
  matchedLineItems,
  orgDetails,
  billDetails,
  triggerGetMatchResults,
}: BillItemsTableProps) => {
  // States to manage bill items and table dimensions
  const [items, setItems] = useState(matchedLineItems);
  const [tableWidth, setTableWidth] = useState(0);
  const [columnWidths, setColumnWidths] = useState<number[]>([]);
  const tableRef = useRef<HTMLTableElement | null>(null);

  useEffect(() => {
    setItems(matchedLineItems);
  }, [matchedLineItems]);

  useEffect(() => {
    const calculateDimensions = () => {
      if (tableRef.current) {
        setTableWidth(tableRef.current.offsetWidth);

        // Calculate actual column widths from the first row
        const firstRow = tableRef.current.querySelector("tbody tr:first-child");
        if (firstRow) {
          const cells = firstRow.querySelectorAll("td");
          const widths = Array.from(cells).map((cell) => cell.offsetWidth);
          setColumnWidths(widths);
        }
      }
    };

    // Calculate on mount and when items change
    setTimeout(calculateDimensions, 100);

    // Recalculate on window resize
    const handleResize = () => {
      setTimeout(calculateDimensions, 100);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [items]);

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;

    // Get draggable and droppable items index
    const sourceIndex = result.source.index;
    const destinationIndex = result.destination.index;

    if (sourceIndex === destinationIndex) return;

    const newItems = [...items];
    const temp = newItems[sourceIndex];
    newItems[sourceIndex] = newItems[destinationIndex];
    newItems[destinationIndex] = temp;

    // Get the bill item and po items based on index
    let poItem = newItems[sourceIndex]?.purchase_order_item;
    let billItem = newItems[destinationIndex]?.bill_item;

    setItems(newItems);
    const dndDataObj = {
      bill_id: billItem?.bill || "",
      bill_item_id: billItem?.id || "",
      po_item_id: poItem?.id || "",
    };

    // Api call to save updated order
    const response = await dragNDropMatchApi(dndDataObj);
    if (response?.status === 200) {
      showSuccessToast("Bill items reordered successfully");
      triggerGetMatchResults();
    } else {
      setItems(items);
    }
  };

  return (
    <div className="w-1/2">
      <div className="flex justify-between">
        <h3 className="ps-4 text-md font-semibold text-slate-700 mb-4">
          Bill items
        </h3>
        {orgDetails?.receipt_confirmation_enabled ? (
          <h3 className="pr-4 text-md font-semibold text-slate-700 mb-4">
            Confirmed Qty
          </h3>
        ) : null}
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <table ref={tableRef} className="table-fixed w-full text-left">
          <colgroup>
            <col className="w-[35%]" />
            <col className="w-[20%]" />
            <col className="w-[20%]" />
            <col className="w-[20%]" />
            {orgDetails?.receipt_confirmation_enabled && (
              <col className="w-[20%]" />
            )}
          </colgroup>
          <thead className="bg-gray-50 border-b">
            <tr>
              {billMatchHeaders.map((h, i) => (
                <th
                  key={i}
                  className={cn(
                    `${i < 1 ? "" : "text-right"}`,
                    "text-xs py-3 font-medium text-slate-500 whitespace-nowrap",
                    i === 0 ? "ps-4" : "pr-4",
                  )}
                >
                  {h}
                </th>
              ))}

              {orgDetails?.receipt_confirmation_enabled && (
                <th className="pr-4 py-3 text-xs font-medium text-slate-500 whitespace-nowrap text-right">
                  Qty
                </th>
              )}
            </tr>
          </thead>

          <Droppable droppableId="billItems">
            {(provided) => (
              <tbody ref={provided.innerRef} {...provided.droppableProps}>
                {items && items.length > 0 ? (
                  <>
                    {items?.map((billItem, index) => {
                      const item = billItem?.bill_item
                        ? billItem?.bill_item
                        : {
                            description: "",
                            quantity: "",
                            unit_price: "",
                            confirmed_quantity: "",
                            extra_bill_item: true,
                          };

                      const qty = Number(item.quantity) || 0;
                      const unitPrice = Number(item.unit_price) || 0;
                      const amount = qty * unitPrice;

                      return (
                        <Draggable
                          key={index.toString()}
                          draggableId={index.toString()}
                          index={index}
                          isDragDisabled={
                            billDetails?.status === "in_review" &&
                            !item?.extra_bill_item
                              ? false
                              : true
                          }
                        >
                          {(provided, snapshot) => (
                            <tr
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`text-xs ${!item?.extra_bill_item && billDetails?.status === "in_review" ? "cursor-grab" : ""} text-slate-800 hover:bg-slate-50 border-b relative ${
                                snapshot.isDragging ? "bg-slate-50" : ""
                              } ${billDetails?.status === "in_review" ? "" : ""} `}
                              style={{
                                ...provided.draggableProps.style,
                                ...(snapshot.isDragging && {
                                  display: "table",
                                  tableLayout: "fixed",
                                  width: `${tableWidth}px`,
                                  maxWidth: `${tableWidth}px`,
                                  minWidth: `${tableWidth}px`,
                                }),
                              }}
                            >
                              <td
                                className="p-1 ps-2 grid items-center h-[60px] m-1 overflow-auto scrollbar_none"
                                style={
                                  snapshot.isDragging && columnWidths.length > 0
                                    ? {
                                        width: `${columnWidths[0]}px`,
                                        maxWidth: `${columnWidths[0]}px`,
                                        minWidth: `${columnWidths[0]}px`,
                                      }
                                    : {}
                                }
                              >
                                {billDetails?.status === "in_review" &&
                                !item?.extra_bill_item ? (
                                  <GripVertical
                                    width={12}
                                    className="text-slate-600 absolute left-0 cursor-grab"
                                  />
                                ) : null}
                                <div
                                  className={`flex items-center gap-2 p-1 rounded-md w-fit ${
                                    billItem?.description_status !==
                                    "mismatched"
                                      ? ""
                                      : "text-red-500"
                                  }`}
                                >
                                  {item.description}
                                </div>
                              </td>
                              <td
                                className="py-1 text-right pr-4"
                                style={
                                  snapshot.isDragging && columnWidths.length > 0
                                    ? {
                                        width: `${columnWidths[1]}px`,
                                        maxWidth: `${columnWidths[1]}px`,
                                        minWidth: `${columnWidths[1]}px`,
                                      }
                                    : {}
                                }
                              >
                                <span
                                  className={`p-1 rounded-md w-fit ${
                                    billItem?.quantity_status ||
                                    !billItem?.purchase_order_item
                                      ? ""
                                      : !item?.extra_bill_item
                                        ? "border border-red-500 text-red-500"
                                        : ""
                                  }`}
                                >
                                  {formatPlainNumber(item.quantity)}
                                </span>
                              </td>
                              <td
                                className="py-1 text-right pr-4"
                                style={
                                  snapshot.isDragging && columnWidths.length > 0
                                    ? {
                                        width: `${columnWidths[2]}px`,
                                        maxWidth: `${columnWidths[2]}px`,
                                        minWidth: `${columnWidths[2]}px`,
                                      }
                                    : {}
                                }
                              >
                                <span
                                  className={`p-1 rounded-md w-fit ${
                                    billItem?.unit_price_status ||
                                    !billItem?.purchase_order_item
                                      ? ""
                                      : !item?.extra_bill_item
                                        ? "border border-red-500 text-red-500"
                                        : ""
                                  }`}
                                >
                                  {formatNumber(
                                    item.unit_price,
                                    orgDetails?.currency,
                                  )}
                                </span>
                              </td>
                              <td
                                className="py-1 text-right pr-4"
                                style={
                                  snapshot.isDragging && columnWidths.length > 0
                                    ? {
                                        width: `${columnWidths[3]}px`,
                                        maxWidth: `${columnWidths[3]}px`,
                                        minWidth: `${columnWidths[3]}px`,
                                      }
                                    : {}
                                }
                              >
                                <span
                                  className={`p-1 rounded-md w-fit ${
                                    (billItem?.quantity_status &&
                                      billItem?.unit_price_status) ||
                                    !billItem?.purchase_order_item
                                      ? ""
                                      : !item?.extra_bill_item
                                        ? "border border-red-500 text-red-500"
                                        : ""
                                  }`}
                                >
                                  {item?.extra_bill_item
                                    ? ""
                                    : formatNumber(
                                        amount,
                                        orgDetails?.currency,
                                      )}
                                </span>
                              </td>

                              {orgDetails?.receipt_confirmation_enabled && (
                                <td
                                  className="py-1 text-right pr-4"
                                  style={
                                    snapshot.isDragging &&
                                    columnWidths.length > 0
                                      ? {
                                          width: `${columnWidths[3]}px`,
                                          maxWidth: `${columnWidths[3]}px`,
                                          minWidth: `${columnWidths[3]}px`,
                                        }
                                      : {}
                                  }
                                >
                                  <div className="flex items-center justify-end">
                                    {item?.confirmed_quantity &&
                                    item?.quantity !==
                                      item?.confirmed_quantity ? (
                                      <TriangleAlert
                                        className="text-yellow-500"
                                        width={14}
                                      />
                                    ) : null}

                                    <span className="p-1 rounded-md w-fit">
                                      {item?.extra_bill_item
                                        ? ""
                                        : formatPlainNumber(
                                            item?.confirmed_quantity,
                                          ) || "--"}
                                    </span>
                                  </div>
                                </td>
                              )}
                            </tr>
                          )}
                        </Draggable>
                      );
                    })}
                    {provided.placeholder}
                  </>
                ) : (
                  <tr>
                    <td
                      colSpan={5}
                      className="p-6 h-[60px] text-center text-slate-400 text-sm"
                    >
                      No bill items to display.
                    </td>
                  </tr>
                )}
              </tbody>
            )}
          </Droppable>
        </table>
      </DragDropContext>
    </div>
  );
};

export default BillItemsTable;
