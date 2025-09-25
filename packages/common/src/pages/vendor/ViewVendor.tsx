// Component to render view vendor details

"use client";

import {
  DataTable,
  IconWrapper,
  PageLoader,
  PillItem,
  SidePanel,
} from "@rever/common";
import { Label } from "@rever/common";
import {
  formatDate,
  formatNumber,
  getLabelForBillStatus,
  getStatusClass,
  hasPermission,
} from "@rever/utils";
import { getCombineAddress, getLabelForTerm } from "@rever/utils";
import { Bill, ViewVendorDetailsProps } from "@rever/types";
import { FileSymlink, Paperclip, SquarePen, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { CustomTooltip } from "@rever/common";
import { useUserStore } from "@rever/stores";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ColumnDef, sortingFns } from "@tanstack/react-table";
import { getAssociateBillsByVendorIDApi } from "@rever/services";

const ViewVendorDetails = ({ vendorData }: ViewVendorDetailsProps) => {
  const router = useRouter();

  const orgDetails = useUserStore((state) => state.user?.organization);

  const [associateBillsSidePanel, setAssociateBillsSidePanel] = useState(false);

  const [associateBillsData, setAssociateBillsData] = useState<Bill[]>([]);

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
        accessorKey: "po",
        header: "PO",
        accessorFn: (row) => row.purchase_order?.po_number || "",
        sortingFn: "alphanumeric",
        sortDescFirst: false,
        cell: ({ row, getValue }) =>
          (getValue() as string) ? (
            <div
              onClick={() =>
                router.push(
                  `/purchaseorder/view?id=${row.original.purchase_order?.id}`,
                )
              }
              className="flex items-center gap-4"
            >
              <span className="font-semibold cursor-pointer overflow-hidden text-ellipsis ">
                {(getValue() as string) || "--"}
              </span>
            </div>
          ) : (
            "--"
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

  const getAssociateBillsByVendorID = useCallback(async (id: string) => {
    const response = await getAssociateBillsByVendorIDApi(id);
    if (response?.status === 200) {
      setAssociateBillsData(response?.data);
      setIsAssociateLoading(false);
    }
  }, []);

  // Fetch associate bills
  useEffect(() => {
    if (vendorData?.id) {
      getAssociateBillsByVendorID(String(vendorData?.id));
    }
  }, [vendorData?.id, getAssociateBillsByVendorID]);

  // Filter bills based on active tab and search input
  const filteredAssociateBills = useMemo(() => {
    return associateBillsData.map((bill) => {
      return {
        ...bill,
        status: getLabelForBillStatus(bill?.status),
      };
    });
  }, [associateBillsData]);

  return (
    <>
      <div className="">
        <div>
          {/* Header with vendor name and action icons */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-1">
              <p className="text-slate-800 mr-1 text-lg font-semibold">
                {vendorData?.vendor_name ?? ""}
              </p>
              <span
                className={`text-2xs border py-1 px-1.5 rounded-md ${
                  vendorData?.is_active
                    ? "text-green-600 bg-green-50 border-green-200"
                    : "text-red-500 bg-red-50 border-red-200"
                }`}
              >
                {(vendorData?.is_active ?? "") ? "Active" : "Inactive"}
              </span>
            </div>

            <div className="flex items-center gap-1">
              {/* Edit icon, visible if user has update permission */}
              <CustomTooltip content="Associate bills">
                <div>
                  <IconWrapper
                    onClick={() => setAssociateBillsSidePanel(true)}
                    icon={<FileSymlink width={16} />}
                  />
                </div>
              </CustomTooltip>
              {hasPermission("vendor", "update") && (
                <CustomTooltip content="Edit vendor">
                  <div>
                    <IconWrapper
                      onClick={() =>
                        router.push("/vendor/update?id=" + vendorData?.id)
                      }
                      icon={<SquarePen width={16} />}
                    />
                  </div>
                </CustomTooltip>
              )}
            </div>
          </div>

          {/* Vendor main details: company, mobile, email */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-5">
            <div>
              <Label text="Company name" />
              <p className="text-slate-800 text-sm font-medium mb-5">
                {vendorData?.company_name || "-"}
              </p>
            </div>
            <div>
              <Label text="Mobile" />
              <p className="text-slate-800 text-sm font-medium mb-5">
                {vendorData?.mobile || "-"}
              </p>
            </div>
            <div>
              <Label text="Email" />
              <p className="text-slate-800 text-sm font-medium mb-5">
                {vendorData?.email || "-"}
              </p>
            </div>

            <div>
              <Label text="Tax ID" />
              <p className="text-slate-800 text-sm font-medium mb-5">
                {vendorData?.tax_id || "-"}
              </p>
            </div>
            <div>
              <Label text="Website" />
              <p className="text-slate-800 text-sm font-medium mb-5">
                {vendorData?.website || "-"}
              </p>
            </div>
            <div>
              <Label text="Payment terms" />
              <p className="text-slate-800 text-sm font-medium mb-5">
                {getLabelForTerm(vendorData?.payment_terms || "")}
              </p>
            </div>
          </div>

          {/* Vendor address */}
          <div className="grid lg:grid-cols-3 gap-x-5">
            <div>
              <Label text="Vendor address" />
              <p className="text-slate-800 text-sm font-medium">
                {getCombineAddress({
                  line1: vendorData?.billing_address?.line1 ?? "",
                  line2: vendorData?.billing_address?.line2 ?? "",
                  city: vendorData?.billing_address?.city ?? "",
                  state: vendorData?.billing_address?.state ?? "",
                  zip_code: vendorData?.billing_address?.zip_code ?? "",
                  country: vendorData?.billing_address?.country ?? "",
                })}
              </p>
            </div>
          </div>

          {/* Vendor bank details*/}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 my-5 gap-x-5">
            <div>
              <Label text="Accounnt holder name" />
              <p className="text-slate-800 text-sm font-medium">
                {vendorData?.bank_account?.account_holder_name || "-"}
              </p>
            </div>
            <div>
              <Label text="Account number" />
              <p className="text-slate-800 text-sm font-medium">
                {vendorData?.bank_account?.account_number || "-"}
              </p>
            </div>
            <div>
              <Label text="Bank name" />
              <p className="text-slate-800 text-sm font-medium">
                {vendorData?.bank_account?.bank_name || "-"}
              </p>
            </div>
          </div>
        </div>
      </div>

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

export default ViewVendorDetails;
