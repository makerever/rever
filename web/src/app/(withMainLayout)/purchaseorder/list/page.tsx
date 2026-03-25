// Renders Bill List page UI

"use client";

import {
  CheckBox,
  CustomTooltip,
  DataTable,
  PillItem,
  UploadFilesModal,
} from "@rever/common";
import { tabOptionsPO } from "@rever/constants";
import { useUserStore } from "@rever/stores";
import { POAPIResponse, PurchaseOrder } from "@rever/types";
import {
  formatDate,
  formatNumber,
  getLabelForBillStatus,
  getStatusTranslationKey,
  getStatusClass,
  hasPermission,
  // getStatusClass,
} from "@rever/utils";
import { ColumnDef, sortingFns } from "@tanstack/react-table";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { PURCHASE_ORDER_API, useApi } from "@rever/services";
import { Paperclip } from "lucide-react";
import { useTranslate } from "@rever/i18n";

// Main component for displaying the bill list
const PurchaseOrderList = () => {
  const router = useRouter();
  const translate = useTranslate();

  const [activeTab, setActiveTab] = useState<string | undefined>("All POs");
  const [poData, setPOData] = useState<PurchaseOrder[]>([]);
  const [search, setSearch] = useState("");

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isFileUploadModal, setIsFileUploadModal] = useState(false);

  const { data: purchaseOrder, mutate } = useApi<POAPIResponse>(
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
                  router.push(`/purchaseorder/view?id=${row.original.id}`)
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
        cell: ({ row, getValue }) =>
          getValue() ? (
            <div
              onClick={() =>
                router.push(`/vendor/view?id=${row.original.vendor?.id}`)
              }
              className="flex items-center gap-4"
            >
              <span className="underline cursor-pointer overflow-hidden text-ellipsis">
                {getValue() as string}
              </span>
            </div>
          ) : (
            "--"
          ),
      },
      {
        accessorKey: "total",
        header: translate("purchase_order.table_headers.total_amount"),
        meta: { isAmount: true },
        accessorFn: (row) => Number(row.total) || 0,
        sortingFn: "basic",
        sortDescFirst: false,
        cell: ({ getValue }) => {
          const rawAmount = getValue() as number;
          return (
            <div className="flex items-center gap-4 py-1">
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
              <div className="flex items-center pr-2 justify-between w-32">
                <PillItem
                  className={`${getStatusClass(value || "")}`}
                  isRounded={true}
                  name={
                    getStatusTranslationKey(value || "")
                      ? translate(getStatusTranslationKey(value || "")!)
                      : getLabelForBillStatus(value || "")
                  }
                />
              </div>

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
    [collator, orgDetails?.date_format, router, translate],
  );

  // Effect to process and set bill data when API data changes
  useEffect(() => {
    if (purchaseOrder) {
      const poData = purchaseOrder?.results
        ?.sort(
          (a: PurchaseOrder, b: PurchaseOrder) =>
            new Date(b?.created_at ?? 0).getTime() -
            new Date(a?.created_at ?? 0).getTime(),
        )
        ?.map((po: PurchaseOrder) => {
          return {
            id: po?.id,
            po: po?.po_number,
            po_date: po?.po_date,
            delivery_date: po?.delivery_date,
            vendor: po?.vendor,
            total: po?.total || 0,
            is_attachment: po?.is_attachment,
            status: po?.status,
          };
        });
      setPOData(poData);
      setIsLoading(false);
    }
  }, [purchaseOrder, orgDetails?.currency, orgDetails?.date_format, isLoading]);

  // Handler to redirect to bill creation page
  const handleRedirect = () => {
    router.push("/purchaseorder/add");
  };

  // Filter PO's based on active tab and search input
  const filteredPurchaseOrder = useMemo(() => {
    const filteredByTab =
      activeTab === "All POs"
        ? poData
        : poData?.filter(
          (po) => getLabelForBillStatus(po?.status || "") === activeTab,
        );

    if (!search.trim()) return filteredByTab;

    const lowerSearch = search.toLowerCase();

    return filteredByTab.filter((po) => {
      return (
        po.po?.toLowerCase().includes(lowerSearch) ||
        po.vendor?.name.toLowerCase().includes(lowerSearch) ||
        formatDate(po?.po_date, orgDetails?.date_format)
          ?.toLowerCase()
          .includes(lowerSearch) ||
        String(po.total)?.toString().toLowerCase().includes(lowerSearch) ||
        po.status?.toLowerCase().includes(lowerSearch)
      );
    });
  }, [poData, activeTab, search, orgDetails?.date_format]);

  return (
    <>
      <DataTable
        onActionBtClick={handleRedirect}
        addBtnText={hasPermission("purchaseorder", "create") ? translate("purchase_order.buttons.create_po") : ""}
        tableHeading={translate("purchase_order.heading")}
        uploadBtnText={translate("purchase_order.buttons.upload_po")}
        onUploadBtnClick={() => setIsFileUploadModal(true)}
        tableData={filteredPurchaseOrder}
        columns={columns}
        tabNames={tabOptionsPO}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        tabSeparatorAt={5}
        setSearch={setSearch}
        search={search}
        clearSearch={() => setSearch("")}
        flowImageSrc="/images/flowImages/poMasterFlow.svg"
        noStatusFilter={true}
        isLoading={isLoading}
      />

      {isFileUploadModal ? (
        <UploadFilesModal
          isOpen={isFileUploadModal}
          onClose={async () => {
            setIsLoading(true);
            await mutate();
            setIsFileUploadModal(false);
          }}
          maxFiles={50}
          acceptedFormats="application/pdf"
          document_type="purchase_order"
        />
      ) : null}
    </>
  );
};

export default PurchaseOrderList;
