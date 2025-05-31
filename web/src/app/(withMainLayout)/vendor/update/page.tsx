// Update vendor UI

"use client";

import { AddVendorComponent } from "@rever/common";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

// UI component for updating a vendor
const UpdateVendorUI = () => {
  const searchParams = useSearchParams(); // Get URL search parameters
  const vendorId = searchParams.get("id"); // Extract vendor ID from query params

  return (
    <>
      <p className="text-slate-800 dark:text-slate-100 text-lg font-semibold mb-6">
        Vendor details
      </p>
      <AddVendorComponent
        vendorId={String(vendorId)} // Pass vendor ID to AddVendorComponent
      />
    </>
  );
};

// Wrapper component to provide Suspense for UpdateVendorUI
const UpdateVendor = () => {
  return (
    <Suspense>
      <UpdateVendorUI />
    </Suspense>
  );
};

export default UpdateVendor;
