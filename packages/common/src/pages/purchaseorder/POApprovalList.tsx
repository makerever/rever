// Renders Approval PO List page UI

"use client";

import { CheckBox, CustomTooltip, PillItem } from "@rever/common";
import { DataTable } from "@rever/common";
import { PURCHASE_ORDER_API, useApi } from "@rever/services";
import { useUserStore } from "@rever/stores";
import { ApprovalTypes, PurchaseOrder } from "@rever/types";
import {
  formatDate,
  formatNumber,
  getLabelForBillStatus,
  getStatusClass,
} from "@rever/utils";
import { ColumnDef, sortingFns } from "@tanstack/react-table";
import { Paperclip } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useTranslate } from "@rever/i18n";

// Main component for displaying the approval list
const POApprovalList = ({ tabs, activeTab, setActiveTab }: ApprovalTypes) => {
  const router = useRouter();
  const translate = useTranslate();

  const [poApprovalList, setPoApprovalList] = useState<PurchaseOrder[]>([]);

  const orgDetails = useUserStore((state) => state.user?.organization);

  // Fetch approval PO data using SWR
  const { data: underApprovalPO, isLoading } = useApi<PurchaseOrder[]>(
    "approavls",
    `${PURCHASE_ORDER_API.UNDER_APPROVAL_PO}`,
  );

  // Effect to structure and set approval list data when API data changes
  useEffect(() => {
    if (underApprovalPO) {
      if (underApprovalPO.length) {
        const structuredData = underApprovalPO?.map((val: PurchaseOrder) => ({
          id: val?.id,
          po: val?.po_number,
          po_date: val?.po_date,
          delivery_date: val?.delivery_date,
          vendor: val?.vendor,
          total: val?.total || 0,
          is_attachment: val?.is_attachment,
          status: val?.status,
        }));
        setPoApprovalList(structuredData);
      } else {
        setPoApprovalList([]);
      }
    } else {
      setPoApprovalList([]);
    }
  }, [orgDetails?.currency, orgDetails?.date_format, underApprovalPO]);

  const [search, setSearch] = useState<string>("");

  // Define table columns using useMemo for performance
  const collator = useMemo(
    () => new Intl.Collator(undefined, { numeric: true, sensitivity: "base" }),
    [],
  );

  const columns: ColumnDef<PurchaseOrder>[] = useMemo(
    () => [
      {
        accessorKey: "po",
        accessorFn: (row) => row.po || "",
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
            <span>{translate("purchase_order.table_headers.po")}</span>
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
                  router.push(`/purchaseorder/${row?.original?.id}/review`)
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
        accessorKey: "po_date",
        header: translate("purchase_order.table_headers.po_date"),
        accessorFn: (row) => (row.po_date ? new Date(row.po_date) : null),
        sortingFn: sortingFns.datetime,
        sortDescFirst: false,
        cell: ({ getValue }) => (
          <div className="flex items-center gap-4">
            <span className="overflow-hidden text-ellipsis">
              {formatDate(getValue() as Date, orgDetails?.date_format)}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "delivery_date",
        header: translate("purchase_order.table_headers.delivery_date"),
        accessorFn: (row) =>
          row.delivery_date ? new Date(row.delivery_date) : null,
        sortingFn: sortingFns.datetime,
        sortDescFirst: false,
        cell: ({ getValue }) => (
          <div className="flex items-center gap-4">
            <span className="overflow-hidden text-ellipsis">
              {formatDate(getValue() as Date, orgDetails?.date_format)}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "vendor",
        header: translate("purchase_order.table_headers.vendor"),
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
            <span className="underline cursor-pointer overflow-hidden text-ellipsis">
              {(getValue() as string) || "--"}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "total",
        header: translate("purchase_order.table_headers.total_amount"),
        accessorFn: (row) => Number(row.total) || 0,
        sortingFn: "basic",
        sortDescFirst: false,
        cell: ({ getValue }) => {
          const rawAmount = Number(getValue()) || 0;
          return (
            <div className="flex items-center gap-4 py-1">
              <span className="overflow-hidden text-ellipsis w-full">
                {formatNumber(rawAmount)}
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
                className={`${getStatusClass(getLabelForBillStatus(value) || "")}`}
                isRounded={true}
                name={getLabelForBillStatus(value || "")}
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
    [collator, orgDetails?.date_format, router],
  );

  // Filter approvals based on search input
  const filteredPOApprovals = useMemo(() => {
    const lowerSearch = search.toLowerCase();

    return poApprovalList?.filter((approval) => {
      return (
        approval.po?.toLowerCase().includes(lowerSearch) ||
        approval.vendor?.name?.toLowerCase().includes(lowerSearch)
      );
    });
  }, [search, poApprovalList]);

  return (
    <>
      <DataTable
        noStatusFilter
        tableHeading={translate("sidebar.expenses.approvals")}
        tableData={filteredPOApprovals}
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

export default POApprovalList;
