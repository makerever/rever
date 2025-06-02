// Component to render view bill details

"use client";

import { IconWrapper, PdfViewer } from "@rever/common";
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
import { SquarePen, Trash } from "lucide-react";
import { useRouter } from "next/navigation";
import BillLineItemsReadOnly from "./BillLineItemViews";
import { Button } from "@rever/common";
import { useUserStore } from "@rever/stores";

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

  return (
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

          {/* Edit and Delete icons (not shown for approval users or approved bills) */}
          {!isUserApproval ? (
            <>
              {billDetails?.status !== "approved" &&
              billDetails?.status !== "under_approval" ? (
                <div className="flex items-center gap-1">
                  <IconWrapper
                    onClick={() =>
                      router.push(
                        `/bill/edit/?id=${billDetails.id}&showPdf=${showPdf}`,
                      )
                    }
                    icon={<SquarePen width={16} />}
                  />
                  <IconWrapper
                    onClick={deleteBill}
                    icon={<Trash width={16} />}
                    className="hover:bg-red-100 hover:text-red-500"
                  />
                </div>
              ) : null}
            </>
          ) : null}
        </div>

        <div className="lg:flex lg:gap-8">
          {/* PDF preview section (if enabled) */}
          {fileUrl && showPdf ? (
            <div className="lg:w-2/5 bg-white shadow-5xl rounded-md overflow-hidden">
              <div
                // style={{ height: "580px" }}
                className="scrollbar_none overflow-auto"
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
            <div className="grid lg:grid-cols-3">
              <div>
                <Label text="Vendor name" />
                <p className="text-slate-800 text-sm font-medium">
                  {billDetails?.vendor?.name}
                </p>
              </div>
              <div>
                <Label text="Bill date" />
                <p className="text-slate-800 text-sm font-medium">
                  {formatDate(billDetails?.bill_date, orgDetails?.date_format)}
                </p>
              </div>
              <div>
                <Label text="Due date" />
                <p className="text-slate-800 text-sm font-medium">
                  {formatDate(billDetails?.due_date, orgDetails?.date_format)}
                </p>
              </div>
            </div>

            {/* Payment terms and vendor address */}
            <div className="grid lg:grid-cols-3 mt-5">
              <div>
                <Label text="Payment terms" />
                <p className="text-slate-800 text-sm font-medium">
                  {getLabelForTerm(billDetails.payment_terms || "")}
                </p>
              </div>

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
                  text="Approve"
                  isDefault={false}
                  onClick={handleApprovalAction}
                  className="text-white whitespace-pre bg-green-500 hover:bg-green-600"
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
            {billDetails?.status === "in_review" ? (
              <div className="flex items-center gap-3 w-fit">
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
                    onClick={handleApproveBill}
                    className="text-white whitespace-pre bg-green-500 hover:bg-green-600"
                    isDefault={false}
                  />
                )}
                <Button
                  disabled={isLoaderFormSubmit}
                  text="Reject"
                  onClick={handleRejectBill}
                  className="text-white bg-red-500 hover:bg-red-600"
                />
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewBillDetails;
