// Renders vendor credit List page UI

"use client";

import {
  CheckBox,
  CustomTooltip,
  DataTable,
  PillItem,
  UploadFilesModal,
} from "@rever/common";
import { tabOptionsVendorCredit } from "@rever/constants";
import { useApi, VENOR_CREDIT_API } from "@rever/services";
import { useUserStore } from "@rever/stores";
import { CreditNoteApiResponse, VendorCreditProps } from "@rever/types";
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

// Main component for displaying the vendor credit list
const VendorCreditList = () => {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<string | undefined>("All vendor credits");
  const [vendorCreditData, setVendorCreditData] = useState<VendorCreditProps[]>(
    [],
  );
  const [search, setSearch] = useState("");

  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Fetch vendor credits from SWR
  const { data: vendorCredit, mutate } = useApi<CreditNoteApiResponse>(
    "vendorCredit",
    VENOR_CREDIT_API.MANAGE_VENDOR_CREDIT,
  );

  const orgDetails = useUserStore((state) => state.user?.organization);

  const collator = useMemo(
    () => new Intl.Collator(undefined, { numeric: true, sensitivity: "base" }),
    [],
  );

  const [isFileUploadModal, setIsFileUploadModal] = useState(false);

  // Define columns for the DataTable
  const columns: ColumnDef<VendorCreditProps>[] = useMemo(
    () => [
      {
        accessorKey: "credit_note_number",
        accessorFn: (row) => row.credit_note_number || "",
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
            <span>Vendor credit</span>
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
                <span
                  onClick={() =>
                    router.push(`/vendorcredit/view?id=${row.original.id}`)
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
        accessorKey: "txn_date",
        header: "Vendor credit date",
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
        accessorKey: "credit_amount",
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
        cell: ({ row, getValue }) => {
          const value = getValue() as string;

          return (
            <div className="flex items-center pr-2 justify-between">
              <div className="flex items-center pr-2 justify-between w-32">
                <PillItem
                  className={`${getStatusClass(getLabelForBillStatus(value) || "")}`}
                  isRounded={true}
                  name={getLabelForBillStatus(value || "")}
                />
              </div>
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

  // Effect to process and set vendor credit data when API data changes
  useEffect(() => {
    if (vendorCredit) {
      const vendorCreditData = vendorCredit?.results
        ?.sort(
          (a: VendorCreditProps, b: VendorCreditProps) =>
            new Date(b?.created_at ?? 0).getTime() -
            new Date(a?.created_at ?? 0).getTime(),
        )
        ?.map((val: VendorCreditProps) => {
          return {
            id: val?.id,
            credit_note_number: val?.credit_note_number,
            txn_date: val?.txn_date,
            vendor: val?.vendor,
            total: val?.total,
            is_attachment: val?.is_attachment,
            status: val?.status,
          };
        });
      setVendorCreditData(vendorCreditData);
      setIsLoading(false);
    }
  }, [vendorCredit, orgDetails?.currency, orgDetails?.date_format, isLoading]);

  // Handler to redirect to vendor credit creation page
  const handleRedirect = () => {
    router.push("/vendorcredit/add");
  };

  // Filter vendor credits based on active tab and search input
  const filteredVendorCredits = useMemo(() => {
    const filteredByTab =
      activeTab === "All vendor credits"
        ? vendorCreditData
        : vendorCreditData?.filter(
          (credit) =>
            getLabelForBillStatus(credit?.status || "") === activeTab,
        );

    if (!search.trim()) return filteredByTab;

    const lowerSearch = search.toLowerCase();

    return filteredByTab.filter((credit) => {
      return (
        credit?.credit_note_number?.toLowerCase().includes(lowerSearch) ||
        credit?.vendor?.name.toLowerCase().includes(lowerSearch) ||
        formatDate(credit?.txn_date, orgDetails?.date_format)
          ?.toLowerCase()
          .includes(lowerSearch) ||
        credit?.total?.toString().toLowerCase().includes(lowerSearch) ||
        credit.status?.toLowerCase().includes(lowerSearch)
      );
    });
  }, [vendorCreditData, activeTab, search, orgDetails?.date_format]);

  return (
    <>
      <DataTable
        onActionBtClick={handleRedirect}
        addBtnText="Create vendor credit"
        uploadBtnText="Upload vendor credits"
        tableHeading="Vendor credits"
        tableData={filteredVendorCredits}
        columns={columns}
        tabNames={tabOptionsVendorCredit}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        tabSeparatorAt={6}
        setSearch={setSearch}
        search={search}
        clearSearch={() => setSearch("")}
        // flowImageSrc="/images/flowImages/billMasterFlow.svg"
        onUploadBtnClick={() => setIsFileUploadModal(true)}
        noStatusFilter
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
          document_type="vendor_credit"
        />
      ) : null}
    </>
  );
};

export default VendorCreditList;