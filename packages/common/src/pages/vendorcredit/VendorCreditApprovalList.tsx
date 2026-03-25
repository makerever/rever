// Renders Approval vendor credits list page UI

"use client";

import { CheckBox, CustomTooltip, PillItem } from "@rever/common";
import { DataTable } from "@rever/common";
import { useApi, VENOR_CREDIT_API } from "@rever/services";
import { useUserStore } from "@rever/stores";
import { ApprovalTypes, VendorCreditProps } from "@rever/types";
import {
  formatDate,
  formatNumber,
  getStatusTranslationKey,
  getStatusClass,
} from "@rever/utils";
import { ColumnDef, sortingFns } from "@tanstack/react-table";
import { Paperclip } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useTranslate } from "@rever/i18n";

// Main component for displaying the approval list
const VendorCreditApprovalList = ({
  tabs,
  activeTab,
  setActiveTab,
}: ApprovalTypes) => {
  const router = useRouter();
  const translate = useTranslate();

  const [approvalList, setApprovalList] = useState<VendorCreditProps[]>([]);

  const orgDetails = useUserStore((state) => state.user?.organization);

  // Fetch approval vendor credits data using SWR
  const { data: underApprovalVendorCredits, isLoading } = useApi<
    VendorCreditProps[]
  >("approavls", `${VENOR_CREDIT_API.UNDER_APPROVAL_VENDOR_CREDITS}`);

  // Effect to structure and set approval list data when API data changes
  useEffect(() => {
    if (underApprovalVendorCredits) {
      if (underApprovalVendorCredits.length) {
        const structuredData = underApprovalVendorCredits?.map(
          (val: VendorCreditProps) => ({
            id: val?.id,
            credit_note_number: val?.credit_note_number,
            txn_date: val?.txn_date,
            vendor: val?.vendor,
            total: val?.total || 0,
            is_attachment: val?.is_attachment,
            status: val?.status,
          }),
        );
        setApprovalList(structuredData);
      } else {
        setApprovalList([]);
      }
    } else {
      setApprovalList([]);
    }
  }, [
    orgDetails?.currency,
    orgDetails?.date_format,
    underApprovalVendorCredits,
  ]);

  const [search, setSearch] = useState<string>("");

  const collator = useMemo(
    () => new Intl.Collator(undefined, { numeric: true, sensitivity: "base" }),
    [],
  );

  // Define table columns using useMemo for performance
  const columns: ColumnDef<VendorCreditProps>[] = useMemo(
    () => [
      {
        accessorKey: "credit_note_number",
        accessorFn: (row) => row?.credit_note_number || "",
        sortingFn: (rowA, rowB, columnId) => {
          const a = rowA.getValue(columnId) as string;
          const b = rowB.getValue(columnId) as string;
          return collator.compare(a, b);
        },
        sortDescFirst: false,
        header: ({ table }) => (
          <div className="flex items-center gap-4">
            <CheckBox
              checked={table.getIsAllPageRowsSelected()}
              onChange={table.getToggleAllPageRowsSelectedHandler()}
            />
            <span>{translate("vendors.vendor_credit.table_headers.vendor_credit")}</span>
          </div>
        ),
        cell: ({ row, getValue }) => {
          return (
            <div className="flex items-center gap-4">
              <CheckBox
                checked={row.getIsSelected()}
                onChange={row.getToggleSelectedHandler()}
              />
              <span
                onClick={() =>
                  router.push(`/vendorcredit/${row?.original?.id}/review`)
                }
                className="underline cursor-pointer overflow-hidden text-ellipsis"
              >
                {(getValue() as string) || "--"}
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: "txn_date",
        header: translate("vendors.vendor_credit.table_headers.vendor_credit_date"),
        accessorFn: (row) => (row?.txn_date ? new Date(row.txn_date) : null),
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
        header: translate("vendors.vendor_credit.table_headers.vendor"),
        accessorFn: (row) => row.vendor?.name || "",
        sortingFn: "alphanumeric",
        sortDescFirst: false,
        cell: ({ row, getValue }) =>
          getValue() ? (
            <div
              onClick={() =>
                router.push(`/vendor/view?id=${row.original.vendor?.id}`)
              }
              className="flex items-center gap-4"
            >
              <span className="underline cursor-pointer overflow-hidden text-ellipsis ">
                {getValue() as string}
              </span>
            </div>
          ) : (
            "--"
          ),
      },
      {
        accessorKey: "total",
        header: translate("vendors.vendor_credit.table_headers.total_amount"),
        accessorFn: (row) => Number(row.total) || 0,
        sortingFn: "basic",
        sortDescFirst: false,
        cell: ({ getValue }) => {
          const rawAmount = Number(getValue()) || 0;
          return (
            <div className="flex items-center gap-4">
              <span className="overflow-hidden text-ellipsis w-full">
                {formatNumber(rawAmount)}
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: "status",
        header: translate("vendors.vendor_credit.table_headers.stages"),
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
                    : value
                }
              />

              {row?.original.is_attachment && (
                <CustomTooltip content={translate("bills.actions.pdf_attached")}>
                  <div>
                    <Paperclip className="text-slate-400" width={14} />
                  </div>
                </CustomTooltip>
              )}
            </div>
          );
        },
        filterFn: (row, columnId, filterValue: string[]) => {
          if (!filterValue?.length) return true;
          return filterValue.includes(row.getValue(columnId) as string);
        },
      },
    ],
    [router, collator, orgDetails?.date_format, translate],
  );

  // Filter approvals based on search input
  const filteredVendorCreditApprovals = useMemo(() => {
    const lowerSearch = search.toLowerCase();

    return approvalList?.filter((approval) => {
      return (
        approval.credit_note_number?.toLowerCase().includes(lowerSearch) ||
        approval.vendor?.name?.toLowerCase().includes(lowerSearch)
      );
    });
  }, [search, approvalList]);

  return (
    <>
      <DataTable
        noStatusFilter
        tableHeading={translate("sidebar.expenses.approvals")}
        tableData={filteredVendorCreditApprovals}
        columns={columns}
        setSearch={setSearch}
        search={search}
        clearSearch={() => setSearch("")}
        isLoading={isLoading}
        tabNames={tabs}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />
    </>
  );
};

export default VendorCreditApprovalList;
