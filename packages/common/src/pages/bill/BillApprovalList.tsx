// Renders Approval bills List page UI

"use client";

import { CheckBox, PageLoader, Tabs } from "@rever/common";
import { DataTable } from "@rever/common";
import { BILL_API, useApi } from "@rever/services";
import { useUserStore } from "@rever/stores";
import { ApprovalListAPIType, ApprovalTableList } from "@rever/types";
import {
  formatDate,
  formatNumber,
  getLabelForBillStatus,
  getStatusClass,
} from "@rever/utils";
import { ColumnDef } from "@tanstack/react-table";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

// Main component for displaying the approval list
const BillApprovalList = () => {
  const router = useRouter();

  const [approvalList, setApprovalList] = useState<ApprovalTableList[]>([]);

  const [isLoading, setIsLoading] = useState<boolean>(true);

  const orgDetails = useUserStore((state) => state.user?.organization);

  // Fetch approval bills data using SWR
  const { data: underApprovalBills } = useApi<ApprovalListAPIType[]>(
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
            bill_date:
              val?.bill_date &&
              formatDate(val?.bill_date, orgDetails?.date_format),
            due_date:
              val?.due_date &&
              formatDate(val?.due_date, orgDetails?.date_format),
            vendor: val?.vendor,
            total: val?.total
              ? formatNumber(val?.total, orgDetails?.currency)
              : 0,
            status: getLabelForBillStatus(val?.status),
          }),
        );
        setApprovalList(structuredData);
        setIsLoading(false);
      } else {
        setApprovalList([]);
        setIsLoading(false);
      }
    } else {
      setApprovalList([]);
    }
  }, [orgDetails?.currency, orgDetails?.date_format, underApprovalBills]);

  const [search, setSearch] = useState<string>("");

  // Define table columns using useMemo for performance
  const columns: ColumnDef<ApprovalTableList>[] = useMemo(
    () => [
      {
        accessorKey: "bill",
        header: ({ table }) => (
          <div className="flex items-center gap-4">
            <CheckBox
              checked={table.getIsAllPageRowsSelected()}
              onChange={table.getToggleAllPageRowsSelectedHandler()}
            />
            <span>Bill</span>
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
                className="font-semibold cursor-pointer overflow-hidden text-ellipsis"
              >
                {getValue() as string}
              </span>
            </div>
          );
        },
      },

      {
        accessorKey: "bill_date",
        header: "Bill date",
        cell: ({ getValue }) => {
          return (
            <div className="flex items-center gap-4">
              <span className="overflow-hidden text-ellipsis">
                {getValue() as string}
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: "due_date",
        header: "Due date",
        cell: ({ getValue }) => {
          return (
            <div className="flex items-center gap-4">
              <span className="overflow-hidden text-ellipsis">
                {getValue() as string}
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: "vendor",
        header: "Vendor",
        accessorFn: (row) => row.vendor?.name || "",
        sortingFn: "alphanumeric",
        sortDescFirst: false,
        cell: ({ row, getValue }) => {
          return (
            <div
              onClick={() =>
                router.push(`/vendor/view?id=${row.original.vendor?.id}`)
              }
              className="flex items-center gap-4"
            >
              <span className="font-semibold cursor-pointer overflow-hidden text-ellipsis">
                {getValue() as string}
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: "total",
        header: "Total amount",
        cell: ({ getValue }) => {
          return (
            <div className="flex items-center gap-4">
              <span className="overflow-hidden text-ellipsis">
                {getValue() as string}
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ getValue }) => {
          const value = getValue() as string;

          return (
            <div className="flex items-center gap-1">
              <span
                className={`text-2xs border py-1 px-1.5 rounded-md ${getStatusClass(
                  value,
                )}`}
              >
                {value}
              </span>
            </div>
          );
        },
        filterFn: (row, columnId, filterValue: string[]) => {
          if (!filterValue?.length) return true;
          return filterValue.includes(row.getValue(columnId) as string);
        },
      },
    ],
    [router],
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
      {isLoading ? (
        <PageLoader />
      ) : (
        <>
          <DataTable
            noStatusFilter
            tableHeading="Bill approvals"
            tableData={filteredBillApprovals}
            columns={columns}
            setSearch={setSearch}
            search={search}
            clearSearch={() => setSearch("")}
          />
        </>
      )}
    </>
  );
};

export default BillApprovalList;
