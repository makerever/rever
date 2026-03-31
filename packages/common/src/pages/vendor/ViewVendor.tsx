// Component to render view vendor details

"use client";

import {
  DataTable,
  DuplicateFlag,
  PageLoader,
  PillItem,
  PopupButton,
  SidePanel,
} from "@rever/common";
import { Label } from "@rever/common";
import {
  formatDate,
  formatNumber,
  getLabelForBillStatus,
  getStatusTranslationKey,
  getStatusClass,
  hasPermission,
} from "@rever/utils";
import { getCombineAddress, getLabelForTerm } from "@rever/utils";
import {
  Bill,
  PopupButtonMenuProps,
  VenderDataAPIType,
  ViewVendorDetailsProps,
} from "@rever/types";
import { Ellipsis, FileSymlink, Paperclip, Pencil, X } from "lucide-react";
import { CustomTooltip } from "@rever/common";
import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useTranslate } from "@rever/i18n";
import { getAssociateBillsByVendorIDApi } from "@rever/services";
import { ColumnDef, sortingFns } from "@tanstack/react-table";
import { useUserStore } from "@rever/stores";
import { useRouter } from "next/navigation";

const ViewVendorDetails = ({
  vendorData,
  isLoading,
  // closeSidePanel,
  // setSidePanel,
}: ViewVendorDetailsProps) => {
  const router = useRouter();
  const translate = useTranslate();

  const [vendorRecord, setVendorRecord] = useState<
    VenderDataAPIType | undefined
  >(vendorData);

  useEffect(() => {
    setVendorRecord(vendorData);
  }, [vendorData]);

  // Fetch individual vendor details by ID
  // const handleGetIndividualVendor = async () => {
  //   const response = await getVendorDetailsAPI(vendorRecord?.id ?? "");
  //   if (response.status === 200) {
  //     setVendorRecord(response.data);
  //     // setIsLoading(false);
  //   }
  // };

  const orgDetails = useUserStore((state) => state.user?.organization);

  const [associateBillsSidePanel, setAssociateBillsSidePanel] = useState(false);

  const [associateBillsData, setAssociateBillsData] = useState<Bill[]>([]);

  const [isAssociateLoading, setIsAssociateLoading] = useState<boolean>(true);

  const [showBtnPopup, setShowBtnPopup] = useState<boolean>(false);

  const vendorDetailsRef = useRef<HTMLDivElement | null>(null);

  const [vendorDetailsheight, setVendorDetailsHeight] = useState<number | null>(
    null
  );

  const [search, setSearch] = useState<string>("");

  useEffect(() => {
    if (vendorDetailsRef.current) {
      setVendorDetailsHeight(vendorDetailsRef.current.offsetHeight);
    }
  }, [vendorDetailsRef]);

  const collator = useMemo(
    () => new Intl.Collator(undefined, { numeric: true, sensitivity: "base" }),
    []
  );

  const popupButtonItem: PopupButtonMenuProps[] = [
    {
      name: translate("vendors.actions.edit_vendor"),
      icon: <Pencil size={16} />,
      isShown: hasPermission("vendor", "update"),
      onClick: () => {
        router.push("/vendor/update?id=" + vendorData?.id);
      },
    },
    {
      name: translate("vendors.actions.associated_bills"),
      icon: <FileSymlink size={16} />,
      isShown: true,
      onClick: () => setAssociateBillsSidePanel(true),
    },
    //Delete vendor case
    // {
    //   name: "Delete vendor",
    //   icon: <Trash size={16} />,
    //   isShown: true,
    //   onClick: () => null
    // }
  ];

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
        header: ({ }) => (
          <div className="flex items-center gap-4">
            <span>{translate("bills.table_headers.bill")}</span>
          </div>
        ),
        cell: ({ row, getValue }) => {
          return (
            <div className="flex items-center gap-4">
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
        accessorKey: "po",
        header: translate("purchase_order.table_headers.po"),
        accessorFn: (row) => row.purchase_order?.po_number || "",
        sortingFn: "alphanumeric",
        sortDescFirst: false,
        cell: ({ row, getValue }) =>
          (getValue() as string) ? (
            <div
              onClick={() =>
                router.push(
                  `/purchaseorder/view?id=${row.original.purchase_order?.id}`
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
        accessorKey: "total",
        header: translate("purchase_order.table_headers.total_amount"),
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
        header: translate("bills.table_headers.stages"),
        sortDescFirst: false,
        cell: ({ row, getValue }) => {
          const value = getValue() as string;

          return (
            <div className="flex items-center pr-2 justify-between">
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
    [collator, orgDetails?.date_format, router]
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
    const lowerSearch = search.toLowerCase();

    return associateBillsData?.filter((bill: Bill) => {
      return (
        bill.bill_number?.toLowerCase().includes(lowerSearch) ||
        bill.bill_date?.toLowerCase().includes(lowerSearch) ||
        bill.due_date?.toLowerCase().includes(lowerSearch) ||
        bill.purchase_order?.po_number.toLowerCase().includes(lowerSearch) ||
        (bill?.total ?? 0).toString()?.toLowerCase().includes(lowerSearch) ||
        getLabelForBillStatus(bill?.status)?.toLowerCase().includes(lowerSearch)
      );
    });
  }, [associateBillsData, search]);

  return (
    <>
      <div>
        {/* Header with vendor name and action icons */}
        <div className="bg-secondary-200 pb-px">
          <div className="flex items-center justify-between bg-white rounded-b-[20px] p-4 pt-16 border border-secondary-200">
            <div className="flex items-center gap-2">
              <p className="text-neutral-1100 text-2xl font-medium">
                {vendorRecord?.vendor_name ?? ""}
              </p>
              <PillItem
                className={`${getStatusClass(vendorRecord?.is_active ? "Active" : "Inactive")}`}
                isRounded={true}
                name={vendorRecord?.is_active ? translate("vendors.status.active") : translate("vendors.status.inactive")}
              />
            </div>
            {/* Dropdown button for actions */}
            <div className="flex items-center gap-1">
              <PopupButton
                btnPopupItems={popupButtonItem}
                children={
                  <>
                    <button
                      className="popup-btn rounded-[8px] size-8 btn-secondary-outline"
                      onClick={() => {
                        setShowBtnPopup(true);
                      }}
                    >
                      <Ellipsis size={16} />
                    </button>
                  </>
                }
                onClose={() => {
                  setShowBtnPopup(false);
                }}
                showBtnPopup={showBtnPopup}
              />
            </div>
          </div>
          {/* Vendor main details: company, mobile, email */}
          <div
            ref={vendorDetailsRef}
            className="border border-secondary-200 rounded-[20px] bg-white p-4"
          >
            <p className="text-neutral-1100 text-xl mb-5 font-medium">
              {translate("vendors.create_vendor.vendor_details.heading")}
            </p>
            <div className="grid grid-cols-1 gap-x-5">
              <div className="flex flex-row items-center border-b border-secondary-200 h-11">
                <Label
                  text={translate("vendors.create_vendor.vendor_details.company_name") + ":"}
                  className="max-w-60 w-full text-secondary-700"
                />
                <p className="text-neutral-1100 text-sm font-medium">
                  {vendorRecord?.company_name || "--"}
                </p>
              </div>
              <div className="flex flex-row items-center border-b border-secondary-200 pt-3 pb-2 h-11">
                <Label
                  text={translate("vendors.create_vendor.vendor_details.email") + ":"}
                  className="max-w-60 w-full text-secondary-700"
                />
                <p className="text-neutral-1100 text-sm">
                  {vendorRecord?.email || "--"}
                </p>
              </div>
              <div className="flex flex-row items-center border-b border-secondary-200 pt-3 pb-2 h-11">
                <Label
                  text={translate("vendors.create_vendor.vendor_details.contact") + ":"}
                  className="max-w-60 w-full text-secondary-700"
                />
                <p className="text-neutral-1100 text-sm font-medium">
                  {vendorRecord?.mobile || "--"}
                </p>
              </div>

              <div className="flex flex-row items-center border-b border-secondary-200 pt-3 pb-2 h-11">
                <Label
                  text={translate("vendors.create_vendor.vendor_details.tax_id") + ":"}
                  className="max-w-60 w-full text-secondary-700"
                />
                <p className="text-neutral-1100 text-sm font-medium">
                  {vendorRecord?.tax_id || "--"}
                </p>
              </div>
              <div className="flex flex-row items-center border-b border-secondary-200 pt-3 pb-2 h-11">
                <Label
                  text={translate("vendors.create_vendor.vendor_details.website") + ":"}
                  className="max-w-60 w-full text-secondary-700"
                />
                <p className="text-neutral-1100 text-sm font-medium">
                  {vendorRecord?.website || "--"}
                </p>
              </div>
              <div className="flex flex-row items-center border-b border-secondary-200 pt-3 pb-2 h-11">
                <Label
                  text={translate("vendors.create_vendor.vendor_address.heading") + ":"}
                  className="max-w-60 w-full text-secondary-700"
                />
                <p className="text-neutral-1100 text-sm font-medium">
                  {vendorRecord?.billing_address ? (
                    <>
                      {getCombineAddress({
                        line1: vendorRecord?.billing_address?.line1 ?? "",
                        line2: vendorRecord?.billing_address?.line2 ?? "",
                        city: vendorRecord?.billing_address?.city ?? "",
                        state: vendorRecord?.billing_address?.state ?? "",
                        zip_code: vendorRecord?.billing_address?.zip_code ?? "",
                        country: vendorRecord?.billing_address?.country ?? "",
                      })}
                    </>
                  ) : (
                    "--"
                  )}
                </p>
              </div>
              <div className="flex flex-row items-center pt-3 h-11">
                <Label
                  text={translate("vendors.create_vendor.vendor_details.payment_terms") + ":"}
                  className="max-w-60 w-full text-secondary-700"
                />
                <p className="text-neutral-1100 text-sm font-medium">
                  {getLabelForTerm(vendorRecord?.payment_terms || "")}
                </p>
              </div>
            </div>
          </div>
          {/* Vendor bank details*/}
          <div
            className={`border border-secondary-200 rounded-[20px] bg-white p-4`}
            style={{
              minHeight: `calc(100vh - 10rem - ${vendorDetailsheight ?? 0}px - 2px)`, //4px (384) is for mesh UI - border 1px y-axis, padding 1px y-axis
            }}
          >
            <p className="text-neutral-1100 text-xl mb-5 font-medium">
              {translate("vendors.create_vendor.bank_account_details.heading")}
            </p>
            <div className="grid grid-cols-1 gap-x-5">
              <div className="flex flex-row items-center border-b border-secondary-200 h-11">
                <Label
                  text={translate("vendors.create_vendor.bank_account_details.account_holder_name")}
                  className="max-w-60 w-full text-secondary-700"
                />
                <p className="text-neutral-1100 text-sm">
                  {vendorRecord?.bank_account?.account_holder_name || "--"}
                </p>
              </div>
              <div className="flex flex-row items-center border-b border-secondary-200 pt-3 pb-2 h-11">
                <Label
                  text={translate("vendors.create_vendor.bank_account_details.account_number")}
                  className="max-w-60 w-full text-secondary-700"
                />
                <p className="text-neutral-1100 text-sm">
                  {vendorRecord?.bank_account?.account_number || "--"}
                </p>
              </div>
              <div className="flex flex-row items-center pt-3 pb-2">
                <Label
                  text={translate("vendors.create_vendor.bank_account_details.bank_name")}
                  className="max-w-60 w-full text-secondary-700"
                />
                <p className="text-neutral-1100 text-sm">
                  {vendorRecord?.bank_account?.bank_name || "--"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <SidePanel
        isOpen={associateBillsSidePanel}
        onClose={() => setAssociateBillsSidePanel(false)}
      >
        <div className="">
          <div className="flex justify-between items-center p-4">
            <p className="text-slate-800 text-lg font-medium">
              {translate("purchase_order.associate_bills")}
            </p>
            <div
              className="popup-btn rounded-[8px] size-8 btn-secondary-outline"
              onClick={() => setAssociateBillsSidePanel(false)}
            >
              <X width={16} />
            </div>
          </div>
          {isAssociateLoading ? (
            <PageLoader />
          ) : (
            <DataTable
              hideExportIcon
              tableData={filteredAssociateBills}
              columns={columns}
              setSearch={setSearch}
              search={search}
              clearSearch={() => setSearch("")}
              isHeader={false}
            />
          )}
        </div>
      </SidePanel>
    </>
  );
};

export default ViewVendorDetails;
