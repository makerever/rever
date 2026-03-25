// Request receipt list UI

"use client";

import { CheckBox, DataTable, PageLoader } from "@rever/common";
import {
  requestReceiptListStatus,
  tabOptionsReceiptConfirm,
  TaskStatus,
} from "@rever/constants";
import { REQ_CONFIRMATION_API, useApi } from "@rever/services";
import { useUserStore } from "@rever/stores";
import { ReqReceipt } from "@rever/types";
import { formatDate, getLabelForBillStatus } from "@rever/utils";
import { ColumnDef, sortingFns } from "@tanstack/react-table";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useTranslate } from "@rever/i18n";

const RequestReceiptList = () => {
  const router = useRouter();
  const translate = useTranslate();
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [activeTab, setActiveTab] = useState<string | undefined>("Open");
  const [search, setSearch] = useState("");

  const [openConfirmList, setOpenConfirmedList] = useState<ReqReceipt[]>([]);

  const [closeConfirmedList, setCloseConfirmedList] = useState<ReqReceipt[]>(
    [],
  );

  const [requestRevokedList, setRequestRevokedList] = useState<ReqReceipt[]>(
    [],
  );

  const orgDetails = useUserStore((state) => state.user?.organization);

  const collator = useMemo(
    () => new Intl.Collator(undefined, { numeric: true, sensitivity: "base" }),
    [],
  );

  // Fetch request confirmation list data using SWR
  const { data: reqConfirmationList } = useApi<ReqReceipt[]>(
    "reqConfirmation",
    `${REQ_CONFIRMATION_API.REQ_LIST}`,
  );

  // Fetch request confirmed list data using SWR
  const { data: reqConfirmedList } = useApi<ReqReceipt[]>(
    "reqConfirmation",
    `${REQ_CONFIRMATION_API.REQ_CONFIRMED_LIST}`,
  );

  // Fetch request revoked list data using SWR
  const { data: reqRevokedList } = useApi<ReqReceipt[]>(
    "reqConfirmation",
    `${REQ_CONFIRMATION_API.REQ_REVOKED_LIST}`,
  );

  // Define columns for the DataTable
  const requestListColumns: ColumnDef<ReqReceipt>[] = useMemo(
    () => [
      {
        accessorKey: "bill",
        accessorFn: (row) => row?.bill_number || "",
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
              <div className="flex items-center ">
                <span
                  onClick={() => {
                    if (row?.original?.task_status !== "revoked") {
                      router.push(`/request-receipt/${row.original.bill_id}`);
                    }
                  }}
                  className={`${row?.original?.task_status !== "revoked" ? "cursor-pointer font-semibold" : ""} overflow-hidden text-ellipsis`}
                >
                  {getValue() as string}{" "}
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
        accessorKey: "assigned_on",
        header: translate("confirmations.assigned_on"),
        accessorFn: (row) => row.assigned_at || "",
        sortDescFirst: false,
        cell: ({ getValue }) =>
          getValue() ? (
            <div className="flex items-center gap-4">
              <span className="overflow-hidden text-ellipsis ">
                {formatDate(getValue() as Date, orgDetails?.date_format)}
              </span>
            </div>
          ) : (
            "--"
          ),
      },
      {
        accessorKey: "requested_by_name",
        header: translate("confirmations.requested_by"),
        accessorFn: (row) => row.requested_by_name || "",
        sortDescFirst: false,
        cell: ({ getValue }) =>
          getValue() ? (
            <div className="flex items-center gap-4">
              <span className="overflow-hidden text-ellipsis ">
                {getValue() as string}
              </span>
            </div>
          ) : (
            "--"
          ),
      },

      {
        accessorKey: "vendor",
        header: translate("bills.table_headers.vendor"),
        accessorFn: (row) => row?.vendor_name || "",
        sortingFn: "alphanumeric",
        sortDescFirst: false,
        cell: ({ getValue }) =>
          getValue() ? (
            <div className="flex items-center gap-4">
              <span className="overflow-hidden text-ellipsis ">
                {getValue() as string}
              </span>
            </div>
          ) : (
            "--"
          ),
      },
    ],
    [collator, orgDetails?.date_format, router, translate],
  );

  // Effect to structure and set request confirmation list data when API data changes
  useEffect(() => {
    if (reqConfirmationList) {
      if (reqConfirmationList.length) {
        const structuredData = reqConfirmationList?.map((val: ReqReceipt) => ({
          bill_id: val?.bill_id,
          bill_number: val?.bill_number,
          bill_date: val?.bill_date,
          assigned_at: val?.assigned_at,
          requested_by_name: val?.requested_by_name,
          vendor_name: val?.vendor_name,
          task_status: val?.task_status,
          status: getLabelForBillStatus(
            requestReceiptListStatus[val?.task_status as TaskStatus],
          ),
        }));
        setOpenConfirmedList(structuredData);
        setIsLoading(false);
      } else {
        setOpenConfirmedList([]);
        setIsLoading(false);
      }
    } else {
      setOpenConfirmedList([]);
    }
  }, [orgDetails?.currency, orgDetails?.date_format, reqConfirmationList]);

  // Effect to structure and set request confirmed list data when API data changes
  useEffect(() => {
    if (reqConfirmedList) {
      if (reqConfirmedList.length) {
        const structuredData = reqConfirmedList?.map((val: ReqReceipt) => ({
          bill_id: val?.bill_id,
          bill_number: val?.bill_number,
          bill_date: val?.bill_date,
          assigned_at: val?.assigned_at,
          completed_at: val?.completed_at,
          requested_by_name: val?.requested_by_name,
          vendor_name: val?.vendor_name,
          task_status: val?.task_status,
          status: getLabelForBillStatus(
            requestReceiptListStatus[val?.task_status as TaskStatus],
          ),
        }));
        setCloseConfirmedList(structuredData);
        setIsLoading(false);
      } else {
        setCloseConfirmedList([]);
        setIsLoading(false);
      }
    } else {
      setCloseConfirmedList([]);
    }
  }, [orgDetails?.currency, orgDetails?.date_format, reqConfirmedList]);

  // Effect to structure and set request revoked list data when API data changes
  useEffect(() => {
    if (reqRevokedList) {
      if (reqRevokedList.length) {
        const structuredData = reqRevokedList?.map((val: ReqReceipt) => ({
          bill_id: val?.bill_id,
          bill_number: val?.bill_number,
          bill_date: val?.bill_date,
          assigned_at: val?.assigned_at,
          requested_by_name: val?.requested_by_name,
          vendor_name: val?.vendor_name,
          task_status: val?.task_status,
          status: getLabelForBillStatus(
            requestReceiptListStatus[val?.task_status as TaskStatus],
          ),
        }));
        setRequestRevokedList(structuredData);
        setIsLoading(false);
      } else {
        setRequestRevokedList([]);
        setIsLoading(false);
      }
    } else {
      setRequestRevokedList([]);
    }
  }, [orgDetails?.currency, orgDetails?.date_format, reqRevokedList]);

  // Filter data based on active tab and search input
  const filteredOpenConfirmList = useMemo(() => {
    const lowerSearch = search.toLowerCase();
    return openConfirmList.filter((bill) => {
      return (
        bill?.bill_number?.toLowerCase().includes(lowerSearch) ||
        formatDate(bill?.bill_date, orgDetails?.date_format)
          ?.toLowerCase()
          .includes(lowerSearch) ||
        formatDate(bill?.assigned_at, orgDetails?.date_format)
          ?.toLowerCase()
          .includes(lowerSearch) ||
        bill?.requested_by_name?.toLowerCase().includes(lowerSearch) ||
        bill?.vendor_name?.toLowerCase().includes(lowerSearch)
      );
    });
  }, [openConfirmList, search, orgDetails?.date_format]);

  // Filter data based on active tab and search input
  const filteredClosedConfirmList = useMemo(() => {
    const lowerSearch = search.toLowerCase();
    return closeConfirmedList.filter((bill) => {
      return (
        bill?.bill_number?.toLowerCase().includes(lowerSearch) ||
        formatDate(bill?.bill_date, orgDetails?.date_format)
          ?.toLowerCase()
          .includes(lowerSearch) ||
        formatDate(bill?.assigned_at, orgDetails?.date_format)
          ?.toLowerCase()
          .includes(lowerSearch) ||
        formatDate(bill?.completed_at, orgDetails?.date_format)
          ?.toLowerCase()
          .includes(lowerSearch) ||
        bill?.requested_by_name?.toLowerCase().includes(lowerSearch) ||
        bill?.vendor_name?.toLowerCase().includes(lowerSearch)
      );
    });
  }, [closeConfirmedList, search, orgDetails?.date_format]);

  // Filter data based on active tab and search input
  const filteredRevokedList = useMemo(() => {
    const lowerSearch = search.toLowerCase();
    return requestRevokedList.filter((bill) => {
      return (
        bill?.bill_number?.toLowerCase().includes(lowerSearch) ||
        formatDate(bill?.bill_date, orgDetails?.date_format)
          ?.toLowerCase()
          .includes(lowerSearch) ||
        formatDate(bill?.assigned_at, orgDetails?.date_format)
          ?.toLowerCase()
          .includes(lowerSearch) ||
        bill?.requested_by_name?.toLowerCase().includes(lowerSearch) ||
        bill?.vendor_name?.toLowerCase().includes(lowerSearch)
      );
    });
  }, [requestRevokedList, search, orgDetails?.date_format]);

  return (
    <>
      {isLoading ? (
        <PageLoader />
      ) : (
        <>
          {activeTab === "Open" ? (
            <DataTable
              tableHeading={translate("confirmations.request_confirmations")}
              tableData={filteredOpenConfirmList}
              columns={requestListColumns}
              tabNames={tabOptionsReceiptConfirm}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              setSearch={setSearch}
              search={search}
              clearSearch={() => setSearch("")}
              noStatusFilter
            />
          ) : activeTab === "Closed" ? (
            <DataTable
              tableHeading={translate("confirmations.request_confirmations")}
              tableData={filteredClosedConfirmList}
              columns={requestListColumns}
              tabNames={tabOptionsReceiptConfirm}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              setSearch={setSearch}
              search={search}
              clearSearch={() => setSearch("")}
              noStatusFilter
            />
          ) : (
            <DataTable
              tableHeading={translate("confirmations.request_confirmations")}
              tableData={filteredRevokedList}
              columns={requestListColumns}
              tabNames={tabOptionsReceiptConfirm}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              setSearch={setSearch}
              search={search}
              clearSearch={() => setSearch("")}
              noStatusFilter
            />
          )}
        </>
      )}
    </>
  );
};

export default RequestReceiptList;
