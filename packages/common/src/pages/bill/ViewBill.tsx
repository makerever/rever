// Component to render view bill details

"use client";

import {
  AuditHistory,
  CustomTooltip,
  IconWrapper,
  PdfViewer,
  SidePanel,
} from "@rever/common";
import { Label } from "@rever/common";
import { ToggleSwitch } from "@rever/common";
import { formatDate } from "@rever/utils";
import {
  getCombineAddress,
  getLabelForBillStatus,
  getLabelForTerm,
  getStatusClass,
} from "@rever/utils";
import { ViewBillDetailsProps } from "@rever/types";
import { FileCheck2, FileClock, SquarePen, Trash, X } from "lucide-react";
import { useRouter } from "next/navigation";
import BillLineItemsReadOnly from "./BillLineItemViews";
import { Button } from "@rever/common";
import { useUserStore } from "@rever/stores";
import { useCallback, useEffect, useState } from "react";
import { getBillAuditHistoryApi } from "@rever/services";
import Link from "next/link";

// Main component to display bill details in view mode
const ViewBillDetails = ({
  billDetails,
  deleteBill,
  fileUrl,
  showPdf,
  setShowPdf,
  isLoaderFormSubmit,
  handleRejectBill,
  handleApproveBill,
  isApproverAvailable,
  handleSendBillApproval,
  isUserApproval,
  handleApprovalAction,
  handleRejectionAction,
}: ViewBillDetailsProps) => {
  const router = useRouter();

  const orgDetails = useUserStore((state) => state.user?.organization);
  const [sidePanel, setSidePanel] = useState(false);

  const [auditData, setAuditData] = useState([]);

  const getBillAuditHistory = useCallback(async (id: number) => {
    const response = await getBillAuditHistoryApi(id);
    if (response?.status === 200) {
      setAuditData(response?.data);
    }
  }, []);

  useEffect(() => {
    if (billDetails?.id) {
      getBillAuditHistory(billDetails.id);
    }
  }, [billDetails?.id, getBillAuditHistory]);

  return (
    <>
      <div className="flex lg:gap-8">
        <div>
          {/* Header section: Bill number, status, PDF toggle, edit/delete icons */}
          <div
            className={`flex items-center justify-between mb-8 ${
              showPdf && fileUrl ? "w-full" : "w-3/4"
            }`}
          >
            <div className="flex items-center gap-1">
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

              {/* Toggle to show/hide PDF if fileUrl exists */}
              {fileUrl ? (
                <div className="ms-4 flex items-center">
                  <ToggleSwitch isOn={showPdf} setIsOn={setShowPdf} />
                  <p className="ms-2 text-xs text-slate-800 dark:text-gray-200">
                    {!showPdf ? "Show pdf" : "Hide pdf"}
                  </p>
                </div>
              ) : null}
            </div>

            <div className="flex items-center gap-1">
              <CustomTooltip content="Audit history">
                <div>
                  <IconWrapper
                    onClick={() => setSidePanel(true)}
                    icon={<FileClock width={16} />}
                  />
                </div>
              </CustomTooltip>

              {/* Edit and Delete icons (not shown for approval users or approved bills) */}
              {!isUserApproval ? (
                <>
                  {billDetails?.status !== "approved" &&
                  billDetails?.status !== "under_approval" ? (
                    <div className="flex items-center gap-1">
                      <>
                        <CustomTooltip content="Edit bill">
                          <div>
                            <IconWrapper
                              onClick={() =>
                                router.push(
                                  `/bill/edit/?id=${billDetails.id}&showPdf=${showPdf}`,
                                )
                              }
                              icon={<SquarePen width={16} />}
                            />
                          </div>
                        </CustomTooltip>
                        <CustomTooltip content="Delete bill">
                          <div>
                            <IconWrapper
                              onClick={deleteBill}
                              icon={<Trash width={16} />}
                              className="hover:bg-red-100 hover:text-red-500"
                            />
                          </div>
                        </CustomTooltip>
                      </>
                    </div>
                  ) : null}
                </>
              ) : null}
            </div>
          </div>

          <div className="lg:flex lg:gap-8">
            {/* PDF preview section (if enabled) */}
            {fileUrl && showPdf ? (
              <div className="lg:w-2/5">
                <div
                  // style={{ height: "580px" }}
                  className="scrollbar_none overflow-auto bg-white shadow-5xl rounded-md overflow-hidden"
                >
                  <PdfViewer fileUrl={fileUrl} />
                </div>
              </div>
            ) : null}

            {/* Bill details section */}
            <div
              className={
                fileUrl && showPdf ? "lg:w-3/5 mt-8 lg:mt-0" : "lg:w-3/4"
              }
            >
              {/* Vendor, bill date, due date */}
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-5">
                <div>
                  <Label text="Vendor name" />
                  <p className="text-blue-600 text-sm font-medium mb-5">
                    {billDetails?.vendor?.name ? (
                      <Link
                        className="hover:underline"
                        href={`/vendor/view?id=${billDetails?.vendor?.id}`}
                      >
                        {billDetails?.vendor?.name}
                      </Link>
                    ) : (
                      "--"
                    )}
                  </p>
                </div>
                <div>
                  <Label text="Bill date" />
                  <p className="text-slate-800 text-sm font-medium mb-5">
                    {formatDate(
                      billDetails?.bill_date,
                      orgDetails?.date_format,
                    )}
                  </p>
                </div>
                <div>
                  <Label text="Due date" />
                  <p className="text-slate-800 text-sm font-medium mb-5">
                    {formatDate(billDetails?.due_date, orgDetails?.date_format)}
                  </p>
                </div>
                <div>
                  <Label text="Purchase order" />
                  <p className="text-blue-600 text-sm font-medium mb-5">
                    {billDetails?.purchase_order?.po_number ? (
                      <Link
                        className="hover:underline"
                        href={`/purchaseorder/view?id=${billDetails?.purchase_order?.id}`}
                      >
                        {billDetails?.purchase_order?.po_number}
                      </Link>
                    ) : (
                      "--"
                    )}
                  </p>
                </div>
                <div>
                  <Label text="Payment terms" />
                  <p className="text-slate-800 text-sm font-medium mb-5">
                    {getLabelForTerm(billDetails.payment_terms || "")}
                  </p>
                </div>

                <div>
                  <Label text="Notes" />
                  <p className="text-slate-800 text-sm font-medium line-clamp-2 mb-5">
                    {billDetails?.comments || "--"}
                  </p>
                </div>
              </div>

              {/* Vendor address */}
              <div className="grid lg:grid-cols-3 gap-x-5">
                <div>
                  <Label text="Vendor address" />
                  <p className="text-slate-800 text-sm font-medium">
                    {getCombineAddress(billDetails?.billing_address)}
                  </p>
                </div>
              </div>

              {/* Bill line items table */}
              <div className="mt-8">
                <p className="text-slate-800 mb-6 text-lg font-semibold">
                  Bill line items
                </p>
                <BillLineItemsReadOnly
                  billDetails={billDetails}
                  billItems={billDetails?.items}
                />
              </div>

              {/* Approval actions for users who can approve/reject */}
              {billDetails?.status === "under_approval" && isUserApproval ? (
                <div className="flex items-center gap-3 w-fit">
                  <Button
                    disabled={isLoaderFormSubmit}
                    text="View match"
                    onClick={() =>
                      router.push(
                        `/approvals/list/review/match?id=${billDetails?.id}`,
                      )
                    }
                    className="text-white whitespace-pre bg-green-500 hover:bg-green-600"
                    isDefault={false}
                  />

                  <Button
                    disabled={isLoaderFormSubmit}
                    text="Reject"
                    onClick={handleRejectionAction}
                    className="text-white bg-red-500 hover:bg-red-600"
                  />
                </div>
              ) : null}

              {/* Actions for bills in review: send for approval, approve, or reject */}

              {billDetails?.status !== "draft" && (
                <div className="flex items-center gap-3 w-fit">
                  {isApproverAvailable ? (
                    <>
                      {/* Approver is available */}
                      {orgDetails?.matching_type !== "none" ? (
                        <Button
                          disabled={isLoaderFormSubmit}
                          text="View match"
                          onClick={() =>
                            router.push(`/bill/match?id=${billDetails?.id}`)
                          }
                          className="text-white whitespace-pre bg-green-500 hover:bg-green-600"
                          isDefault={false}
                        />
                      ) : billDetails?.status === "in_review" ? (
                        <Button
                          disabled={isLoaderFormSubmit}
                          text="Send for approval"
                          onClick={handleSendBillApproval}
                          className="text-white whitespace-pre bg-green-500 hover:bg-green-600"
                          isDefault={false}
                        />
                      ) : null}
                    </>
                  ) : (
                    <>
                      {/* Approver not available */}
                      {!isUserApproval && (
                        <>
                          {orgDetails?.matching_type === "none" ? (
                            billDetails?.status === "in_review" && (
                              <Button
                                disabled={isLoaderFormSubmit}
                                text="Approve"
                                onClick={handleApproveBill}
                                className="text-white whitespace-pre bg-green-500 hover:bg-green-600"
                                isDefault={false}
                              />
                            )
                          ) : (
                            <Button
                              disabled={isLoaderFormSubmit}
                              text="View match"
                              onClick={() =>
                                router.push(`/bill/match?id=${billDetails?.id}`)
                              }
                              className="text-white whitespace-pre bg-green-500 hover:bg-green-600"
                              isDefault={false}
                            />
                          )}
                        </>
                      )}
                    </>
                  )}

                  {/* Reject button shown to everyone if status is in_review */}
                  {billDetails?.status === "in_review" && (
                    <Button
                      disabled={isLoaderFormSubmit}
                      text="Reject"
                      onClick={handleRejectBill}
                      className="text-white bg-red-500 hover:bg-red-600"
                    />
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <SidePanel isOpen={sidePanel} onClose={() => setSidePanel(false)}>
        <div className="p-6">
          <div className="flex justify-between items-center">
            <p className="text-slate-800 text-lg font-semibold">
              Audit history
            </p>
            <IconWrapper
              onClick={() => setSidePanel(false)}
              icon={<X width={16} />}
            />
          </div>

          <AuditHistory data={auditData} />
        </div>
      </SidePanel>
    </>
  );
};

export default ViewBillDetails;
