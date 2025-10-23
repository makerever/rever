// Component for bill matching interface

"use client";

import { useCallback, useEffect, useState, useMemo, memo, useRef } from "react";
import {
  Button,
  CircularProgressBar,
  CustomTooltip,
  Label,
  PageLoader,
  showErrorToast,
  showSuccessToast,
  ToggleSwitch,
} from "@rever/common";
import {
  Bill,
  BillItem,
  BillItemsTableProps,
  MatchedLineItem,
  MatchStatus,
  OrgDataProps,
  OrgDetails,
  PurchaseOrderItem,
  UnmatchedLineItem,
} from "@rever/types";
import {
  acceptRejectBillApi,
  dragNDropMatchApi,
  getAssignApprovalApi,
  getBillDetailsByIdApi,
  getMatchResultsApi,
  sendBillForApprovalApi,
  updateBillApi,
} from "@rever/services";
import { useRouter, useSearchParams } from "next/navigation";
import {
  cn,
  convertToPercentage,
  formatNumber,
  formatPlainNumber,
  getLabelForBillStatus,
  getStatusClass,
} from "@rever/utils";
import { billMatchHeaders, poMatchHeaders } from "@rever/constants";
import { useBreadcrumbStore, useUserStore } from "@rever/stores";
import {
  CircleCheck,
  CircleX,
  GripVertical,
  Info,
  TriangleAlert,
} from "lucide-react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";

// Match status icon component to reduce repetition
const StatusIcon = memo(
  ({
    status,
    description_score,
    description_status,
    overall_status,
  }: {
    status: MatchStatus | null;
    tooltipContent: string;
    description_score?: number;
    description_status?: string;
    overall_status?: string | null;
  }) => {
    // Fetching diff icons based on status
    const getIconByStatus = () => {
      switch (status) {
        case "Matched":
          return <CircleCheck className="text-green-600" width={16} />;
        case "Mismatched":
          return <CircleX className="text-red-500" width={16} />;
        case "Partial matched":
          return <Info className="text-yellow-500" width={16} />;
        case "poNotAvailable":
          return <Info className="text-yellow-500" width={16} />;
        default:
          return null;
      }
    };

    return status && status === "none" ? (
      "--"
    ) : status !== "poNotAvailable" ? (
      <CustomTooltip
        content={
          <div className="my-1">
            <div className="mb-0.5">
              Description status: {description_status}
            </div>
            <div className="flex items-center mb-1.5">
              Confidence score:&nbsp;
              <CircularProgressBar
                percentage={Number(convertToPercentage(description_score || 0))}
              />
            </div>

            <div className="mb-1">Overall status: {overall_status}</div>
          </div>
        }
        side="bottom"
      >
        <div className="w-fit">{getIconByStatus()}</div>
      </CustomTooltip>
    ) : (
      <CustomTooltip
        content={<div className="my-1">PO line item missing</div>}
        side="bottom"
      >
        <div>
          <Info className="text-slate-500" width={16} />
        </div>
      </CustomTooltip>
    );
  },
);

// PO Items Table component
const POItemsTable = memo(
  ({
    matchedLineItems,
    orgDetails,
  }: {
    matchedLineItems: (MatchedLineItem | UnmatchedLineItem)[];
    orgDetails: OrgDetails | undefined;
  }) => (
    <div className="w-1/2">
      <h3 className="text-md font-semibold text-slate-700 mb-4">
        Purchase order items
      </h3>
      <table className="table-fixed w-full text-left">
        <colgroup>
          <col className="w-[30px]" />
          <col className="w-[35%]" />
          <col className="w-[20%]" />
          <col className="w-[20%]" />
          <col className="w-[20%]" />
        </colgroup>

        <thead className="bg-gray-50 border-b">
          <tr>
            {poMatchHeaders.map((h, i) => (
              <th
                key={i}
                className={cn(
                  `${i < 2 ? "" : "text-right"}`,
                  "text-xs pr-4 py-3 font-medium text-slate-500 whitespace-nowrap",
                  i === 0 ? "ps-2 w-[30px]" : "",
                )}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {matchedLineItems.length > 0 ? (
            matchedLineItems.map((poItem, index) => {
              const item = poItem?.purchase_order_item;
              const qty = Number(item.quantity) || 0;
              const unitPrice = Number(item.unit_price) || 0;
              const amount = qty * unitPrice;
              const balanceQty =
                Number(item?.quantity) -
                (Number(item?.received_quantity || 0) +
                  Number(item?.pending_approval_quantity || 0));

              // Type guard to check if it's a MatchedLineItem
              const isMatchedItem = (
                item: MatchedLineItem | UnmatchedLineItem,
              ): item is MatchedLineItem => {
                return (
                  "description_status" in item ||
                  "quantity_status" in item ||
                  "unit_price_status" in item
                );
              };

              const matchedItem = isMatchedItem(poItem) ? poItem : null;

              return (
                <tr
                  key={index}
                  className="text-xs text-slate-800 hover:bg-slate-50 border-b"
                >
                  <td className="p-2.5">{index + 1}</td>
                  <td className="p-1 ps-0 grid items-center h-[60px] m-1 overflow-auto scrollbar_none">
                    <div className="flex items-center gap-1">
                      {item.description || "-"}
                    </div>
                  </td>
                  <td className="py-1 text-right pr-4">
                    <CustomTooltip
                      className="min-w-40"
                      content={
                        <div className="my-1">
                          <div className="mb-1 flex justify-between gap-2">
                            <div>Total:</div>{" "}
                            <div>{formatPlainNumber(item.quantity)}</div>
                          </div>
                          <div className="mb-1 flex justify-between gap-2">
                            <div>Under approval:</div>{" "}
                            <div>
                              {formatPlainNumber(
                                item.pending_approval_quantity,
                              )}
                            </div>
                          </div>
                          <div className="mb-1 flex justify-between gap-2">
                            <div>Consumed:</div>{" "}
                            <div>
                              {formatPlainNumber(item.received_quantity)}
                            </div>
                          </div>
                          <div className="mb-1 flex justify-between gap-2">
                            <div>Available:</div>{" "}
                            <div>{formatPlainNumber(balanceQty)}</div>
                          </div>
                        </div>
                      }
                      side="right"
                    >
                      <span
                        className={`underline cursor-pointer rounded-md w-fit ${matchedItem?.quantity_status ? "" : "border border-transparent"}`}
                      >
                        {formatPlainNumber(balanceQty)}
                      </span>
                    </CustomTooltip>
                  </td>
                  <td className="py-1 text-right pr-4">
                    <span
                      className={`rounded-md w-fit ${matchedItem?.unit_price_status ? "" : ""}`}
                    >
                      {formatNumber(item.unit_price, orgDetails?.currency)}
                    </span>
                  </td>
                  <td className="py-1 text-right pr-4">
                    <span
                      className={`rounded-md w-fit ${matchedItem?.quantity_status && matchedItem?.unit_price_status ? "" : "border border-transparent"}`}
                    >
                      {formatNumber(amount, orgDetails?.currency)}
                    </span>
                  </td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td
                colSpan={5}
                className="p-6 h-[60px] text-center text-slate-400 text-sm"
              >
                No PO items to display.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  ),
);

// Bill Items Table component
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

// Matching Status Table component
const MatchingStatusTable = memo(
  ({
    matchedLineItems,
    orgDetails,
  }: {
    matchedLineItems: MatchedLineItem[];
    orgDetails?: OrgDataProps;
  }) => (
    <div>
      <table className="table-fixed w-full text-left">
        <colgroup>
          <col className="w-full" />
        </colgroup>

        <thead className="bg-gray-50 border-b">
          <tr>
            <th className="ps-4 pr-2 py-3 text-xs font-medium text-slate-500 whitespace-nowrap">
              Match status
            </th>
          </tr>
        </thead>

        <tbody>
          {matchedLineItems.length > 0 ? (
            matchedLineItems.map((item, index) => {
              function getOverallStatus() {
                const isConfirmedQtyMismatched =
                  item?.bill_item?.confirmed_quantity &&
                  item?.bill_item?.quantity !==
                    item?.bill_item?.confirmed_quantity;

                if (
                  orgDetails?.receipt_confirmation_enabled &&
                  isConfirmedQtyMismatched
                ) {
                  return "Mismatched";
                } else if (item?.overall_status === "matched") {
                  return "Matched";
                } else if (item?.overall_status === "mismatched") {
                  return "Mismatched";
                } else if (item?.overall_status === "partial") {
                  return "Partial matched";
                } else {
                  return null;
                }
              }

              return (
                <tr
                  key={index}
                  className="text-xs text-slate-800 hover:bg-slate-50 border-b"
                >
                  <td className="p-3 ps-4 grid items-center h-[60px] m-1">
                    <StatusIcon
                      status={
                        item?.overall_status
                          ? getOverallStatus()
                          : item?.purchase_order_item?.description
                            ? "none"
                            : "poNotAvailable"
                      }
                      tooltipContent={
                        item?.overall_status === "matched"
                          ? "Matched"
                          : item?.overall_status === "mismatched"
                            ? "Mismatched"
                            : item?.overall_status === "partial"
                              ? "Partial matched"
                              : ""
                      }
                      description_score={item.description_score}
                      description_status={
                        item?.description_status === "matched"
                          ? "Matched"
                          : item?.description_status === "mismatched"
                            ? "Mismatched"
                            : item?.description_status === "partial"
                              ? "Partial matched"
                              : ""
                      }
                      overall_status={getOverallStatus()}
                    />
                  </td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td
                colSpan={4}
                className="p-6 h-[60px] text-center text-slate-400 text-sm"
              >
                --
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  ),
);

const BillPOMatchUI = () => {
  // Router and store hooks
  const router = useRouter();
  const searchParams = useSearchParams();
  const idValue = searchParams.get("id");
  const userDetails = useUserStore((state) => state.user);
  const orgDetails = useUserStore((state) => state.user?.organization);
  const setDynamicCrumb = useBreadcrumbStore((s) => s.setDynamicCrumb);

  // State management
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [billDetails, setBillDetails] = useState<Partial<Bill>>({});
  const [hideMatchItems, setHideMatchItems] = useState<boolean>(false);
  const [isLoaderFormSubmit, setIsLoaderFormSubmit] = useState<boolean>(false);
  const [isApproverAvailable, setIsApproverAvailable] =
    useState<boolean>(false);
  const [matchedLineItems, setMatchedLineItems] = useState<MatchedLineItem[]>(
    [],
  );
  const [unMatchedLineItems, setUnMatchedLineItems] = useState<
    UnmatchedLineItem[]
  >([]);
  const [unMatchedBillLineItems, setUnMatchedBillLineItems] = useState<
    UnmatchedLineItem[]
  >([]);

  // Filter matched items based on toggle
  const filteredLineItems = useMemo(() => {
    if (!hideMatchItems) return matchedLineItems;

    return matchedLineItems.filter(
      (item) =>
        item?.overall_status !== "matched" ||
        (item?.bill_item?.confirmed_quantity &&
          item?.bill_item?.quantity !== item?.bill_item?.confirmed_quantity),
    );
  }, [matchedLineItems, hideMatchItems]);

  // Fetch match results for a bill
  const getMatchResults = useCallback(async (id: string) => {
    try {
      const response = await getMatchResultsApi(id);
      if (response?.status === 200) {
        // Set billed line items
        setMatchedLineItems(response?.data?.billed || []);
        const formatUnbilledData: UnmatchedLineItem[] =
          response?.data?.Unbilled?.map((v: PurchaseOrderItem) => {
            return {
              purchase_order_item: v,
            };
          });

        // Set unbilled line items
        setUnMatchedLineItems(formatUnbilledData || []);
        const formatExtraBilledItems: UnmatchedLineItem[] =
          response?.data?.extra_bill_items?.map((v: BillItem) => {
            return {
              bill_item: v,
            };
          });

        // Set extra billed line items
        setUnMatchedBillLineItems(formatExtraBilledItems || []);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch approval status for the bill model
  const getApprovalStatus = useCallback(async () => {
    try {
      const response = await getAssignApprovalApi("bill");
      setIsApproverAvailable(response?.status === 200);
    } finally {
      // Always fetch match results regardless of approval status
      if (idValue) getMatchResults(idValue);
    }
  }, [idValue, getMatchResults]);

  // Fetch bill details and attachment by ID
  const getBillDetailsById = useCallback(
    async (idValue: string) => {
      try {
        const response = await getBillDetailsByIdApi(idValue);
        if (response?.data?.matching_progress === "in_progress") {
          // If matching is still in progress, retry after 1 second
          setTimeout(() => {
            getBillDetailsById(idValue);
          }, 1000);
        } else {
          if (response?.status === 200) {
            if (response?.data?.status === "draft") {
              router.push("/bill/list");
              return;
            }

            setDynamicCrumb("/bill/match", {
              id: response?.data?.id,
              name: response?.data?.bill_number,
            });

            setDynamicCrumb("/approvals/list/review/match", {
              id: response?.data?.id,
              name: response?.data?.bill_number,
            });

            setBillDetails(response?.data);
            getApprovalStatus();
          } else {
            router.push("/bill/list");
          }
        }
      } catch (error) {
        router.push("/bill/list");
      }
    },
    [router, getApprovalStatus, setDynamicCrumb],
  );

  // On mount, fetch bill details or redirect if no ID
  useEffect(() => {
    if (!idValue) {
      router.push("/bill/list");
    } else {
      getBillDetailsById(idValue);
    }
  }, [getBillDetailsById, idValue, router]);

  // Handle sending bill for approval
  const handleSendBillApproval = async () => {
    if (!idValue) return;

    try {
      setIsLoaderFormSubmit(true);
      const response = await sendBillForApprovalApi(idValue);

      if (response?.status === 200) {
        showSuccessToast("Bill sent for approval");
        router.push("/bill/list");
      } else if (response?.data?.detail) {
        showErrorToast(response?.data?.detail);
      }
    } catch (error) {
      showErrorToast("Failed to send bill for approval");
    } finally {
      setIsLoaderFormSubmit(false);
    }
  };
  // Handle bill approval
  const handleBillApprovalRejection = async () => {
    if (!idValue) return;

    try {
      setIsLoaderFormSubmit(true);
      const billData = { status: "approved" };
      const response = await updateBillApi(billData, idValue);

      if (response?.status === 200) {
        showSuccessToast("Bill approved successfully");
        router.push("/bill/list");
      } else if (response?.data?.detail) {
        showErrorToast(response?.data?.detail);
      }
    } catch (error) {
      showErrorToast("Failed to approve bill");
    } finally {
      setIsLoaderFormSubmit(false);
    }
  };

  // Approve bill (for user approval action)
  const handleApprovalAction = async () => {
    setIsLoaderFormSubmit(true);
    const data = {
      action: "approve",
    };
    const response = await acceptRejectBillApi(data, idValue as string);
    if (response?.status === 200) {
      showSuccessToast("Bill approved successfully");
      router.push("/approvals/list/review");
    } else {
      setIsLoaderFormSubmit(false);
    }
  };

  return (
    <>
      <div className="w-full">
        {isLoading ? (
          <PageLoader />
        ) : (
          <>
            <div className="w-3/4">
              <div className="flex items-center gap-1 mb-8">
                {/* Bill number */}
                <p className="text-slate-800 mr-1 text-lg font-semibold">
                  {billDetails?.bill_number}
                </p>

                {/* Bill status label */}
                <span
                  className={`text-2xs border py-1 px-1.5 rounded-md ${getStatusClass(
                    getLabelForBillStatus(billDetails?.status || ""),
                  )}`}
                >
                  {getLabelForBillStatus(billDetails?.status || "")}
                </span>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-5">
                <div>
                  <Label text="Vendor name" />
                  <p className="text-slate-800 text-sm font-medium mb-5">
                    {billDetails?.vendor?.name || "--"}
                  </p>
                </div>

                <div>
                  <Label text="Purchase order" />
                  <p className="text-slate-800 text-sm font-medium mb-5">
                    {billDetails?.purchase_order?.po_number || "--"}
                  </p>
                </div>

                <div>
                  <Label text="Total amount" />
                  <p className="text-slate-800 text-sm font-medium mb-5">
                    {formatNumber(billDetails?.total, orgDetails?.currency)}
                  </p>
                </div>
              </div>
            </div>

            <div className="w-full overflow-x-auto mt-5">
              <div className="w-full overflow-x-auto">
                <div className="flex items-center mb-4">
                  <ToggleSwitch
                    isOn={hideMatchItems}
                    setIsOn={setHideMatchItems}
                  />
                  <p className="whitespace-pre mr-2 ms-1 text-xs text-slate-800 dark:text-gray-200">
                    Hide matched items
                  </p>
                </div>
                <div className="flex h-[calc(100vh-320px)] overflow-auto min-w-[900px] custom_scrollbar">
                  {/* Left: PO Items */}
                  <POItemsTable
                    matchedLineItems={[
                      ...filteredLineItems,
                      ...unMatchedLineItems,
                    ].sort((a, b) =>
                      a.purchase_order_item?.line_number !== undefined &&
                      b.purchase_order_item?.line_number !== undefined
                        ? a.purchase_order_item.line_number -
                          b.purchase_order_item.line_number
                        : 0,
                    )}
                    orgDetails={orgDetails}
                  />

                  {/* Right: Bill Items */}
                  <BillItemsTable
                    matchedLineItems={[
                      ...filteredLineItems,
                      ...unMatchedLineItems,
                      ...unMatchedBillLineItems,
                    ].sort((a, b) =>
                      a.purchase_order_item?.line_number !== undefined &&
                      b.purchase_order_item?.line_number !== undefined
                        ? a.purchase_order_item.line_number -
                          b.purchase_order_item.line_number
                        : 0,
                    )}
                    orgDetails={orgDetails}
                    billDetails={billDetails}
                    triggerGetMatchResults={() =>
                      getMatchResults(idValue || "")
                    }
                  />

                  <div className="w-40">
                    <div className="text-md font-semibold text-slate-700 mb-4 mt-2">
                      <div className="flex items-center opacity-0">
                        <ToggleSwitch
                          isOn={hideMatchItems}
                          setIsOn={setHideMatchItems}
                        />
                        <p className="whitespace-pre mr-2 ms-1 text-xs text-slate-800 dark:text-gray-200">
                          Hide matched items
                        </p>
                      </div>
                    </div>

                    <MatchingStatusTable
                      orgDetails={orgDetails}
                      matchedLineItems={[
                        ...filteredLineItems,
                        ...unMatchedLineItems,
                        ...unMatchedBillLineItems,
                      ].sort((a, b) =>
                        a.purchase_order_item?.line_number !== undefined &&
                        b.purchase_order_item?.line_number !== undefined
                          ? a.purchase_order_item.line_number -
                            b.purchase_order_item.line_number
                          : 0,
                      )}
                    />
                  </div>
                </div>
              </div>
            </div>

            {userDetails?.role === "finance_manager" ? (
              <div className="flex items-center gap-3 w-fit mt-8">
                <Button
                  disabled={isLoaderFormSubmit}
                  text="Approve"
                  onClick={handleApprovalAction}
                  className="text-white whitespace-pre bg-green-500 hover:bg-green-600"
                  isDefault={false}
                  isLoading={isLoaderFormSubmit}
                />
              </div>
            ) : (
              <>
                {billDetails?.status === "in_review" ? (
                  <div className="flex items-center gap-3 w-fit mt-8">
                    {isApproverAvailable ? (
                      <Button
                        disabled={isLoaderFormSubmit}
                        text="Send for approval"
                        onClick={handleSendBillApproval}
                        className="text-white whitespace-pre bg-green-500 hover:bg-green-600"
                        isDefault={false}
                        isLoading={isLoaderFormSubmit}
                      />
                    ) : (
                      <Button
                        disabled={isLoaderFormSubmit}
                        text="Approve"
                        onClick={handleBillApprovalRejection}
                        className="text-white whitespace-pre bg-green-500 hover:bg-green-600"
                        isDefault={false}
                        isLoading={isLoaderFormSubmit}
                      />
                    )}
                  </div>
                ) : null}
              </>
            )}
          </>
        )}
      </div>
    </>
  );
};

export default BillPOMatchUI;
