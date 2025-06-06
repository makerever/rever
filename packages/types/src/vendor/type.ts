// Interface types for vendors

import { VenderDataAPIType, VendorTableList } from "../common/type";

// Interface for vendor object
export interface Vendor {
  id: number;
  vendorName: string;
  companyName: string;
  email: string;
  taxId: string;
  status: "Active" | "Inactive";
}

// Interface for address type
export interface AddressTypeProps {
  id?: string | number | null;
  line1: string;
  line2: string;
  country: string;
  state: string;
  city: string;
  zip_code: string;
}

// Interface for view vendor details props
export interface ViewVendorDetailsProps {
  vendorData: VenderDataAPIType | undefined;
  isLoading: boolean;
  deleteVendor?: () => void;
}

// Interface for list side vendor view props
export interface ListSideVendorViewProps {
  vendorData: VendorTableList[];
  vendorId?: string | null;
  changeVendor?: (id: string) => void;
}

// Interface for vendors API data
export interface VendorsAPIData {
  results: VenderDataAPIType[];
}

// Interface for add vendor component type
export interface AddVendorComponentType {
  vendorId?: string;
}
