// Component for bill matching interface

"use client";

import { useCallback, useEffect, useState, useMemo, memo } from "react";
import {
  Button,
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
  MatchedLineItem,
  MatchStatus,
  OrgDetails,
  PurchaseOrderItem,
  TooltipSide,
  UnmatchedLineItem,
} from "@rever/types";
import {
  acceptRejectBillApi,
  getAssignApprovalApi,
  getBillDetailsByIdApi,
  getMatchResultsApi,
  sendBillForApprovalApi,
  updateBillApi,
} from "@rever/services";
import { useRouter, useSearchParams } from "next/navigation";
import {
  cn,
  formatNumber,
  getLabelForBillStatus,
  getStatusClass,
} from "@rever/utils";
import { billMatchHeaders, poMatchHeaders } from "@rever/constants";
import { useBreadcrumbStore, useUserStore } from "@rever/stores";
import { BadgeAlert, BadgeCheck, TriangleAlert } from "lucide-react";

// Status icon component to reduce repetition
const StatusIcon = memo(
  ({
    status,
    tooltipContent,
  }: {
    status: MatchStatus | null;
    tooltipContent: string;
    side?: TooltipSide;
  }) => {
    const getIconByStatus = () => {
      switch (status) {
        case "matched":
          return <BadgeCheck className="text-green-600" width={16} />;
        case "mismatched":
          return <BadgeAlert className="text-red-500" width={16} />;
        case "partial":
          return <BadgeAlert className="text-yellow-500" width={16} />;
        default:
          return null;
      }
    };

    return status ? (
      <CustomTooltip content={tooltipContent} side="right">
        <div className="w-fit">{getIconByStatus()}</div>
      </CustomTooltip>
    ) : null;
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
      <table className="table-fixed w-full text-left border-r">
        <colgroup>
          <col className="w-[30px]" />
          <col className="w-[35%]" />
          <col className="w-[20%]" />
          <col className="w-[20%]" />
          <col className="w-[20%]" />
        </colgroup>

        <thead className="bg-gray-50">
          <tr>
            {poMatchHeaders.map((h, i) => (
              <th
                key={i}
                className={cn(
                  "text-xs pr-4 py-3 font-medium text-slate-500 whitespace-nowrap",
                  i === 0 ? "ps-2 w-[30px]" : "",
                )}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>

        <tbody className="border-b">
          {matchedLineItems.length > 0 ? (
            matchedLineItems.map((poItem, index) => {
              const item = poItem?.purchase_order_item;
              const qty = Number(item.quantity) || 0;
              const unitPrice = Number(item.unit_price) || 0;
              const amount = qty * unitPrice;

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
                  className="border-t text-xs text-slate-800 hover:bg-slate-50"
                >
                  <td className="p-2.5">{index + 1}</td>
                  <td className="p-1 ps-0 grid items-center h-[60px] m-1 overflow-auto scrollbar_none">
                    <div className="flex items-center gap-1">
                      {item.description || "-"}
                    </div>
                  </td>
                  <td className="py-1">
                    <div
                      className={`p-1 rounded-md w-fit ${matchedItem?.quantity_status ? "" : "border border-transparent"}`}
                    >
                      {item.quantity}
                    </div>
                  </td>
                  <td className="py-1">
                    <div
                      className={`p-1 rounded-md w-fit ${matchedItem?.unit_price_status ? "" : ""}`}
                    >
                      {formatNumber(item.unit_price, orgDetails?.currency)}
                    </div>
                  </td>
                  <td className="py-1">
                    <div
                      className={`p-1 rounded-md w-fit ${matchedItem?.quantity_status && matchedItem?.unit_price_status ? "" : "border border-transparent"}`}
                    >
                      {formatNumber(amount, orgDetails?.currency)}
                    </div>
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
const BillItemsTable = memo(
  ({
    matchedLineItems,
    orgDetails,
  }: {
    matchedLineItems: MatchedLineItem[];
    orgDetails: OrgDetails | undefined;
  }) => (
    <div className="w-1/2">
      <h3 className="ps-4 text-md font-semibold text-slate-700 mb-4">
        Bill items
      </h3>
      <table className="table-fixed w-full text-left border-r">
        <colgroup>
          <col className="w-[35%]" />
          <col className="w-[20%]" />
          <col className="w-[20%]" />
          <col className="w-[20%]" />
        </colgroup>

        <thead className="bg-gray-50">
          <tr>
            {billMatchHeaders.map((h, i) => (
              <th
                key={i}
                className={cn(
                  "text-xs py-3 font-medium text-slate-500 whitespace-nowrap",
                  i === 0 ? "ps-4" : "pr-2",
                )}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>

        <tbody className="border-b">
          {matchedLineItems.length > 0 ? (
            matchedLineItems.map((billItem, index) => {
              const item = billItem?.bill_item;
              if (!item) return null;

              const qty = Number(item.quantity) || 0;
              const unitPrice = Number(item.unit_price) || 0;
              const amount = qty * unitPrice;

              return (
                <tr
                  key={index}
                  className="border-t text-xs text-slate-800 hover:bg-slate-50"
                >
                  <td className="p-1 ps-2 grid items-center h-[60px] m-1 overflow-auto scrollbar_none">
                    <div
                      className={`flex items-center gap-2 p-1 rounded-md w-fit ${billItem?.description_status !== "mismatched" ? "" : "text-red-500"}`}
                    >
                      {item.description || "-"}
                    </div>
                  </td>
                  <td className="py-1">
                    <div
                      className={`p-1 rounded-md w-fit ${billItem?.quantity_status ? "" : "border border-red-500 text-red-500"}`}
                    >
                      {item.quantity}
                    </div>
                  </td>
                  <td className="py-1">
                    <div
                      className={`p-1 rounded-md w-fit ${billItem?.unit_price_status ? "" : "border border-red-500 text-red-500"}`}
                    >
                      {formatNumber(item.unit_price, orgDetails?.currency)}
                    </div>
                  </td>
                  <td className="py-1">
                    <div
                      className={`p-1 rounded-md w-fit ${billItem?.quantity_status && billItem?.unit_price_status ? "" : "border border-red-500 text-red-500"}`}
                    >
                      {formatNumber(amount, orgDetails?.currency)}
                    </div>
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
                No Bill items to display.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  ),
);

// Matching Status Table component
const MatchingStatusTable = memo(
  ({ matchedLineItems }: { matchedLineItems: MatchedLineItem[] }) => (
    <div>
      <table className="table-fixed w-full text-left">
        <colgroup>
          <col className="w-2/12" />
        </colgroup>

        <thead className="bg-gray-50">
          <tr>
            <th className="ps-4 pr-2 py-3 text-xs font-medium text-slate-500 whitespace-nowrap">
              Matching status
            </th>
          </tr>
        </thead>

        <tbody className="border-b">
          {matchedLineItems.length > 0 ? (
            matchedLineItems.map((item, index) => {
              return (
                <tr
                  key={index}
                  className="border-t text-xs text-slate-800 hover:bg-slate-50"
                >
                  <td className="p-3 ps-4 grid items-center h-[60px] m-1">
                    <StatusIcon
                      status={item?.overall_status || null}
                      tooltipContent={
                        item?.overall_status === "matched"
                          ? "Matched"
                          : item?.overall_status === "mismatched"
                            ? "Mismatched"
                            : item?.overall_status === "partial"
                              ? "Partial matched"
                              : ""
                      }
                      side={
                        item?.overall_status === "mismatched" ? "right" : "top"
                      }
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
      (item) => item?.overall_status !== "matched",
    );
  }, [matchedLineItems, hideMatchItems]);

  // Fetch match results for a bill
  const getMatchResults = useCallback(async (id: string) => {
    try {
      const response = await getMatchResultsApi(id);
      if (response?.status === 200) {
        setMatchedLineItems(response?.data?.billed || []);
        const formatUnbilledData: UnmatchedLineItem[] =
          response?.data?.Unbilled?.map((v: PurchaseOrderItem) => {
            return {
              purchase_order_item: v,
            };
          });
        setUnMatchedLineItems(formatUnbilledData || []);
        const formatExtraBilledItems: UnmatchedLineItem[] =
          response?.data?.extra_bill_items?.map((v: BillItem) => {
            return {
              bill_item: v,
            };
          });
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
      router.push("/approvals/list/review");
      showSuccessToast("Bill approved successfully");
      setIsLoaderFormSubmit(false);
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

            <div className="w-full overflow-x-auto mt-8">
              <div className="w-full overflow-x-auto">
                <div className="flex h-[calc(100vh-300px)] overflow-auto min-w-[900px] custom_scrollbar">
                  {/* Left: PO Items */}
                  <POItemsTable
                    matchedLineItems={[
                      ...filteredLineItems,
                      ...unMatchedLineItems,
                    ]}
                    orgDetails={orgDetails}
                  />

                  {/* Right: Bill Items */}
                  <BillItemsTable
                    matchedLineItems={[
                      ...filteredLineItems,
                      ...unMatchedBillLineItems,
                    ]}
                    orgDetails={orgDetails}
                  />

                  <div className="w-52">
                    <div className="ps-4 text-md font-semibold text-slate-700 mb-4 mt-2">
                      <div className="flex items-center">
                        <ToggleSwitch
                          isOn={hideMatchItems}
                          setIsOn={setHideMatchItems}
                        />
                        <p className="ms-2 text-xs text-slate-800 dark:text-gray-200">
                          Hide matched items
                        </p>
                      </div>
                    </div>

                    <MatchingStatusTable matchedLineItems={filteredLineItems} />
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
                      />
                    ) : (
                      <Button
                        disabled={isLoaderFormSubmit}
                        text="Approve"
                        onClick={handleBillApprovalRejection}
                        className="text-white whitespace-pre bg-green-500 hover:bg-green-600"
                        isDefault={false}
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
