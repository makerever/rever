// Component to render view bill details

"use client";

import {
  AuditHistory,
  DuplicateFlag,
  Modal,
  PageLoader,
  PdfViewer,
  PillItem,
  PopupButton,
  RequestConfirmationModal,
  SidePanel,
  VersionHistory,
} from "@rever/common";
import { Label } from "@rever/common";
import { ToggleSwitch } from "@rever/common";
import { deepMatchAuditVersion, formatDate, formatNumber, hasPermission } from "@rever/utils";
import {
  getCombineAddress,
  getLabelForBillStatus,
  getLabelForTerm,
  getStatusClass,
  checkAuditValidation
} from "@rever/utils";
import {
  Bill,
  BillAuditValidationType,
  // BillAuditValidationType, 
  ViewBillDetailsProps
} from "@rever/types";
import {
  Ellipsis,
  FileCheck,
  FileClock,
  Pencil,
  Trash,
  UserRoundPlus,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import BillLineItemsReadOnly from "./BillLineItemViews";
import { Button } from "@rever/common";
import { useUserStore } from "@rever/stores";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  getBillAuditHistoryApi,
  getIndividualBillAuditApi,
  getRequestConfirmationHistoryApi,
} from "@rever/services";
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
  // -------------------- STATE --------------------

  const router = useRouter();
  const orgDetails = useUserStore((state) => state.user?.organization);

  const [currentBillDetails, setCurrentBillDetails] = useState<Partial<Bill>>(billDetails);
  const [latestBillDetials, setLatestBillDetails] = useState<Partial<Bill>>(billDetails);

  const [auditValidation, setAuditValidation] =
    useState<BillAuditValidationType | null>(null);

  const [auditData, setAuditData] = useState([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAuditLoading, setIsAuditLoading] = useState(false);

  const [versionHistorySidePanel, setVersionHistorySidePanel] = useState(false);
  const [reqConfirmationModal, setReqConfirmationModal] = useState(false);

  const [confirmationHistoryList, setConfirmationHistoryList] = useState([]);

  const [showBtnPopup, setShowBtnPopup] = useState<boolean>(false);
  const [showAuditHistory, setShowAuditHistory] = useState<boolean>(false);

  const [auditVersionDate, setAuditVersionDate] = useState<string | null>(null);
  const [currentAuditVersion, setCurrentAuditVersion] = useState<number | null>(null);

  const billDetailsSection = useRef<HTMLDivElement | null>(null);
  const billLineItemsSection = useRef<HTMLDivElement | null>(null);

  const [billLineItemsHeight, setBillLineItemsHeight] = useState<number | null>(null);
  const [billDetailsHeight, setBillDetailsHeight] = useState<number | null>(null);

  // -------------------- API FUNCTIONS --------------------

  const getBillAuditHistory = useCallback(async (id: number) => {
    setIsLoading(true);
    setIsAuditLoading(true);
    const response = await getBillAuditHistoryApi(id);

    if (response?.status === 200) {
      setAuditData(response.data);
      setCurrentAuditVersion(response.data?.[0]?.history_id ?? null);
      setAuditVersionDate(formatDate(
        response.data?.[0]?.changed_on,
        orgDetails?.date_format,
        undefined,
        false,
        true,
      ) ?? null);
    }
    setIsAuditLoading(false);
    setIsLoading(false);
  }, []);

  const fetchIndividualAuditHistory = useCallback(
    async (historyId: number | null) => {
      if (!latestBillDetials?.id || !historyId) return;

      const response = await getIndividualBillAuditApi(
        latestBillDetials.id,
        historyId
      );

      if (response?.status !== 200) return;

      setCurrentBillDetails({
        ...response.data,
        id: latestBillDetials.id,
      });
      setIsAuditLoading(false);
    },
    [latestBillDetials?.id]
  );

  const getRequestConfirmationHistory = useCallback(async () => {
    if (!currentBillDetails?.id) return;

    const response = await getRequestConfirmationHistoryApi(
      String(currentBillDetails.id)
    );

    if (response?.status === 200) {
      setConfirmationHistoryList(response.data);
    } else {
      setConfirmationHistoryList([]);
    }
  }, [currentBillDetails?.id]);

  // -------------------- LAYOUT UTILS --------------------

  const calculateHeights = useCallback(() => {
    if (!billDetailsSection.current || !billLineItemsSection.current) return;

    setBillDetailsHeight(billDetailsSection.current.offsetHeight);
    setBillLineItemsHeight(billLineItemsSection.current.offsetHeight);
  }, []);

  // -------------------- EFFECTS --------------------

  /*Initial mount*/
  useEffect(() => {
    setCurrentBillDetails(billDetails);
    setLatestBillDetails(billDetails);
    getRequestConfirmationHistory();
  }, []);

  /*Load audit history when audit panel opens*/
  useEffect(() => {
    if (!showAuditHistory || !currentBillDetails?.id) return;
    getBillAuditHistory(currentBillDetails.id);
  }, [showAuditHistory, currentBillDetails?.id, getBillAuditHistory]);

  /*Load selected audit version data*/
  useEffect(() => {
    if (!currentAuditVersion) return;
    fetchIndividualAuditHistory(currentAuditVersion);
  }, [currentAuditVersion, fetchIndividualAuditHistory]);

  /*Recalculate audit validation when data changes*/
  useEffect(() => {
    if (!latestBillDetials || !currentBillDetails) return;

    setAuditValidation(
      deepMatchAuditVersion(latestBillDetials, currentBillDetails)
    );

  }, [latestBillDetials, currentBillDetails]);

  useEffect(() => {
    if (!latestBillDetials || !currentBillDetails) return;

    const normalizeBillingAddress = (address: any) => {
      if (!address) return null;

      const actualAddressFields = [
        address.line1,
        address.line2,
        address.city,
        address.state,
        address.zip_code,
        address.country,
      ];

      const hasAnyValue = actualAddressFields.some(
        (field) => typeof field === "string" && field.trim() !== ""
      );

      return hasAnyValue ? address : null;
    };

    setAuditValidation(
      deepMatchAuditVersion(
        {
          ...latestBillDetials,
          billing_address: normalizeBillingAddress(
            latestBillDetials.billing_address
          ),
        },
        {
          ...currentBillDetails,
          billing_address: normalizeBillingAddress(
            currentBillDetails.billing_address
          ),
        }
      )
    );
  }, [latestBillDetials, currentBillDetails]);

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
    if (!billDetailsSection.current || !billLineItemsSection.current) return;

    const observer = new ResizeObserver(calculateHeights);

    observer.observe(billDetailsSection.current);
    observer.observe(billLineItemsSection.current);

    return () => observer.disconnect();
  }, [calculateHeights]);

  // -------------------- HANDLERS --------------------

  const handleClickAuditHistoryCard = async (historyId: number) => {
    if (!latestBillDetials?.id) return;

    const response = await getIndividualBillAuditApi(
      latestBillDetials.id,
      historyId
    );

    if (response?.status !== 200) return;

    setCurrentBillDetails({
      ...response.data,
      id: latestBillDetials.id,
    });
  };

  const handleCloseAuditHistory = () => {
    setShowAuditHistory(false);
    setIsAuditLoading(false);
    setCurrentBillDetails(latestBillDetials);
    setCurrentAuditVersion(null);
    setAuditVersionDate(null);
  };

  const popupButtonItem = [
    {
      name: "Edit Bill",
      icon: <Pencil size={16} />,
      isShown: hasPermission("bill", "update") &&
        billDetails?.status !== "approved" &&
        billDetails?.status !== "under_approval",
      onClick: () => {
        router.push("/bill/edit?id=" + currentBillDetails?.id);
      },
    },
    {
      name: "Request Confirmation",
      icon: <UserRoundPlus size={16} />,
      isShown: hasPermission("bill", "view"),
      onClick: () => setReqConfirmationModal(true),
      isHidden:
        !orgDetails?.receipt_confirmation_enabled ||
        currentBillDetails?.status !== "in_review",
    },
    {
      name: "View Confirmations",
      icon: <FileCheck size={16} />,
      isShown: hasPermission("bill", "view"),
      onClick: () => setVersionHistorySidePanel(true),
      isHidden:
        !orgDetails?.receipt_confirmation_enabled ||
        currentBillDetails?.status !== "in_review",
    },
    {
      name: "Audit History",
      icon: <FileClock width={16} />,
      isShown: true,
      onClick: () => {
        setShowAuditHistory(true);
        setShowBtnPopup(false);
      },
    },
    {
      name: "Delete Bill",
      icon: <Trash size={16} />,
      isShown:
        hasPermission("bill", "delete") &&
        billDetails?.status !== "approved" &&
        billDetails?.status !== "under_approval",
      onClick: () => deleteBill(),
    },
  ];

  const billingAddressField =
    auditValidation?.billing_address === undefined
      ? true // both the current and latest had missing billing_address
      : typeof auditValidation.billing_address === "object"
        ? !Object.values(auditValidation.billing_address)
          .filter((v) => v !== undefined) // ignore undefined
          .some(
            (v) =>
              v === false || //check the billing_address fileds
              (typeof v === "string" && v.trim() !== "") // non-empty change
          )
        : auditValidation.billing_address;

  return (
    <>
      <div className="flex items-center justify-between bg-white rounded-b-[20px] p-4 pt-16 border border-secondary-200">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              {billDetails?.is_duplicate ? <DuplicateFlag /> : null}
              <p className={`text-neutral-1100 text-2xl font-medium ${checkAuditValidation({ showAuditHistory, field: auditValidation?.bill_number })}`}>
                {currentBillDetails?.bill_number ?? ""}
              </p>
            </div>
            <PillItem
              className={`${getStatusClass(getLabelForBillStatus(currentBillDetails?.status || "") || "")}`}
              isRounded={true}
              name={getLabelForBillStatus(currentBillDetails?.status || "")}
            />
            <PillItem
              className={`${getStatusClass(getLabelForBillStatus(currentBillDetails?.match_status || "") || "")}`}
              isRounded={true}
              name={getLabelForBillStatus(currentBillDetails?.match_status || "")}
            />
            {(fileUrl && !showAuditHistory) && (
              <div className="flex items-center">
                <ToggleSwitch isOn={showPdf} setIsOn={setShowPdf} />
                <p className="ms-1.5 text-sm text-neutral-1100 font-medium">
                  {!showPdf ? "Show pdf" : "Hide pdf"}
                </p>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* Approval actions for users who can approve/reject */}
            {(currentBillDetails?.status === "under_approval" && !showAuditHistory) && isUserApproval ? (
              <div className="flex items-center gap-3 w-fit">
                {currentBillDetails?.purchase_order?.id ? (
                  <Button
                    name="View match"
                    onClick={() =>
                      router.push(
                        `/approvals/list/review/match?id=${currentBillDetails?.id}`,
                      )
                    }
                    disabled={isLoaderFormSubmit}
                    button_type="primary-outline"
                  />
                ) : (
                  <Button
                    name="Approve"
                    onClick={handleApprovalAction}
                    disabled={isLoaderFormSubmit}
                    button_type="primary"
                  />
                )}

                <Button
                  name="Reject"
                  onClick={handleRejectionAction}
                  disabled={isLoaderFormSubmit}
                  button_type="danger"
                  icon_type="reject"
                />
              </div>
            ) : null}

            {/* Actions for bills in review: send for approval, approve, or reject */}
            {(currentBillDetails?.status !== "draft" && !showAuditHistory) && (
              <div className="flex items-center gap-3 w-fit">
                {isApproverAvailable ? (
                  <>
                    {/* Approver is available */}
                    {orgDetails?.matching_type !== "none" &&
                      currentBillDetails?.purchase_order?.id ? (
                      <Button
                        name="View match"
                        onClick={() =>
                          router.push(`/bill/match?id=${currentBillDetails?.id}`)
                        }
                        disabled={isLoaderFormSubmit}
                        button_type="primary-outline"
                      />
                    ) : currentBillDetails?.status === "in_review" ? (
                      <Button
                        name="Send for approval"
                        onClick={handleSendBillApproval}
                        disabled={isLoaderFormSubmit}
                        button_type="primary"
                        icon_type={isLoaderFormSubmit ? "loader" : "approve"}
                      />
                    ) : null}
                  </>
                ) : (
                  <>
                    {/* Approver not available */}
                    {!isUserApproval && (
                      <>
                        {orgDetails?.matching_type === "none" ||
                          !currentBillDetails?.purchase_order?.id ? (
                          currentBillDetails?.status === "in_review" && (
                            <Button
                              name="Approve"
                              onClick={handleApproveBill}
                              disabled={isLoaderFormSubmit}
                              button_type="primary"
                              icon_type={
                                isLoaderFormSubmit ? "loader" : "approve"
                              }
                            />
                          )
                        ) : (
                          <Button
                            name="View match"
                            onClick={() =>
                              router.push(`/bill/match?id=${currentBillDetails?.id}`)
                            }
                            disabled={isLoaderFormSubmit}
                            button_type="primary-outline"
                          />
                        )}
                      </>
                    )}
                  </>
                )}

                {/* Reject button shown to everyone if status is in_review */}
                {currentBillDetails?.status === "in_review" && (
                  <Button
                    name="Reject"
                    onClick={handleRejectBill}
                    disabled={isLoaderFormSubmit}
                    button_type="danger"
                    icon_type="reject"
                  />
                )}
              </div>
            )}

            {/* Dropdown button for actions */}
            <div className="flex items-center gap-1">
              {
                !showAuditHistory ?
                  <PopupButton
                    btnPopupItems={popupButtonItem?.filter((v) => !v?.isHidden)}
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
                  /> :
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
            ref={billDetailsSection}
            className={`border border-secondary-200 rounded-[20px] bg-white p-4`}
          >
            <p className="text-neutral-1100 text-xl mb-5 font-medium">
              Bill Details
            </p>
            <div className="grid grid-cols-1 gap-x-5">
              <div className="flex flex-row items-center border-b border-secondary-200 pb-3">
                <Label
                  text="Vendor:"
                  className="max-w-60 w-full text-secondary-700 mb-0 font-medium"
                />
                <p className="text-neutral-1100 text-sm font-medium">
                  {currentBillDetails?.vendor?.name ? (
                    <Link
                      className={`underline text-blue-500 ${checkAuditValidation({ showAuditHistory, field: typeof auditValidation?.vendor === "object" ? auditValidation?.vendor?.name : auditValidation?.vendor })}`}
                      href={`/vendor/view?id=${currentBillDetails?.vendor?.id}`}
                    >
                      {currentBillDetails?.vendor?.name}
                    </Link>
                  ) : (
                    "--"
                  )}
                </p>
              </div>

              <div className="flex flex-row items-center border-b border-secondary-200 py-3">
                <Label
                  text="Purchase Order:"
                  className="max-w-60 w-full text-secondary-700 mb-0 font-medium"
                />
                <p className={`text-neutral-1100 text-sm font-medium ${checkAuditValidation({ showAuditHistory, field: typeof auditValidation?.purchase_order === "object" ? auditValidation?.purchase_order?.po_number : auditValidation?.purchase_order })}`}>
                  {currentBillDetails?.purchase_order?.po_number ? (
                    <Link
                      className="underline text-blue-500"
                      href={`/purchaseorder/view?id=${currentBillDetails?.purchase_order?.id}`}
                    >
                      {currentBillDetails?.purchase_order?.po_number}
                    </Link>
                  ) : (
                    "--"
                  )}
                </p>
              </div>

              <div className="flex flex-row items-center border-b border-secondary-200 py-3">
                <Label
                  text="Bill Date:"
                  className={`max-w-60 w-full text-secondary-700 mb-0 font-medium `}
                />
                <p className={`text-neutral-1100 text-sm ${checkAuditValidation({ showAuditHistory, field: auditValidation?.bill_date })}`}>
                  {formatDate(currentBillDetails?.bill_date, orgDetails?.date_format)}
                </p>
              </div>

              <div className="flex flex-row items-center border-b border-secondary-200 py-3">
                <Label
                  text="Due Date:"
                  className="max-w-60 w-full text-secondary-700 mb-0 font-medium"
                />
                <p className={`text-neutral-1100 text-sm ${checkAuditValidation({ showAuditHistory, field: auditValidation?.due_date })}`}>
                  {formatDate(currentBillDetails?.due_date, orgDetails?.date_format)}
                </p>
              </div>

              <div className="flex flex-row items-center border-b border-secondary-200 py-3">
                <Label
                  text="Vendor address:"
                  className="max-w-60 w-full text-secondary-700 mb-0 font-medium"
                />
                <p className={`text-neutral-1100 text-sm ${checkAuditValidation({ showAuditHistory, field: billingAddressField })}`}>
                  {getCombineAddress(currentBillDetails?.billing_address)}
                </p>
              </div>

              <div className="flex flex-row items-center py-3">
                <Label
                  text="Payment Terms:"
                  className="max-w-60 w-full text-secondary-700 mb-0 font-medium"
                />
                <p className={`text-neutral-1100 text-sm ${checkAuditValidation({ showAuditHistory, field: auditValidation?.payment_terms })}`}>
                  {getLabelForTerm(currentBillDetails.payment_terms || "--")}
                </p>
              </div>
            </div>
          </div>

          <div
            ref={billLineItemsSection}
            className="rounded-[20px] bg-white p-4 border border-secondary-200"
            style={{
              minHeight: `calc(100vh - 10rem - ${billDetailsHeight ?? 0}px - 2px)`,
            }}
          >
            <p className="text-neutral-1100 text-xl font-medium mb-5">
              Bill Line Items
            </p>

            <BillLineItemsReadOnly
              showAuditHistory={showAuditHistory}
              itemsAuditValidation={showAuditHistory ? auditValidation?.items : [true]}
              billDetails={currentBillDetails}
              billItems={currentBillDetails?.items}
            />

            <div className="mt-5 flex items-start justify-between">
              {/* Notes */}
              <div className="w-1/2">
                <Label
                  text="Notes:"
                  className="max-w-60 w-full text-secondary-700 mb-0 font-medium"
                />
                <p className={`text-neutral-1100 text-sm ${checkAuditValidation({ showAuditHistory, field: auditValidation?.comments })}`}>
                  {currentBillDetails?.comments || "--"}
                </p>
              </div>

              {/* Bill Summary */}
              <div className="flex justify-end">
                <div className="p-4 w-72 font-medium text-sm bg-secondary-100 rounded-[20px]">
                  <div className="grid grid-cols-2">
                    <p className="text-neutral-1100">Sub total:</p>
                    <span className={`text-neutral-900 text-right ${checkAuditValidation({ showAuditHistory, field: auditValidation?.sub_total })}`}>
                      {formatNumber(
                        currentBillDetails?.sub_total || 0,
                        orgDetails?.currency,
                      )}
                    </span>
                  </div>
                  <div className="grid items-center grid-cols-2 pb-2 mt-4 mb-2">
                    <div>
                      <p className="text-neutral-1100">Total tax:</p>
                      <span className={`text-xs ${checkAuditValidation({ showAuditHistory, field: auditValidation?.total_tax })}`}>
                        {formatNumber(
                          currentBillDetails?.total_tax || 0,
                          orgDetails?.currency,
                        )}
                      </span>
                    </div>
                    <div className={`text-right ${checkAuditValidation({ showAuditHistory, field: auditValidation?.tax_percentage })}`}>
                      {currentBillDetails?.tax_percentage || 0}%
                    </div>
                  </div>
                  <div className="grid grid-cols-2 font-semibold">
                    <p className="text-neutral-1100">Grand total:</p>
                    <span className={`text-neutral-900 text-right ${checkAuditValidation({ showAuditHistory, field: auditValidation?.total })}`}>
                      {formatNumber(
                        currentBillDetails?.total || 0,
                        orgDetails?.currency,
                      )}
                    </span>
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
              maxHeight: `calc(${billDetailsHeight ?? 0}px + ${billLineItemsHeight ?? 0}px - 0.5px)`, //is for mesh UI - border 1px y-axis, padding 1px y-axis
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

      <SidePanel
        isOpen={versionHistorySidePanel}
        onClose={() => setVersionHistorySidePanel(false)}
        className="w-full lg:w-96 md:w-96 sm:w-96"
      >
        <div className="pb-6">
          <div className="border-b border-secondary-200 p-4 flex justify-between items-center">
            <p className="text-neutral-1100 text-xl font-semibold">
              Confirmation history
            </p>

            <button
              onClick={() => setVersionHistorySidePanel(false)}
              className="popup-btn rounded-[8px] size-8 btn-secondary-outline"
            >
              <X size={16} />
            </button>
          </div>

          <VersionHistory confirmationHistoryList={confirmationHistoryList} />
        </div>
      </SidePanel>

      <Modal
        isOpen={reqConfirmationModal}
        onClose={() => setReqConfirmationModal(false)}
        className="lg:w-2/6 md:2/6 w-5/6"
      >
        <RequestConfirmationModal
          onClose={() => setReqConfirmationModal(false)}
          billDetails={currentBillDetails}
          reqConfirmed={() => {
            setReqConfirmationModal(false);
            getRequestConfirmationHistory();
          }}
        />
      </Modal>
    </>
  );
};

export default ViewBillDetails;
