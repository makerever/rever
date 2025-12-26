// Component to render view PO details

"use client";

import {
  AuditHistory,
  Button,
  CheckBox,
  DataTable,
  IconWrapper,
  PageLoader,
  PdfViewer,
  PillItem,
  SidePanel,
} from "@rever/common";
import { Label, CustomTooltip } from "@rever/common";
import { ToggleSwitch } from "@rever/common";
import {
  formatDate,
  formatNumber,
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
import { Bill, ViewPODetailsProps } from "@rever/types";
import {
  FileClock,
  FileSymlink,
  Paperclip,
  SquarePen,
  Trash,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import POLineItemsReadOnly from "./POLineItemViews";
// import { Button } from "@rever/common";
import { useUserStore } from "@rever/stores";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  getAssociateBillsByPoIDApi,
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

  const orgDetails = useUserStore((state) => state.user?.organization);

  const [sidePanel, setSidePanel] = useState(false);
  const [associateBillsSidePanel, setAssociateBillsSidePanel] = useState(false);

  const [auditData, setAuditData] = useState([]);

  const [associateBillsData, setAssociateBillsData] = useState<Bill[]>([]);

  const [isAuditLoading, setIsAuditLoading] = useState<boolean>(true);

  const [isAssociateLoading, setIsAssociateLoading] = useState<boolean>(true);

  const collator = useMemo(
    () => new Intl.Collator(undefined, { numeric: true, sensitivity: "base" }),
    [],
  );

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
        header: ({}) => (
          <div className="flex items-center gap-4">
            <span>Bill</span>
          </div>
        ),
        cell: ({ row, getValue }) => {
          return (
            <div className="flex items-center gap-4">
              <div className="flex items-center ">
                <span
                  onClick={() =>
                    router.push(`/bill/view/?id=${row.original.id}`)
                  }
                  className="font-semibold cursor-pointer overflow-hidden text-ellipsis"
                >
                  {getValue() as string}{" "}
                </span>
                {row?.original?.is_duplicate ? (
                  <PillItem
                    name="Duplicate"
                    className="text-red-500 bg-red-50"
                  />
                ) : null}
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "bill_date",
        header: "Bill date",
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
        header: "Due date",
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
        accessorKey: "vendor",
        header: "Vendor",
        accessorFn: (row) => row.vendor?.name || "",
        sortingFn: "alphanumeric",
        sortDescFirst: false,
        cell: ({ row, getValue }) => (
          <div
            onClick={() =>
              router.push(`/vendor/view?id=${row.original.vendor?.id}`)
            }
            className="flex items-center gap-4"
          >
            <span className="font-semibold cursor-pointer overflow-hidden text-ellipsis ">
              {(getValue() as string) || "--"}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "total",
        header: "Total amount",
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
        header: "Status",
        sortDescFirst: false,
        cell: ({ row, getValue }) => {
          const value = getValue() as string;

          return (
            <div className="flex items-center pr-2 justify-between w-32">
              <span
                className={`text-2xs border py-1 px-1.5 rounded-md ${getStatusClass(
                  value,
                )}`}
              >
                {value}
              </span>

              {row?.original.is_attachment ? (
                <CustomTooltip content="PDF attached">
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

  const getPOAuditHistory = useCallback(async (id: string) => {
    const response = await getPOAuditHistoryApi(id);
    if (response?.status === 200) {
      setAuditData(response?.data);
      setIsAuditLoading(false);
    }
  }, []);

  const getAssociateBillsByPoID = useCallback(async (id: string) => {
    const response = await getAssociateBillsByPoIDApi(id);
    if (response?.status === 200) {
      setAssociateBillsData(response?.data);
      setIsAssociateLoading(false);
    }
  }, []);

  // Fetch audit history
  useEffect(() => {
    if (poDetails?.id) {
      getPOAuditHistory(String(poDetails?.id));
    }
  }, [poDetails?.id, getPOAuditHistory]);

  // Fetch associate bills
  useEffect(() => {
    if (poDetails?.id) {
      getAssociateBillsByPoID(String(poDetails?.id));
    }
  }, [poDetails?.id, getAssociateBillsByPoID]);

  // Filter bills based on active tab and search input
  const filteredAssociateBills = useMemo(() => {
    return associateBillsData.map((bill: Bill) => {
      return {
        ...bill,
        status: getLabelForBillStatus(bill?.status),
      };
    });
  }, [associateBillsData]);

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
              {/* PO number */}
              <p className="text-slate-800 mr-1 text-lg font-semibold">
                {poDetails?.po_number}
              </p>

              {/* PO status label */}
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
                <div className="flex items-center gap-1">
                  <div className="flex items-center gap-1">
                    <CustomTooltip content="Associate bills">
                      <div>
                        <IconWrapper
                          onClick={() => setAssociateBillsSidePanel(true)}
                          icon={<FileSymlink width={16} />}
                        />
                      </div>
                    </CustomTooltip>
                    <CustomTooltip content="Audit history">
                      <div>
                        <IconWrapper
                          onClick={() => setSidePanel(true)}
                          icon={<FileClock width={16} />}
                        />
                      </div>
                    </CustomTooltip>
                  </div>
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
                </div>
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

            {/* PO details section */}
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

              {/* PO line items table */}
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

          <AuditHistory data={auditData} isLoading={isAuditLoading} />
        </div>
      </SidePanel>

      <SidePanel
        isOpen={associateBillsSidePanel}
        onClose={() => setAssociateBillsSidePanel(false)}
      >
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <p className="text-slate-800 text-lg font-semibold">
              Associate bills
            </p>
            <IconWrapper
              onClick={() => setAssociateBillsSidePanel(false)}
              icon={<X width={16} />}
            />
          </div>
          {isAssociateLoading ? (
            <PageLoader />
          ) : (
            <DataTable
              hideExportIcon
              tableData={filteredAssociateBills}
              columns={columns}
            />
          )}
        </div>
      </SidePanel>
    </>
  );
};

export default ViewPODetails;
