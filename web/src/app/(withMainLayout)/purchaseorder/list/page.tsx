// Renders Bill List page UI

"use client";

import { CheckBox, DataTable, PageLoader } from "@rever/common";
import { tabOptions } from "@rever/constants";
import { useUserStore } from "@rever/stores";
import { POAPIResponse, PurchaseOrder } from "@rever/types";
import {
  formatDate,
  formatNumber,
  getLabelForBillStatus,
  getStatusClass,
  hasPermission,
  // getStatusClass,
} from "@rever/utils";
import { ColumnDef, sortingFns } from "@tanstack/react-table";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { PURCHASE_ORDER_API, useApi } from "@rever/services";

// Main component for displaying the bill list
const PurchaseOrderList = () => {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<string | undefined>("Overview");
  const [poData, setPOData] = useState<PurchaseOrder[]>([]);
  const [search, setSearch] = useState("");

  const [isLoading, setIsLoading] = useState<boolean>(true);

  const { data: purchaseOrder } = useApi<POAPIResponse>(
    "purchaseOrder",
    PURCHASE_ORDER_API.MANAGE_PURCHASE_ORDERS,
  );

  const orgDetails = useUserStore((state) => state.user?.organization);

  const collator = useMemo(
    () => new Intl.Collator(undefined, { numeric: true, sensitivity: "base" }),
    [],
  );

  // Define columns for the DataTable
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
            <span>PO</span>
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
                  router.push(`/purchaseorder/view/?id=${row.original.id}`)
                }
                className="font-semibold cursor-pointer overflow-hidden text-ellipsis"
              >
                {getValue() as string}
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: "po_date",
        header: "PO date",
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
        header: "Delivery date",
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
            <span className="font-semibold cursor-pointer overflow-hidden text-ellipsis">
              {getValue() as string}
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
            <div className="flex items-center gap-4 py-1">
              <span className="overflow-hidden text-ellipsis">
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
        cell: ({ getValue }) => {
          const value = getValue() as string;

          return (
            <div className="flex items-center pr-2 justify-between">
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
    [collator, orgDetails?.date_format, router],
  );

  // Effect to process and set bill data when API data changes
  useEffect(() => {
    if (purchaseOrder) {
      const poData = purchaseOrder?.results
        ?.sort(
          (a: PurchaseOrder, b: PurchaseOrder) =>
            new Date(b?.updated_at ?? 0).getTime() -
            new Date(a?.updated_at ?? 0).getTime(),
        )
        ?.map((po: PurchaseOrder) => {
          return {
            id: po?.id,
            po: po?.po_number,
            po_date: po?.po_date,
            delivery_date: po?.delivery_date,
            vendor: po?.vendor,
            total: po?.total || 0,
            status: getLabelForBillStatus(po?.status),
          };
        });
      setPOData(poData);
      setIsLoading(false);
    }
  }, [purchaseOrder, orgDetails?.currency, orgDetails?.date_format]);

  // Handler to redirect to bill creation page
  const handleRedirect = () => {
    router.push("/purchaseorder/add");
  };

  // Filter PO's based on active tab and search input
  const filteredPurchaseOrder = useMemo(() => {
    const filteredByTab =
      activeTab === "Overview"
        ? poData
        : poData?.filter((po) => po.status === activeTab);

    if (!search.trim()) return filteredByTab;

    const lowerSearch = search.toLowerCase();

    return filteredByTab.filter((po) => {
      return (
        po.po?.toLowerCase().includes(lowerSearch) ||
        po.vendor?.name.toLowerCase().includes(lowerSearch) ||
        String(po.total)?.toString().toLowerCase().includes(lowerSearch) ||
        po.status?.toLowerCase().includes(lowerSearch)
      );
    });
  }, [poData, activeTab, search]);

  return (
    <>
      {/* Show table only when not loading */}
      {isLoading ? (
        <PageLoader />
      ) : (
        <DataTable
          onActionBtClick={handleRedirect}
          addBtnText={
            hasPermission("purchaseorder", "create") ? "Create PO" : ""
          }
          tableHeading="Purchase orders"
          tableData={filteredPurchaseOrder}
          columns={columns}
          tabNames={tabOptions}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          setSearch={setSearch}
          search={search}
          clearSearch={() => setSearch("")}
          flowImageSrc="/images/flowImages/poMasterFlow.svg"
        />
      )}
    </>
  );
};

export default PurchaseOrderList;
