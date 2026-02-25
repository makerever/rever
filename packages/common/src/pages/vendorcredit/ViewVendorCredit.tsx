// Component to render view vendor credit details

"use client";

import {
  AuditHistory,
  PdfViewer,
  PillItem,
  PopupButton,
} from "@rever/common";
import { Label } from "@rever/common";
import { ToggleSwitch } from "@rever/common";
import { checkAuditValidation, deepMatchAuditVersion, formatDate, formatNumber, hasPermission } from "@rever/utils";
import {
  getCombineAddress,
  getLabelForBillStatus,
  getStatusClass,
} from "@rever/utils";
import { VendorCreditAuditValidationType, VendorCreditProps, ViewVendorCreditDetailsProps } from "@rever/types";
import { Ellipsis, FileClock, Pencil, Trash, X } from "lucide-react";
import { useRouter } from "next/navigation";
import VendorCreditLineItemsReadOnly from "./VendorCreditLineItemsView";
import { Button } from "@rever/common";
import { useUserStore } from "@rever/stores";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { getIndividualVendorCreditAuditApi, getVendorCreditAuditHistoryApi } from "@rever/services";
import Link from "next/link";

// Main component to display vendor credit details in view mode
const ViewVendorCreditDetails = ({
  vendorCreditDetails,
  deleteVendorCredit,
  fileUrl,
  showPdf,
  setShowPdf,
  isLoaderFormSubmit,
  handleRejectVendorCredit,
  handleApproveVendorCredit,
  isApproverAvailable,
  handleSendVendorCreditApproval,
  isUserApproval,
  handleApprovalAction,
  handleRejectionAction,
}: ViewVendorCreditDetailsProps) => {
  const router = useRouter();

  const orgDetails = useUserStore((state) => state.user?.organization);

  const [currentVendorCreditDetails, setCurrentVendorCreditDetails] = useState<Partial<VendorCreditProps>>(vendorCreditDetails);
  const [latestVendorCreditDetails, setLatestVendorCreditDetails] = useState<Partial<VendorCreditProps>>(vendorCreditDetails);

  const [auditValidation, setAuditValidation] =
    useState<VendorCreditAuditValidationType | null>(null);

  const [sidePanel, setSidePanel] = useState(false);

  const [auditData, setAuditData] = useState([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAuditLoading, setIsAuditLoading] = useState(false);

  const [showBtnPopup, setShowBtnPopup] = useState<boolean>(false);
  const [showAuditHistory, setShowAuditHistory] = useState<boolean>(false);

  const [auditVersionDate, setAuditVersionDate] = useState<string | null>(null);
  const [currentAuditVersion, setCurrentAuditVersion] = useState<number | null>(null);


  const vendorCreditDetailsSection = useRef<HTMLDivElement | null>(null);
  const vendorCreditLineItemsSection = useRef<HTMLDivElement | null>(null);

  const [vendorCreditDetailsHeight, setVendorCreditDetailsHeight] = useState<number | null>(null);
  const [vendorCreditLineItemsHeight, setVendorCreditLineItemsHeight] = useState<number | null>(null);

  // -------------------- API FUNCTIONS --------------------

  const getVendorCreditAuditHistory = useCallback(async (id: string) => {
    setIsLoading(true);
    setIsAuditLoading(true);
    const response = await getVendorCreditAuditHistoryApi(id);

    if (response?.status === 200) {
      setAuditData(response.data);
      if (response?.data?.length > 0) {
        setCurrentAuditVersion(response.data?.[0]?.history_id ?? null);
        setAuditVersionDate(formatDate(
          response.data?.[0]?.changed_on,
          orgDetails?.date_format,
          undefined,
          false,
          true,
        ) ?? null);
      }
    }
    setIsAuditLoading(false);
    setIsLoading(false);

  }, []);

  const fetchIndividualAuditHistory = useCallback(
    async (historyId: number | null) => {
      if (!latestVendorCreditDetails?.id || !historyId) return;

      const response = await getIndividualVendorCreditAuditApi(
        latestVendorCreditDetails.id,
        historyId
      );

      if (response?.status !== 200) return;

      setCurrentVendorCreditDetails({
        ...response.data,
        id: latestVendorCreditDetails.id,
      });
    },
    [latestVendorCreditDetails?.id]
  );

  //to get current height of credit detials section
  useEffect(() => {
    if (!isLoading) {
      setVendorCreditDetailsHeight(
        vendorCreditDetailsSection?.current?.offsetHeight ?? 0,
      );
    }
  }, [isLoading]);

  // -------------------- LAYOUT UTILS --------------------

  const calculateHeights = useCallback(() => {
    if (!vendorCreditDetailsSection.current || !vendorCreditLineItemsSection.current) return;

    setVendorCreditDetailsHeight(vendorCreditDetailsSection.current.offsetHeight);
    setVendorCreditLineItemsHeight(vendorCreditLineItemsSection.current.offsetHeight);
  }, []);

  // -------------------- EFFECTS --------------------

  /*Initial mount*/
  useEffect(() => {
    setCurrentVendorCreditDetails(vendorCreditDetails);
    setLatestVendorCreditDetails(vendorCreditDetails);
  }, []);

  /*Load audit history when audit panel opens*/
  useEffect(() => {
    if (!showAuditHistory || !currentVendorCreditDetails?.id) return;
    getVendorCreditAuditHistory(currentVendorCreditDetails.id);
  }, [showAuditHistory, currentVendorCreditDetails?.id, getVendorCreditAuditHistory]);

  /*Load selected audit version data*/
  useEffect(() => {
    if (!currentAuditVersion) return;
    fetchIndividualAuditHistory(currentAuditVersion);
  }, [currentAuditVersion, fetchIndividualAuditHistory]);

  /*Recalculate audit validation when data changes*/
  useEffect(() => {
    if (!latestVendorCreditDetails || !currentVendorCreditDetails) return;

    setAuditValidation(
      deepMatchAuditVersion(latestVendorCreditDetails, currentVendorCreditDetails)
    );

    console.log({ latestVendorCreditDetails }, { currentVendorCreditDetails });

  }, [latestVendorCreditDetails, currentVendorCreditDetails]);

  /*Measure heights after audit panel render*/
  useLayoutEffect(() => {
    if (!showAuditHistory || isLoading) return;

    const raf1 = requestAnimationFrame(() => {
      const raf2 = requestAnimationFrame(calculateHeights);
      return () => cancelAnimationFrame(raf2);
    });

    return () => cancelAnimationFrame(raf1);
  }, [showAuditHistory, isLoading, calculateHeights]);

  /*Observe size changes*/
  useEffect(() => {
    if (!vendorCreditDetailsSection.current || !vendorCreditLineItemsSection.current) return;

    const observer = new ResizeObserver(calculateHeights);

    observer.observe(vendorCreditDetailsSection.current);
    observer.observe(vendorCreditLineItemsSection.current);

    return () => observer.disconnect();
  }, [calculateHeights]);

  // -------------------- HANDLERS --------------------

  const handleClickAuditHistoryCard = async (historyId: number) => {
    if (!latestVendorCreditDetails?.id) return;

    const response = await getIndividualVendorCreditAuditApi(
      latestVendorCreditDetails.id,
      historyId
    );

    if (response?.status !== 200) return;

    setCurrentVendorCreditDetails({
      ...response.data,
      id: latestVendorCreditDetails.id,
    });
  };

  const handleCloseAuditHistory = () => {
    setShowAuditHistory(false);
    setIsAuditLoading(false);
    setCurrentVendorCreditDetails(latestVendorCreditDetails);
    setCurrentAuditVersion(null);
    setAuditVersionDate(null);
  };

  const popupButtonItem = [
    {
      name: "Edit vendor credit",
      icon: <Pencil size={16} />,
      isShown: hasPermission("bill", "update") &&
        vendorCreditDetails?.status !== "approved" &&
        vendorCreditDetails?.status !== "under_approval" &&
        vendorCreditDetails?.status !== "posted",
      onClick: () => {
        router.push("/vendorcredit/edit?id=" + vendorCreditDetails?.id);
      },
    },
    {
      name: "Audit history",
      icon: <FileClock width={16} />,
      isShown: true,
      onClick: () => {
        setShowAuditHistory(true);
        setShowBtnPopup(false);
      },
    },
    {
      name: "Delete vendor credit",
      icon: <Trash size={16} />,
      isShown: hasPermission("bill", "delete") &&
        vendorCreditDetails?.status !== "approved" &&
        vendorCreditDetails?.status !== "under_approval" &&
        vendorCreditDetails?.status !== "posted",
      onClick: () => deleteVendorCredit(),
    },
  ];

  const billingAddressField =
    typeof auditValidation?.billing_address === 'object'
      ? Boolean(
        auditValidation?.billing_address?.city &&
        auditValidation?.billing_address?.country &&
        auditValidation?.billing_address?.line1 &&
        auditValidation?.billing_address?.line2 &&
        auditValidation?.billing_address?.state &&
        auditValidation?.billing_address?.zip_code
      )
      : auditValidation?.billing_address;


  return (
    <>
      <div className="bg-white rounded-b-[20px] p-4 pt-16 border border-secondary-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Po number */}
            <p className="text-neutral-1100 font-medium text-2xl">
              {currentVendorCreditDetails?.credit_note_number ?? ""}
            </p>
            {/* PO status label */}
            <PillItem
              className={`${getStatusClass(
                getLabelForBillStatus((showAuditHistory ? currentVendorCreditDetails?.status : latestVendorCreditDetails?.status) || ""),
              )}`}
              isRounded={true}
              name={getLabelForBillStatus((showAuditHistory ? currentVendorCreditDetails?.status : latestVendorCreditDetails?.status) || "")}
            />
            {/* Toggle to show/hide PDF if fileUrl exists */}
            {(fileUrl && !showAuditHistory) && (
              <div className="flex items-center">
                <ToggleSwitch isOn={showPdf} setIsOn={setShowPdf} />
                <p className="ms-2 text-xs text-neutral-1100 dark:text-gray-200">
                  {!showPdf ? "Show pdf" : "Hide pdf"}
                </p>
              </div>
            )}
          </div>
          {/* Dropdown button for actions */}
          <div className="flex items-center justify-center gap-3">
            {/* Approval actions for users who can approve/reject */}
            {(latestVendorCreditDetails?.status !== "draft" && !showAuditHistory) &&
              <>
                {latestVendorCreditDetails?.status === "under_approval" && isUserApproval ? (
                  <div className="flex items-center gap-3 w-fit">
                    <Button
                      name="Approve"
                      onClick={handleApprovalAction}
                      disabled={isLoaderFormSubmit}
                      button_type="primary"
                      icon_type="approve"
                    />
                    <Button
                      name="Reject"
                      onClick={handleRejectionAction}
                      disabled={isLoaderFormSubmit}
                      button_type="danger"
                      icon_type="reject"
                    />
                  </div>
                ) : null}
                {/* Actions for PO in review: send for approval, approve, or reject */}
                {latestVendorCreditDetails?.status === "in_review" ? (
                  <div className="flex items-center gap-3 w-fit">
                    {isApproverAvailable ? (
                      <Button
                        name="Send for approval"
                        onClick={handleSendVendorCreditApproval}
                        disabled={isLoaderFormSubmit}
                        button_type="primary"
                        icon_type="approve"
                      />
                    ) : (
                      <Button
                        name="Approve"
                        onClick={handleApproveVendorCredit}
                        disabled={isLoaderFormSubmit}
                        button_type="primary"
                        icon_type="approve"
                      />
                    )}
                    <Button
                      name="Reject"
                      onClick={handleRejectVendorCredit}
                      disabled={isLoaderFormSubmit}
                      button_type="danger"
                      icon_type="reject"
                    />
                    <div className="h-8 w-px bg-secondary-200"></div>
                  </div>
                ) : null}
              </>
            }
            {/* Edit and Delete icons (not shown for approval users or approved PO) */}
            <div className="flex items-center gap-1">
              {
                !showAuditHistory ?
                  <>
                    <PopupButton
                      btnPopupItems={popupButtonItem}
                      children={
                        <>
                          <button
                            className="popup-btn rounded-[8px] size-8 btn-secondary-outline"
                            onClick={() => {
                              setShowBtnPopup(true);
                            }}
                          >
                            <Ellipsis size={16} />
                          </button>
                        </>
                      }
                      onClose={() => {
                        setShowBtnPopup(false);
                      }}
                      showBtnPopup={showBtnPopup}
                    />
                  </> :
                  <>
                    {
                      auditVersionDate !== "--" &&
                      <div className="font-medium text-neutral-1100 text-sm flex items-center justify-end gap-3">
                        <p>
                          <span>You are viewing </span>
                          {auditVersionDate}
                          <span> version</span>
                        </p>
                        <div
                          className="popup-btn rounded-[8px] size-8 btn-secondary-outline"
                          onClick={handleCloseAuditHistory}
                        >
                          <X width={16} />
                        </div>
                      </div>
                    }
                  </>
              }
            </div>
          </div>
        </div>
      </div>

      <div className="lg:flex">
        <div
          className={(fileUrl && showPdf) || showAuditHistory ? "lg:w-[70%]" : "w-full"}
        >
          <div
            ref={vendorCreditDetailsSection}
            className={`border border-secondary-200 rounded-[20px] bg-white p-4`}
          >
            <p className="text-neutral-1100 text-xl mb-5 font-medium">
              Vendor credit details
            </p>
            <div className="grid grid-cols-1 gap-x-5">
              <div className="flex flex-row items-center border-b border-secondary-200 pb-3">
                <Label
                  text="Vendor:"
                  className="max-w-60 w-full text-secondary-700 mb-0 font-medium"
                />
                <p className="text-neutral-1100 text-sm font-medium">
                  {currentVendorCreditDetails?.vendor?.name ? (
                    <Link
                      className={`underline text-blue-500 ${checkAuditValidation({ showAuditHistory, field: typeof auditValidation?.vendor === "object" ? auditValidation?.vendor?.name : auditValidation?.vendor })}`}
                      href={`/vendor/view?id=${currentVendorCreditDetails?.vendor?.id}`}
                    >
                      {currentVendorCreditDetails?.vendor?.name}
                    </Link>
                  ) : (
                    "--"
                  )}
                </p>
              </div>

              <div className="flex flex-row items-center border-b border-secondary-200 py-3">
                <Label
                  text="Vendor credit date:"
                  className="max-w-60 w-full text-secondary-700 mb-0 font-medium"
                />
                <p className={`text-neutral-1100 text-sm ${checkAuditValidation({ showAuditHistory, field: auditValidation?.txn_date })}`}>
                  {formatDate(
                    currentVendorCreditDetails?.txn_date,
                    orgDetails?.date_format,
                  )}
                </p>
              </div>

              <div className="flex flex-row items-center py-3">
                <Label
                  text="Vendor address:"
                  className="max-w-60 w-full text-secondary-700 mb-0 font-medium"
                />
                <p className={`text-neutral-1100 text-sm ${checkAuditValidation({ showAuditHistory, field: billingAddressField })}`}>
                  {getCombineAddress(currentVendorCreditDetails?.billing_address)}
                </p>
              </div>
            </div>
          </div>

          <div
            ref={vendorCreditLineItemsSection}
            className={`rounded-[20px] bg-white p-4 border border-secondary-200`}
            style={{
              minHeight: `calc(100vh - 10rem - ${vendorCreditDetailsHeight ?? 0}px - 2px)`, //is for mesh UI - border 1px y-axis, padding 1px y-axis
            }}
          >
            <p className="text-neutral-1100 text-xl font-medium mb-5">
              Vendor credit line items
            </p>

            <VendorCreditLineItemsReadOnly
              vendorCreditDetails={currentVendorCreditDetails}
              vendorCreditItems={currentVendorCreditDetails?.items}
              showAuditHistory={showAuditHistory}
              itemsAuditValidation={showAuditHistory ? auditValidation?.items : [true]}
            />

            <div className="mt-5 flex items-start justify-between">
              <div className="w-full flex flex-col">
                {/* Reject remarks */}
                {
                  !showAuditHistory &&
                  <>
                    {
                      currentVendorCreditDetails?.reject_reason !== null &&
                      <div className="mb-4">
                        <Label
                          text="Rejection reason:"
                          className="max-w-60 w-full text-secondary-700 mb-0 font-medium"
                        />
                        <p className={`text-neutral-1100 text-sm ${checkAuditValidation({ showAuditHistory, field: auditValidation?.reject_reason })}`}>
                          {currentVendorCreditDetails?.reject_reason || "--"}
                        </p>
                      </div>
                    }
                  </>
                }
                {/* Notes */}
                <div className="">
                  <Label
                    text="Notes:"
                    className="max-w-60 w-full text-secondary-700 mb-0 font-medium"
                  />
                  <p className={`text-neutral-1100 text-sm ${checkAuditValidation({ showAuditHistory, field: auditValidation?.notes })}`}>
                    {currentVendorCreditDetails?.notes || "--"}
                  </p>
                </div>
              </div>

              {/* Credit Details Summary */}
              <div className="flex justify-end">
                <div className="p-4 w-72 font-medium text-sm bg-secondary-100 rounded-[20px]">
                  <div className="grid grid-cols-2">
                    <p className="text-neutral-1100">Sub total:</p>
                    <p className={`text-neutral-1100 text-sm text-right ${checkAuditValidation({ showAuditHistory, field: auditValidation?.sub_total })}`}>
                      {formatNumber(
                        currentVendorCreditDetails?.sub_total || 0,
                        orgDetails?.currency,
                      )}
                    </p>
                  </div>
                  <div className="grid items-center grid-cols-2 pb-2 mt-4 mb-2">
                    <div>
                      <p className="text-neutral-1100">Total tax:</p>
                      <span className={`text-neutral-1100 text-xs ${checkAuditValidation({ showAuditHistory, field: auditValidation?.total_tax })}`}>
                        {formatNumber(
                          currentVendorCreditDetails?.total_tax || 0,
                          orgDetails?.currency,
                        )}
                      </span>
                    </div>
                    <div className={`text-neutral-1100 text-sm text-right ${checkAuditValidation({ showAuditHistory, field: auditValidation?.sub_total })}`}>
                      {currentVendorCreditDetails?.tax_percentage || 0}%
                    </div>
                  </div>
                  <div className="grid grid-cols-2 font-semibold">
                    <p className="text-neutral-1100">Grand total:</p>
                    <p className={`text-neutral-1100 text-sm text-right ${checkAuditValidation({ showAuditHistory, field: auditValidation?.sub_total })}`}>
                      {formatNumber(
                        currentVendorCreditDetails?.total || 0,
                        orgDetails?.currency,
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {fileUrl && showPdf && (
          <div className="relative lg:w-[30%] scrollbar_none rounded-[20px] bg-white border border-secondary-200 overflow-hidden">
            <p className="p-4 mb-4 pb-0 text-neutral-1100 text-xl font-medium">
              Bill Preview
            </p>

            <PdfViewer fileUrl={fileUrl} />
          </div>
        )}
        {showAuditHistory && (
          <div
            className={`relative overflow-y-scroll lg:w-[30%] scrollbar_none rounded-[20px] bg-white border border-secondary-200`}
            style={{
              maxHeight: `calc(${vendorCreditDetailsHeight ?? 0}px + ${vendorCreditLineItemsHeight ?? 0}px - 0.5px)`, //is for mesh UI - border 1px y-axis, padding 1px y-axis
            }}
          >
            <AuditHistory
              data={auditData}
              isLoading={isLoading || isAuditLoading}
              setAuditVersionDate={setAuditVersionDate}
              currentVersion={currentAuditVersion}
              setCurrentVersion={setCurrentAuditVersion}
              handleClickAuditHistoryCard={handleClickAuditHistoryCard}
            />
          </div>
        )}
      </div>
    </>
  );
};

export default ViewVendorCreditDetails;