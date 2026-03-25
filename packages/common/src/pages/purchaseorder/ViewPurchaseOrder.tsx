// Component to render view PO details

"use client";

import {
  AuditHistory,
  Button,
  DataTable,
  DuplicateFlag,
  PageLoader,
  PdfViewer,
  PillItem,
  PopupButton,
  SidePanel,
} from "@rever/common";
import { Label, CustomTooltip } from "@rever/common";
import { ToggleSwitch } from "@rever/common";
import {
  checkAuditValidation,
  deepMatchAuditVersion,
  formatDate,
  formatNumber,
  getLabelForBillStatus,
  getStatusTranslationKey,
  getStatusClass,
  hasPermission,
} from "@rever/utils";
import {
  getCombineAddress,
  // getLabelForBillStatus,
  getLabelForTerm,
  // getStatusClass,
} from "@rever/utils";
import { Bill, PoAuditValidationType, PopupButtonMenuProps, PurchaseOrder, ViewPODetailsProps } from "@rever/types";
import {
  Ellipsis,
  FileClock,
  FileSymlink,
  Paperclip,
  Pencil,
  Trash,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import POLineItemsReadOnly from "./POLineItemViews";
// import { Button } from "@rever/common";
import { useUserStore } from "@rever/stores";
import Link from "next/link";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useTranslate } from "@rever/i18n";
import {
  getAssociateBillsByPoIDApi,
  getIndividualPOAuditApi,
  getPOAuditHistoryApi,
} from "@rever/services";
import { ColumnDef, sortingFns } from "@tanstack/react-table";

// Main component to display PO details in view mode
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
  const translate = useTranslate();

  const orgDetails = useUserStore((state) => state.user?.organization);

  const [currentPoDetails, setCurrentPoDetails] = useState<Partial<PurchaseOrder>>(poDetails);
  const [latestPoDetials, setLatestPoDetails] = useState<Partial<PurchaseOrder>>(poDetails);
  const [auditValidation, setAuditValidation] = useState<PoAuditValidationType | null>(null);

  const [associateBillsSidePanel, setAssociateBillsSidePanel] = useState(false);

  const [auditData, setAuditData] = useState([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAuditLoading, setIsAuditLoading] = useState<boolean>(true);

  const [associateBillsData, setAssociateBillsData] = useState<Bill[]>([]);

  const [showBtnPopup, setShowBtnPopup] = useState<boolean>(false);
  const [showAuditHistory, setShowAuditHistory] = useState<boolean>(false);

  const [auditVersionDate, setAuditVersionDate] = useState<string | null>(null);
  const [currentAuditVersion, setCurrentAuditVersion] = useState<number | null>(null);

  const poDetailsSection = useRef<HTMLDivElement | null>(null);
  const poLineItemsSection = useRef<HTMLDivElement | null>(null);

  const [poLineItemsHeight, setPoLineItemsHeight] = useState<number | null>(null);
  const [poDetailsHeight, setPoDetailsHeight] = useState<number | null>(null);

  const [isAssociateLoading, setIsAssociateLoading] = useState<boolean>(true);

  const collator = useMemo(
    () => new Intl.Collator(undefined, { numeric: true, sensitivity: "base" }),
    [],
  );

  // ---------- API HANDLERS ---------- //

  const getBillAuditHistory = useCallback(async (id: number) => {
    setIsLoading(true);
    setIsAuditLoading(true);

    const response = await getPOAuditHistoryApi(String(id));
    if (response?.status === 200) {
      setAuditData(response.data);
      setCurrentAuditVersion(response.data?.[0]?.history_id ?? null);

      const formattedDate = formatDate(
        response.data?.[0]?.changed_on,
        orgDetails?.date_format,
        undefined,
        false,
        true,
      );

      setAuditVersionDate(formattedDate ?? null);
    }
    setIsAuditLoading(false);
    setIsLoading(false);
  }, [orgDetails?.date_format]);

  const fetchIndividualAuditHistory = useCallback(
    async (historyId: number | null) => {
      if (!latestPoDetials?.id || !historyId) return;

      const response = await getIndividualPOAuditApi(latestPoDetials.id, historyId);
      if (response?.status !== 200) return;

      setCurrentPoDetails({
        ...response.data,
        id: latestPoDetials.id,
      });

      setIsAuditLoading(false);
    },
    [latestPoDetials?.id]
  );

  const getAssociateBillsByPoID = useCallback(async (id: string) => {
    const response = await getAssociateBillsByPoIDApi(id);
    if (response?.status === 200) {
      setAssociateBillsData(response.data);
      setIsAssociateLoading(false);
    }
  }, []);

  // ---------- HEIGHT UTIL ---------- //

  const calculateHeights = useCallback(() => {
    if (!poDetailsSection.current || !poLineItemsSection.current) return;

    setPoDetailsHeight(poDetailsSection.current.offsetHeight);
    setPoLineItemsHeight(poLineItemsSection.current.offsetHeight);
  }, []);

  // ---------- EFFECTS ---------- //

  // Initial Load
  useEffect(() => {
    setCurrentPoDetails(poDetails);
    setLatestPoDetails(poDetails);
    getAssociateBillsByPoID(String(poDetails?.id));
  }, []);

  // Load audit list on open
  useEffect(() => {
    if (!showAuditHistory || !currentPoDetails?.id) return;
    getBillAuditHistory(currentPoDetails.id);
  }, [showAuditHistory, currentPoDetails?.id, getBillAuditHistory]);

  /*Recalculate audit validation when data changes*/
  useEffect(() => {
    if (!latestPoDetials || !currentPoDetails) return;

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
          ...latestPoDetials,
          billing_address: normalizeBillingAddress(
            latestPoDetials.billing_address
          ),
        },
        {
          ...currentPoDetails,
          billing_address: normalizeBillingAddress(
            currentPoDetails.billing_address
          ),
        }
      )
    );
  }, [latestPoDetials, currentPoDetails]);

  // Fetch selected version
  useEffect(() => {
    if (!currentAuditVersion) return;
    fetchIndividualAuditHistory(currentAuditVersion);
  }, [currentAuditVersion, fetchIndividualAuditHistory]);

  // Generate change validation object
  useEffect(() => {
    if (!latestPoDetials || !currentPoDetails) return;

    const validation = deepMatchAuditVersion(latestPoDetials, currentPoDetails);
    setAuditValidation(validation);

  }, [currentPoDetails]);

  // Calculate height after audit panel visible
  useLayoutEffect(() => {
    if (!showAuditHistory || isLoading) return;

    requestAnimationFrame(() => {
      requestAnimationFrame(calculateHeights);
    });
  }, [showAuditHistory, isLoading, calculateHeights]);

  // Live resize tracking
  useEffect(() => {
    if (!poDetailsSection.current || !poLineItemsSection.current) return;
    const observer = new ResizeObserver(calculateHeights);

    observer.observe(poDetailsSection.current);
    observer.observe(poLineItemsSection.current);

    return () => observer.disconnect();
  }, [calculateHeights]);

  // Fetch associate bills again on id change
  useEffect(() => {
    if (poDetails?.id) getAssociateBillsByPoID(String(poDetails.id));
  }, [poDetails?.id, getAssociateBillsByPoID]);

  // ---------- HANDLERS ---------- //

  const handleClickAuditHistoryCard = async (historyId: number) => {
    if (!latestPoDetials?.id) return;

    const response = await getIndividualPOAuditApi(latestPoDetials.id, historyId);
    if (response?.status !== 200) return;

    setCurrentPoDetails({ ...response.data, id: latestPoDetials.id });
  };

  const handleCloseAuditHistory = () => {
    setShowAuditHistory(false);
    setIsAuditLoading(false);
    setCurrentPoDetails(latestPoDetials);
    setCurrentAuditVersion(null);
    setAuditVersionDate(null);
  };

  // ---------- DATA FILTER ---------- //

  const filteredAssociateBills = useMemo(() => {
    return associateBillsData.map((bill: Bill) => ({
      ...bill,
      status: getLabelForBillStatus(bill?.status),
    }));
  }, [associateBillsData]);


  // Define columns for the DataTable
  const columns: ColumnDef<Bill>[] = useMemo(
    () => [
      {
        accessorKey: "bill_number",
        accessorFn: (row) => row.bill_number || "",
        sortingFn: (rowA, rowB, columnId) => {
          const a = rowA.getValue(columnId) as string;
          const b = rowB.getValue(columnId) as string;
          return collator.compare(a, b);
        },
        sortDescFirst: false,
        header: ({ }) => (
          <div className="flex items-center gap-4">
            <span>{translate("bills.table_headers.bill")}</span>
          </div>
        ),
        cell: ({ row, getValue }) => {
          return (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                {row?.original?.is_duplicate ? <DuplicateFlag /> : null}
                <span
                  onClick={() =>
                    router.push(`/bill/view?id=${row.original.id}`)
                  }
                  className="underline cursor-pointer overflow-hidden text-ellipsis"
                >
                  {(getValue() as string) || "--"}{" "}
                </span>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "bill_date",
        header: translate("bills.table_headers.bill_date"),
        accessorFn: (row) => (row.bill_date ? new Date(row.bill_date) : null),
        sortingFn: sortingFns.datetime,
        sortDescFirst: false,
        cell: ({ getValue }) => (
          <div className="flex items-center gap-4">
            <span className="overflow-hidden text-ellipsis ">
              {formatDate(getValue() as Date, orgDetails?.date_format)}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "due_date",
        header: translate("bills.table_headers.due_date"),
        accessorFn: (row) => (row.due_date ? new Date(row.due_date) : null),
        sortingFn: sortingFns.datetime,
        sortDescFirst: false,
        cell: ({ getValue }) => (
          <div className="flex items-center gap-4">
            <span className="overflow-hidden text-ellipsis ">
              {formatDate(getValue() as Date, orgDetails?.date_format)}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "total",
        header: translate("bills.table_headers.total_amount"),
        accessorFn: (row) => Number(row.total) || 0,
        sortingFn: "basic",
        sortDescFirst: false,
        cell: ({ getValue }) => {
          const rawAmount = getValue() as number;
          return (
            <div className="flex items-center gap-4">
              <span className="overflow-hidden text-ellipsis w-full">
                {formatNumber(rawAmount)}{" "}
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: "status",
        header: translate("purchase_order.table_headers.status"),
        sortDescFirst: false,
        cell: ({ row, getValue }) => {
          const value = getValue() as string;

          return (
            <div className="flex items-center pr-2 justify-between w-32">
              <PillItem
                className={`${getStatusClass(value || "")}`}
                isRounded={true}
                name={
                  getStatusTranslationKey(value || "")
                    ? translate(getStatusTranslationKey(value || "")!)
                    : (value || "")
                }
              />
              {row?.original.is_attachment ? (
                <CustomTooltip content={translate("bills.actions.pdf_attached")}>
                  <div>
                    <Paperclip className="text-slate-400" width={14} />
                  </div>
                </CustomTooltip>
              ) : null}
            </div>
          );
        },
        filterFn: (row, columnId, filterValue: string[]) => {
          if (!filterValue?.length) return true;
          return filterValue.includes(row.getValue(columnId) as string);
        },
      },
    ],
    [collator, orgDetails?.date_format, router],
  );

  //Options for popup button
  const popupButtonItem: PopupButtonMenuProps[] = [
    {
      name: translate("purchase_order.actions.edit_po"),
      icon: <Pencil size={16} />,
      isShown:
        hasPermission("purchaseorder", "update") &&
        poDetails?.status !== "approved" &&
        poDetails?.status !== "under_approval",
      onClick: () => {
        router.push("/purchaseorder/edit?id=" + poDetails?.id);
      },
    },
    {
      name: translate("purchase_order.actions.associated_bills"),
      icon: <FileSymlink size={16} />,
      isShown: true,
      onClick: () => setAssociateBillsSidePanel(true),
    },
    {
      name: translate("purchase_order.actions.audit_history"),
      icon: <FileClock width={16} />,
      isShown: true,
      onClick: () => {
        setShowAuditHistory(true);
        setShowBtnPopup(false);
      },
    },
    {
      name: translate("purchase_order.actions.delete_po"),
      icon: <Trash size={16} />,
      isShown:
        hasPermission("purchaseorder", "delete") &&
        poDetails?.status !== "approved" &&
        poDetails?.status !== "under_approval",
      onClick: deletePO,
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
      <div className="bg-secondary-200">
        {/* Header section: Bill number, status, PDF toggle, edit/delete icons */}
        <div className="bg-white rounded-b-[20px] p-4 pt-16 border border-secondary-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Po number */}
              <p className="text-neutral-1100 font-medium text-2xl">
                {currentPoDetails?.po_number ?? ""}
              </p>
              {/* PO status label */}
              <PillItem
                className={`${getStatusClass(currentPoDetails?.status || "")}`}
                isRounded={true}
                name={
                  getStatusTranslationKey(currentPoDetails?.status || "")
                    ? translate(getStatusTranslationKey(currentPoDetails?.status || "")!)
                    : getLabelForBillStatus(currentPoDetails?.status || "")
                }
              />
              {/* Toggle to show/hide PDF if fileUrl exists */}
              {(fileUrl && !showAuditHistory) && (
                <div className="flex items-center">
                  <ToggleSwitch isOn={showPdf} setIsOn={setShowPdf} />
                  <p className="ms-2 text-xs text-neutral-1100 dark:text-gray-200">
                    {!showPdf ? translate("purchase_order.actions.show_pdf") : translate("purchase_order.actions.hide_pdf")}
                  </p>
                </div>
              )}
            </div>
            {/* Dropdown button for actions */}
            <div className="flex items-center justify-center gap-3">
              {/* Approval actions for users who can approve/reject */}
              {(currentPoDetails?.status !== "draft" && !showAuditHistory) &&
                <>
                  {currentPoDetails?.status === "under_approval" && isUserApproval ? (
                    <div className="flex items-center gap-3 w-fit">
                      <Button
                        name={translate("purchase_order.actions.approve")}
                        onClick={handleApprovalAction}
                        disabled={isLoaderFormSubmit}
                        button_type="primary"
                        icon_type="approve"
                      />
                      <Button
                        name={translate("purchase_order.actions.reject")}
                        onClick={handleRejectionAction}
                        disabled={isLoaderFormSubmit}
                        button_type="danger"
                        icon_type="reject"
                      />
                    </div>
                  ) : null}
                  {/* Actions for PO in review: send for approval, approve, or reject */}
                  {currentPoDetails?.status === "in_review" ? (
                    <div className="flex items-center gap-3 w-fit">
                      {isApproverAvailable ? (
                        <Button
                          name={translate("purchase_order.actions.send_for_approval")}
                          onClick={handleSendPOApproval}
                          disabled={isLoaderFormSubmit}
                          button_type="primary"
                          icon_type="approve"
                        />
                      ) : (
                        <Button
                          name={translate("purchase_order.actions.approve")}
                          onClick={handleApprovePO}
                          disabled={isLoaderFormSubmit}
                          button_type="primary"
                          icon_type="approve"
                        />
                      )}
                      <Button
                        name={translate("purchase_order.actions.reject")}
                        onClick={handleRejectPO}
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
              {!isUserApproval ? (
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
                              <span>{translate("common.you_are_viewing")} </span>
                              {auditVersionDate}
                              <span> {translate("common.version")}</span>
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
              ) : (
                <></>
              )}
            </div>
          </div>
        </div>

        <div>
          <div className="lg:flex">
            {/*PO details section */}
            <div
              className={(fileUrl && showPdf) || showAuditHistory ? "lg:w-[70%]" : "w-full"}
            >
              {/* Vendor, bill date, due date */}
              <div
                ref={poDetailsSection}
                className="grid grid-cols-1 gap-x-5 bg-white rounded-[20px] p-4 border border-secondary-200"
              >
                <p className="text-neutral-1100 text-xl mb-5 font-medium">
                  {translate("purchase_order.po_details")}
                </p>
                <div className="flex flex-row items-center border-b border-secondary-200 h-11">
                  <Label
                    text={translate("vendors.create_vendor.vendor_details.vendor_name") + ":"}
                    className="font-medium text-secondary-700 max-w-60 w-full"
                  />
                  <p
                    className={`${currentPoDetails?.vendor?.name ? "text-blue-600" : "text-neutral-1100"} text-sm font-medium`}
                  >
                    {currentPoDetails?.vendor?.name ? (
                      <Link
                        className={`underline text-blue-500 ${checkAuditValidation({ showAuditHistory, field: typeof auditValidation?.vendor === "object" ? auditValidation?.vendor?.name : auditValidation?.vendor })}`}
                        href={`/vendor/view?id=${currentPoDetails?.vendor?.id}`}
                      >
                        {currentPoDetails?.vendor?.name}
                      </Link>
                    ) : (
                      "--"
                    )}
                  </p>
                </div>
                <div className="flex flex-row items-center border-b border-secondary-200 py-1.5 h-11">
                  <Label
                    text={translate("purchase_order.table_headers.total_amount") + ":"}
                    className="font-medium text-secondary-700 max-w-60 w-full"
                  />
                  <p className={`text-neutral-1100 text-sm ${checkAuditValidation({ showAuditHistory, field: auditValidation?.total })}`}>
                    {currentPoDetails?.total || "--"}
                  </p>
                </div>
                <div className="flex flex-row items-center border-b border-secondary-200 py-1.5 h-11">
                  <Label
                    text={translate("purchase_order.create_po.po_date") + ":"}
                    className="font-medium text-secondary-700 max-w-60 w-full"
                  />
                  <p className={`text-neutral-1100 text-sm ${checkAuditValidation({ showAuditHistory, field: auditValidation?.po_date })}`}>
                    {formatDate(currentPoDetails?.po_date, orgDetails?.date_format)}
                  </p>
                </div>
                <div className="flex flex-row items-center border-b border-secondary-200 py-1.5 h-11">
                  <Label
                    text={translate("purchase_order.create_po.delivery_date") + ":"}
                    className="font-medium text-secondary-700 max-w-60 w-full"
                  />
                  <p className={`text-neutral-1100 text-sm ${checkAuditValidation({ showAuditHistory, field: auditValidation?.delivery_date })}`}>
                    {formatDate(
                      currentPoDetails?.delivery_date,
                      orgDetails?.date_format,
                    )}
                  </p>
                </div>
                <div className="flex flex-row items-center border-b border-secondary-200 py-3">
                  <Label
                    text={translate("vendors.create_vendor.vendor_address.heading") + ":"}
                    className="font-medium text-secondary-700 max-w-60 w-full"
                  />
                  <p className={`text-neutral-1100 text-sm ${checkAuditValidation({ showAuditHistory, field: billingAddressField })}`}>
                    {getCombineAddress(currentPoDetails?.billing_address)}
                  </p>
                </div>
                <div className="flex flex-row items-center h-11">
                  <Label
                    text={translate("purchase_order.create_po.payment_terms") + ":"}
                    className="font-medium text-secondary-700 max-w-60 w-full"
                  />
                  <p className={`text-neutral-1100 text-sm ${checkAuditValidation({ showAuditHistory, field: auditValidation?.payment_terms })}`}>
                    {getLabelForTerm(currentPoDetails.payment_terms || "")}
                  </p>
                </div>
              </div>

              {/* PO line items table */}
              <div
                ref={poLineItemsSection}
                className={`bg-white rounded-[20px] border border-secondary-200 p-4`}
                style={{
                  minHeight: `calc(100vh - 10rem - ${poDetailsHeight ?? 0}px - 2px)`, //2px (348) is for mesh UI - border 1px y-axis, padding 1px y-axis
                }}
              >
                <p className="text-neutral-1100 mb-5 text-xl font-medium">
                  {translate("purchase_order.create_po.po_line_items.heading")}
                </p>
                <POLineItemsReadOnly
                  showAuditHistory={showAuditHistory}
                  poDetails={currentPoDetails}
                  poItems={currentPoDetails?.items}
                  auditValidation={auditValidation}
                  itemsAuditValidation={showAuditHistory ? auditValidation?.items : [true]}
                />
              </div>
            </div>
            {/* PDF preview section (if enabled) */}
            {fileUrl && showPdf && (
              <div className="relative lg:w-[30%] scrollbar_none rounded-[20px] bg-white border border-secondary-200 overflow-hidden">
                <p className="p-4 mb-4 pb-0 text-neutral-1100 text-xl font-medium">
                  {translate("purchase_order.po_preview")}
                </p>
                <PdfViewer fileUrl={fileUrl} />
              </div>
            )}
            {showAuditHistory && (
              <div
                className={`relative overflow-y-scroll lg:w-[30%] scrollbar_none rounded-[20px] bg-white border border-secondary-200`}
                style={{
                  maxHeight: `calc(${poDetailsHeight ?? 0}px + ${poLineItemsHeight ?? 0}px - 0.5px)`, //is for mesh UI - border 1px y-axis, padding 1px y-axis
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
        </div>
      </div>

      <SidePanel
        isOpen={associateBillsSidePanel}
        onClose={() => setAssociateBillsSidePanel(false)}
      >
        <div className="">
          <div className="flex justify-between items-center p-4">
            <p className="text-neutral-1100 text-lg font-semibold">
              {translate("purchase_order.associate_bills")}
            </p>
            <div
              className="popup-btn rounded-[8px] size-8 btn-secondary-outline"
              onClick={() => setAssociateBillsSidePanel(false)}
            >
              <X width={16} />
            </div>
          </div>
          {isAssociateLoading ? (
            <PageLoader />
          ) : (
            <DataTable
              hideExportIcon
              tableData={filteredAssociateBills}
              columns={columns}
              isHeader={false}
            />
          )}
        </div>
      </SidePanel>
    </>
  );
};

export default ViewPODetails;
