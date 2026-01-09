// Renders vendor view page UI

"use client";

import { PageLoader } from "@rever/common";
import { ViewVendorDetails } from "@rever/common";
import { getVendorDetailsAPI } from "@rever/services";
import { useBreadcrumbStore } from "@rever/stores";
import {
  VenderDataAPIType,
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

  const setDynamicCrumb = useBreadcrumbStore((s) => s.setDynamicCrumb);

  // Fetch individual vendor details by ID
  const handleGetIndividualVendor = useCallback(async () => {
    const response = await getVendorDetailsAPI(idValue ?? "");
    if (response.status === 200) {
      setDynamicCrumb("/vendor/view", {
        id: response?.data?.id,
        name: response?.data?.vendor_name,
      });
      setVendorData(response.data);
      setIsLoading(false);
    } else {
      setIsLoading(false);
    }
  }, [idValue, setDynamicCrumb]);

  // Effect to redirect if no vendor ID or fetch individual vendor details
  useEffect(() => {
    if (!idValue) {
      router.push("/vendor/list");
    } else {
      handleGetIndividualVendor();
    }
  }, [handleGetIndividualVendor, idValue, router]);

  // Render vendor details, side list, and confirmation popup
  return (
    <>
      <div className="flex lg:flex-row gap-4 justify-between flex-col">
        {isLoading ? (
          <PageLoader />
        ) : (
          <>
            <div className="w-full">
              <ViewVendorDetails
                vendorData={vendorData}
                isLoading={isLoading}
              />
            </div>
            
          </>
        )}
      </div>
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
