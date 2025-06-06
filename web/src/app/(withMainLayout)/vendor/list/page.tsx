// Renders Vendor List page UI

"use client";

import { CheckBox, DataTable, PageLoader } from "@rever/common";
import { useApi, VENDOR_API } from "@rever/services";
import {
  VenderDataAPIType,
  VendorsAPIData,
  VendorTableList,
} from "@rever/types";
import { hasPermission } from "@rever/utils";
import { ColumnDef } from "@tanstack/react-table";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

const VendorList = () => {
  const router = useRouter();

  const [vendorList, setVendorList] = useState<VendorTableList[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Fetch vendor data from SWR
  const { data: vendors } = useApi<VendorsAPIData>(
    "vendor",
    `${VENDOR_API.MANAGE_VENDORS}?include_inactive=true`,
  );

  // Structure and set vendor data when API data changes
  useEffect(() => {
    if (vendors) {
      const structuredData = vendors?.results
        ?.sort(
          (a: VenderDataAPIType, b: VenderDataAPIType) =>
            new Date(b?.updated_at ?? 0).getTime() -
            new Date(a?.updated_at ?? 0).getTime(),
        )
        ?.map((item: VenderDataAPIType) => ({
          id: item?.id || "",
          vendorName: item?.vendor_name,
          companyName: item.company_name || "--",
          email: item.email || "--",
          taxId: item.tax_id || "--",
          status: item.is_active ? "Active" : "Inactive",
          website: item?.website,
          mobile: item.mobile || "--",
          accountNumber: item.account_number || "",
          paymentTerms: item?.payment_terms || "",
          billingAddress: {
            id: item?.billing_address?.id || "",
            line1: item?.billing_address?.line1 || "",
            line2: item?.billing_address?.line2 || "",
            city: item?.billing_address?.city || "",
            state: item?.billing_address?.state || "",
            zipCode: item?.billing_address?.zip_code || "",
            country: item?.billing_address?.country || "",
          },
        }));
      setVendorList(structuredData);
      setIsLoading(false);
    }
  }, [vendors]);

  const [search, setSearch] = useState<string>("");

  // Define columns for the DataTable, including custom rendering and filtering
  const columns: ColumnDef<VendorTableList>[] = useMemo(
    () => [
      {
        accessorKey: "vendorName",
        header: ({ table }) => (
          <div className="flex items-center gap-4">
            <CheckBox
              checked={table.getIsAllPageRowsSelected()}
              onChange={table.getToggleAllPageRowsSelectedHandler()}
            />
            <span>Vendor name</span>
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
                  router.push(`/vendor/view/?id=${row.original.id}`)
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
        accessorKey: "companyName",
        header: "Company name",
        cell: ({ getValue }) => {
          return (
            <div className="flex items-center gap-4">
              <span className="cursor-pointer overflow-hidden text-ellipsis">
                {getValue() as string}
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: "email",
        header: "Email",
        cell: ({ getValue }) => {
          return (
            <div className="flex items-center gap-4">
              <span className="cursor-pointer overflow-hidden text-ellipsis">
                {getValue() as string}
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: "taxId",
        header: "Tax ID",
        cell: ({ getValue }) => {
          return (
            <div className="flex items-center gap-4">
              <span className="cursor-pointer overflow-hidden text-ellipsis">
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
          const isActive = value.toLowerCase() === "active";

          return (
            <div className="flex items-center gap-1">
              <span
                className={`text-2xs border py-1 px-1.5 rounded-md ${
                  isActive
                    ? "text-green-600 bg-green-50 border-green-200"
                    : "text-red-500 bg-red-50 border-red-200"
                }`}
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

  // Redirect to add vendor page
  const handleRedirect = () => {
    router.push("/vendor/add");
  };

  // Filter vendors based on search input
  const filteredVendors = useMemo(() => {
    const lowerSearch = search.toLowerCase();

    return vendorList?.filter((vendor) => {
      return (
        vendor.vendorName?.toLowerCase().includes(lowerSearch) ||
        vendor.email?.toLowerCase().includes(lowerSearch) ||
        vendor.taxId?.toString().toLowerCase().includes(lowerSearch) ||
        vendor.status?.toLowerCase().includes(lowerSearch)
      );
    });
  }, [search, vendorList]);

  // Render DataTable if not loading
  return (
    <>
      {isLoading ? (
        <PageLoader />
      ) : (
        <DataTable
          onActionBtClick={handleRedirect}
          addBtnText={hasPermission("vendor", "create") ? "Create vendor" : ""}
          tableHeading="Vendors"
          tableData={filteredVendors}
          columns={columns}
          setSearch={setSearch}
          search={search}
          clearSearch={() => setSearch("")}
          flowImageSrc="/images/flowImages/vendorMasterFlow.svg"
        />
      )}
    </>
  );
};

export default VendorList;
