// Component for bill matching interface

"use client";

import { useCallback, useEffect, useState, useMemo, memo } from "react";
import {
  Button,
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
  PurchaseOrderItem,
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
import { useBreadcrumbStore, useUserStore } from "@rever/stores";
import POItemsTable from "./billMatch/POItemsTable";
import BillItemsTable from "./billMatch/BillItemsTable";
import MatchingStatusTable from "./billMatch/MatchStatusTable";

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
