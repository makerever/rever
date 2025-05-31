//API function to get the vendor details

import { VenderDataAPIType } from "@rever/types";
import axiosInstance from "../api/axios";
import { VENDOR_API } from "../api/urls";

// Fetch all vendors
export const getVendorsDataAPI = async () => {
  const response = await axiosInstance.get(VENDOR_API.MANAGE_VENDORS);
  return response;
};

// Create a new vendor
export const createNewVendorAPI = async (params: VenderDataAPIType) => {
  const response = await axiosInstance.post(VENDOR_API.MANAGE_VENDORS, params);
  return response;
};

// Get details of a specific vendor by ID
export const getVendorDetailsAPI = async (id: string) => {
  const response = await axiosInstance.get(VENDOR_API.MANAGE_VENDORS + `${id}`);
  return response;
};

// Update an existing vendor by ID
export const updateVendorAPI = async (params: VenderDataAPIType) => {
  const response = await axiosInstance.patch(
    VENDOR_API.MANAGE_VENDORS + `${params.id}/`,
    params,
  );
  return response;
};

// Delete a vendor by ID
export const deleteVendorByIdApi = async (vendorId: string) => {
  const response = await axiosInstance.delete(
    `${VENDOR_API.MANAGE_VENDORS}${vendorId}/`,
  );
  return response;
};
