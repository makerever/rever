// Component to render view bill details

"use client";

import { Button, IconWrapper, PdfViewer } from "@rever/common";
import { Label, CustomTooltip } from "@rever/common";
import { ToggleSwitch } from "@rever/common";
import {
  formatDate,
  getLabelForBillStatus,
  getStatusClass,
  hasPermission,
} from "@rever/utils";
import {
  getCombineAddress,
  // getLabelForBillStatus,
  getLabelForTerm,
  // getStatusClass,
} from "@rever/utils";
import { ViewPODetailsProps } from "@rever/types";
import { SquarePen, Trash } from "lucide-react";
import { useRouter } from "next/navigation";
import POLineItemsReadOnly from "./POLineItemViews";
// import { Button } from "@rever/common";
import { useUserStore } from "@rever/stores";
import Link from "next/link";

// Main component to display bill details in view mode
const ViewPODetails = ({
  poDetails,
  deletePO,
  fileUrl,
  showPdf,
  setShowPdf,
  isLoaderFormSubmit,
  handleRejectPO,
  handleApprovePO,
  isApproverAvailable,
  handleSendPOApproval,
  isUserApproval,
  handleApprovalAction,
  handleRejectionAction,
}: ViewPODetailsProps) => {
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
              {poDetails?.po_number}
            </p>

            {/* Bill status label */}
            <span
              className={`text-2xs border py-1 px-1.5 rounded-md ${getStatusClass(
                getLabelForBillStatus(poDetails?.status || ""),
              )}`}
            >
              {getLabelForBillStatus(poDetails?.status || "")}
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
              {poDetails?.status !== "approved" &&
              poDetails?.status !== "under_approval" ? (
                <div className="flex items-center gap-1">
                  {hasPermission("purchaseorder", "update") ? (
                    <CustomTooltip content="Edit PO">
                      <div>
                        <IconWrapper
                          onClick={() =>
                            router.push(
                              `/purchaseorder/edit/?id=${poDetails.id}&showPdf=${showPdf}`,
                            )
                          }
                          icon={<SquarePen width={16} />}
                        />
                      </div>
                    </CustomTooltip>
                  ) : null}

                  {hasPermission("purchaseorder", "delete") ? (
                    <CustomTooltip content="Delete PO">
                      <div>
                        <IconWrapper
                          onClick={deletePO}
                          icon={<Trash width={16} />}
                          className="hover:bg-red-100 hover:text-red-500"
                        />
                      </div>
                    </CustomTooltip>
                  ) : null}
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
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-5">
              <div>
                <Label text="Vendor name" />
                <p
                  className={`${poDetails?.vendor?.name ? "text-blue-600" : "text-slate-800"} text-sm font-medium mb-5`}
                >
                  {poDetails?.vendor?.name ? (
                    <Link
                      className="hover:underline"
                      href={`/vendor/view?id=${poDetails?.vendor?.id}`}
                    >
                      {poDetails?.vendor?.name}
                    </Link>
                  ) : (
                    "--"
                  )}
                </p>
              </div>
              <div>
                <Label text="PO date" />
                <p className="text-slate-800 text-sm font-medium mb-5">
                  {formatDate(poDetails?.po_date, orgDetails?.date_format)}
                </p>
              </div>
              <div>
                <Label text="Delivery date" />
                <p className="text-slate-800 text-sm font-medium mb-5">
                  {formatDate(
                    poDetails?.delivery_date,
                    orgDetails?.date_format,
                  )}
                </p>
              </div>
              <div>
                <Label text="Vendor address" />
                <p className="text-slate-800 text-sm font-medium mb-5">
                  {getCombineAddress(poDetails?.po_address)}
                </p>
              </div>

              <div>
                <Label text="Payment terms" />
                <p className="text-slate-800 text-sm font-medium mb-5">
                  {getLabelForTerm(poDetails.payment_terms || "")}
                </p>
              </div>

              <div>
                <Label text="Notes" />
                <p className="text-slate-800 text-sm font-medium line-clamp-2 mb-5">
                  {poDetails?.comments || "--"}
                </p>
              </div>
            </div>

            {/* Bill line items table */}
            <div className="mt-8">
              <p className="text-slate-800 mb-6 text-lg font-semibold">
                PO line items
              </p>
              <POLineItemsReadOnly
                poDetails={poDetails}
                poItems={poDetails?.items}
              />
            </div>

            {/* Approval actions for users who can approve/reject */}
            {poDetails?.status === "under_approval" && isUserApproval ? (
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
            {poDetails?.status === "in_review" ? (
              <div className="flex items-center gap-3 w-fit">
                {isApproverAvailable ? (
                  <Button
                    disabled={isLoaderFormSubmit}
                    text="Send for approval"
                    onClick={handleSendPOApproval}
                    className="text-white whitespace-pre bg-green-500 hover:bg-green-600"
                    isDefault={false}
                  />
                ) : (
                  <Button
                    disabled={isLoaderFormSubmit}
                    text="Approve"
                    onClick={handleApprovePO}
                    className="text-white whitespace-pre bg-green-500 hover:bg-green-600"
                    isDefault={false}
                  />
                )}
                <Button
                  disabled={isLoaderFormSubmit}
                  text="Reject"
                  onClick={handleRejectPO}
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

export default ViewPODetails;
