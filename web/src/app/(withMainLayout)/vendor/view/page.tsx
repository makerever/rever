// Renders vendor view page UI

"use client";

import {
  ConfirmationPopup,
  ListSideVendorView,
  PageLoader,
  showErrorToast,
  showSuccessToast,
} from "@rever/common";
import { ViewVendorDetails } from "@rever/common";
import {
  deleteVendorByIdApi,
  getVendorDetailsAPI,
  useApi,
  VENDOR_API,
} from "@rever/services";
import {
  VenderDataAPIType,
  VendorsAPIData,
  VendorTableList,
} from "@rever/types";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";

// Main component to view vendor details with URL params
const ViewVendorWithParams = () => {
  const searchParams = useSearchParams(); // Get URL search parameters
  const idValue = searchParams.get("id"); // Extract vendor ID from query params

  const router = useRouter();

  // State for storing vendor details, loading status, vendor list, and popup state
  const [vendorData, setVendorData] = useState<VenderDataAPIType | undefined>(
    undefined,
  );
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [vendorList, setVendorList] = useState<VendorTableList[]>([]);
  const [isPopupOpen, setIsPopupOpen] = useState<boolean>(false);

  // Fetch all vendors data using custom API hook
  const { data: vendors } = useApi<VendorsAPIData>(
    "vendor",
    `${VENDOR_API.MANAGE_VENDORS}?include_inactive=true`,
  );

  // Fetch individual vendor details by ID
  const handleGetIndividualVendor = useCallback(async () => {
    const response = await getVendorDetailsAPI(idValue ?? "");
    if (response.status === 200) {
      setIsLoading(false);
      setVendorData(response.data);
    } else {
      setIsLoading(false);
    }
  }, [idValue]);

  // Effect to redirect if no vendor ID or fetch individual vendor details
  useEffect(() => {
    if (!idValue) {
      router.push("/vendor/list");
    } else {
      handleGetIndividualVendor();
    }
  }, [handleGetIndividualVendor, idValue, router]);

  // Effect to structure and set vendor list data when vendors data changes
  useEffect(() => {
    if (vendors) {
      const structuredData = vendors?.results?.map(
        (item: VenderDataAPIType) => ({
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
        }),
      );
      setVendorList(structuredData);
    }
  }, [vendors]);

  // Handle vendor change in the side list
  const handleChangeVendor = (id: string) => {
    router.push(`/vendor/view?id=${id}`);
  };

  // Handle vendor deletion and show confirmation popup
  const handleDelete = async () => {
    const response = await deleteVendorByIdApi(idValue || "");
    if (response?.status === 204) {
      setIsPopupOpen(false);
      showSuccessToast("Vendor deleted successfully");
      router.push("/vendor/list");
    } else {
      if (response?.data?.detail) {
        showErrorToast(response?.data?.detail);
      }
    }
  };

  // Render vendor details, side list, and confirmation popup
  return (
    <>
      <div className="flex lg:flex-row gap-4 justify-between flex-col">
        {isLoading ? (
          <PageLoader />
        ) : (
          <>
            <div className="lg:w-3/4 w-full">
              <ViewVendorDetails
                deleteVendor={() => setIsPopupOpen(true)}
                vendorData={vendorData}
                isLoading={isLoading}
              />
            </div>
            <div className="w-96">
              <ListSideVendorView
                changeVendor={handleChangeVendor}
                vendorId={idValue}
                vendorData={vendorList}
              />
            </div>
          </>
        )}
      </div>

      {/*Show confirmation POPUP */}
      <ConfirmationPopup
        isOpen={isPopupOpen}
        onClose={() => setIsPopupOpen(false)}
        onConfirm={handleDelete}
        message="Are you sure you want to delete this vendor?"
      />
    </>
  );
};

// Suspense wrapper for the main vendor view component
const ViewVendor = () => {
  return (
    <Suspense>
      <ViewVendorWithParams />
    </Suspense>
  );
};

export default ViewVendor;
