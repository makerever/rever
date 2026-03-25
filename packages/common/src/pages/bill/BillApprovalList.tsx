// Renders Approval bills List page UI

"use client";

import { CheckBox, CustomTooltip, PillItem } from "@rever/common";
import { DataTable } from "@rever/common";
import { BILL_API, useApi } from "@rever/services";
import { useUserStore } from "@rever/stores";
import {
  ApprovalListAPIType,
  ApprovalTableList,
  ApprovalTypes,
} from "@rever/types";
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
const BillApprovalList = ({ tabs, activeTab, setActiveTab }: ApprovalTypes) => {
  const router = useRouter();
  const translate = useTranslate();

  const [approvalList, setApprovalList] = useState<ApprovalTableList[]>([]);

  const orgDetails = useUserStore((state) => state.user?.organization);

  // Fetch approval bills data using SWR
  const { data: underApprovalBills, isLoading } = useApi<ApprovalListAPIType[]>(
    "approavls",
    `${BILL_API.UNDER_APPROVAL_BILLS}`,
  );

  // Effect to structure and set approval list data when API data changes
  useEffect(() => {
    if (underApprovalBills) {
      if (underApprovalBills.length) {
        const structuredData = underApprovalBills?.map(
          (val: ApprovalListAPIType) => ({
            id: val?.id,
            bill: val?.bill_number,
            bill_date: val?.bill_date,
            due_date: val?.due_date,
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
  }, [orgDetails?.currency, orgDetails?.date_format, underApprovalBills]);

  const [search, setSearch] = useState<string>("");

  const collator = useMemo(
    () => new Intl.Collator(undefined, { numeric: true, sensitivity: "base" }),
    [],
  );

  // Define table columns using useMemo for performance
  const columns: ColumnDef<ApprovalTableList>[] = useMemo(
    () => [
      {
        accessorKey: "bill",
        accessorFn: (row) => row.bill || "",
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
            <span>{translate("bills.table_headers.bill")}</span>
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
                onClick={() => router.push(`/bill/${row?.original?.id}/review`)}
                className="underline cursor-pointer overflow-hidden text-ellipsis"
              >
                {(getValue() as string) || "--"}
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: "bill_date",
        header: translate("bills.table_headers.bill_date"),
        accessorFn: (row) => (row?.bill_date ? new Date(row.bill_date) : null),
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
        accessorKey: "vendor",
        header: translate("bills.table_headers.vendor"),
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
        header: translate("bills.table_headers.total_amount"),
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
        header: translate("bills.table_headers.status"),
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
  const filteredBillApprovals = useMemo(() => {
    const lowerSearch = search.toLowerCase();

    return approvalList?.filter((approval) => {
      return (
        approval.bill?.toLowerCase().includes(lowerSearch) ||
        approval.vendor?.name?.toLowerCase().includes(lowerSearch)
      );
    });
  }, [search, approvalList]);

  return (
    <>
      <DataTable
        noStatusFilter
        tableHeading={translate("sidebar.expenses.approvals")}
        tableData={filteredBillApprovals}
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

export default BillApprovalList;
