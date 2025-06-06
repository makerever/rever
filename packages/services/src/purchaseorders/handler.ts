import { ApproveRejectBillProps, PurchaseOrder } from "@rever/types";
import axiosInstance from "../api/axios";
import { PURCHASE_ORDER_API } from "../api/urls";

// Get po's list
export const getPurchaseOrdersApi = async () => {
  const response = await axiosInstance.get(
    PURCHASE_ORDER_API.MANAGE_PURCHASE_ORDERS,
  );
  return response;
};

// Get po details by ID
export const getPODetailsByIdApi = async (poId: string) => {
  const response = await axiosInstance.get(
    `${PURCHASE_ORDER_API.MANAGE_PURCHASE_ORDERS}${poId}/`,
  );
  return response;
};

// Add new PO
export const createPOApi = async (data: PurchaseOrder) => {
  const response = await axiosInstance.post(
    PURCHASE_ORDER_API.MANAGE_PURCHASE_ORDERS,
    data,
  );
  return response;
};

// Update a PO
export const updatePOApi = async (data: PurchaseOrder, poId: string) => {
  const response = await axiosInstance.patch(
    `${PURCHASE_ORDER_API.MANAGE_PURCHASE_ORDERS}${poId}/`,
    data,
  );
  return response;
};

// Update a PO by ID
export const deletePOByIdApi = async (poId: string) => {
  const response = await axiosInstance.delete(
    `${PURCHASE_ORDER_API.MANAGE_PURCHASE_ORDERS}${poId}/`,
  );
  return response;
};

// Get po's by vendor ID
export const getPoByVendorApi = async (vendorId: string) => {
  const response = await axiosInstance.get(
    `${PURCHASE_ORDER_API.MANAGE_PURCHASE_ORDERS}by-vendor/${vendorId}`,
  );
  return response;
};

// Send a PO for approval
export const sendPOForApprovalApi = async (poID: string | null) => {
  const response = await axiosInstance.post(
    `${PURCHASE_ORDER_API.SEND_PO_APPROVAL}${poID}/`,
  );
  return response;
};

// Approve or reject a PO
export const acceptRejectPOApi = async (
  poData: ApproveRejectBillProps,
  poID: string | null,
) => {
  const response = await axiosInstance.post(
    `${PURCHASE_ORDER_API.APPROVE_REJECT_PO}${poID}/`,
    poData,
  );
  return response;
};
