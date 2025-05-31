// Create vendor UI page

import { AddVendorComponent } from "@rever/common";

const AddVendor = () => {
  return (
    <>
      <p className="text-slate-800 dark:text-slate-100 text-lg font-semibold mb-6">
        Vendor details
      </p>
      <AddVendorComponent />
    </>
  );
};

export default AddVendor;
