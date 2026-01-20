// Renders Bill List page UI

"use client";

import {
  CheckBox,
  CustomTooltip,
  DataTable,
  DuplicateFlag,
  PillItem,
  UploadFilesModal,
} from "@rever/common";
import { tabOptionsBill } from "@rever/constants";
import { BILL_API, useApi } from "@rever/services";
import { useUserStore } from "@rever/stores";
import { Bill, BillApiResponse } from "@rever/types";
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

// Main component for displaying the bill list
const BillList = () => {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<string | undefined>("All Bills");
  const [billData, setBillData] = useState<Bill[]>([]);
  const [search, setSearch] = useState("");

  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Fetch bills from SWR
  const { data: bill, mutate } = useApi<BillApiResponse>(
    "bill",
    BILL_API.MANAGE_BILLS,
  );

  const orgDetails = useUserStore((state) => state.user?.organization);

  const collator = useMemo(
    () => new Intl.Collator(undefined, { numeric: true, sensitivity: "base" }),
    [],
  );

  const [isFileUploadModal, setIsFileUploadModal] = useState(false);

  // Define columns for the DataTable
  const columns: ColumnDef<Bill>[] = useMemo(
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
              <span className="underline cursor-pointer overflow-hidden text-ellipsis ">
                {(getValue() as string) || "--"}
              </span>
            </div>
          ) : (
            "--"
          ),
      },
      {
        accessorKey: "vendor",
        header: "Vendor",
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
        header: "Stages",
        sortDescFirst: false,
        cell: ({ getValue }) => {
          const value = getValue() as string;

          return (
            <div className="flex items-center pr-2 justify-between w-32">
              <PillItem
                className={`${getStatusClass(getLabelForBillStatus(value) || "")}`}
                isRounded={true}
                name={getLabelForBillStatus(value || "")}
              />
            </div>
          );
        },
        filterFn: (row, columnId, filterValue: string[]) => {
          if (!filterValue?.length) return true;
          return filterValue.includes(row.getValue(columnId) as string);
        },
      },
      {
        accessorKey: "match_status",
        header: "Status",
        sortDescFirst: false,
        cell: ({ row, getValue }) => {
          const value = getValue() as string;
          return (
            <div className="flex items-center pr-2 justify-between">
              <PillItem
                className={`${getStatusClass(getLabelForBillStatus(value) || "")}`}
                isRounded={true}
                name={getLabelForBillStatus(value || "")}
              />

              {row?.original.is_attachment && (
                <CustomTooltip content="PDF attached">
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

  // Effect to process and set bill data when API data changes
  useEffect(() => {
    if (bill) {
      const billData = bill?.results
        ?.sort(
          (a: Bill, b: Bill) =>
            new Date(b?.created_at ?? 0).getTime() -
            new Date(a?.created_at ?? 0).getTime(),
        )
        ?.map((val: Bill) => {
          return {
            id: val?.id,
            bill: val?.bill_number,
            bill_date: val?.bill_date,
            due_date: val?.due_date,
            vendor: val?.vendor,
            purchase_order: val?.purchase_order,
            total: val?.total || 0,
            is_attachment: val?.is_attachment,
            is_duplicate: val?.is_duplicate,
            status: val?.status,
            match_status: val?.match_status,
          };
        });
      setBillData(billData);
      setIsLoading(false);
    }
  }, [bill, orgDetails?.currency, orgDetails?.date_format, isLoading]);

  // Handler to redirect to bill creation page
  const handleRedirect = () => {
    router.push("/bill/add");
  };

  // Filter bills based on active tab and search input
  const filteredBills = useMemo(() => {
    const filteredByTab =
      activeTab === "All Bills"
        ? billData
        : billData?.filter(
          (bill) => getLabelForBillStatus(bill?.status || "") === activeTab,
        );

    if (!search.trim()) return filteredByTab;

    const lowerSearch = search.toLowerCase();

    return filteredByTab.filter((bill) => {
      return (
        bill.bill?.toLowerCase().includes(lowerSearch) ||
        bill.vendor?.name.toLowerCase().includes(lowerSearch) ||
        formatDate(bill?.bill_date, orgDetails?.date_format)
          ?.toLowerCase()
          .includes(lowerSearch) ||
        bill?.purchase_order?.po_number?.toLowerCase().includes(lowerSearch) ||
        bill.total?.toString().toLowerCase().includes(lowerSearch) ||
        bill.status?.toLowerCase().includes(lowerSearch)
      );
    });
  }, [billData, activeTab, search, orgDetails?.date_format]);

  return (
    <>
      <DataTable
        onActionBtClick={handleRedirect}
        addBtnText="Create Bill"
        uploadBtnText="Upload Bills"
        tableHeading="Bills"
        tableData={filteredBills}
        columns={columns}
        tabNames={tabOptionsBill}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        tabSeparatorAt={5}
        setSearch={setSearch}
        search={search}
        clearSearch={() => setSearch("")}
        flowImageSrc="/images/flowImages/billMasterFlow.svg"
        onUploadBtnClick={() => setIsFileUploadModal(true)}
        // isBillEmailConfigured={orgDetails?.ap_intake_email}
        isBillEmailConfigured={""}
        isLoading={isLoading}
      />

      {isFileUploadModal ? (
        <UploadFilesModal
          isOpen={isFileUploadModal}
          onClose={() => {
            setIsLoading(true);
            mutate();
            setIsFileUploadModal(false);
          }}
          maxFiles={50}
          acceptedFormats="application/pdf"
          document_type="bill"
        />
      ) : null}
    </>
  );
};

export default BillList;
