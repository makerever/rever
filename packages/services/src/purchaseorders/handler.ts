import { ApproveRejectBillProps, PurchaseOrder } from "@rever/types";
import axiosInstance from "../api/axios";
import { ATTACHMENT_API, PURCHASE_ORDER_API } from "../api/urls";

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

// Get audit history for PO
export const getPOAuditHistoryApi = async (id: string) => {
  const response = await axiosInstance.get(`/audit/purchaseorder/${id}`);
  return response;
};

// Get assiciate bills by PO ID
export const getAssociateBillsByPoIDApi = async (id: string) => {
  const response = await axiosInstance.get(
    `/bills/by-purchase-order/?purchase_order_id=${id}`,
  );
  return response;
};

// Add an attachment to a PO
export const addPOAttachment = async (data: FormData, poId: string) => {
  const response = await axiosInstance.post(
    `${ATTACHMENT_API.ADD_ATTACH}?model=purchaseorder&id=${poId}`,
    data,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  );
  return response;
};

// Get all attachments for a specific PO
export const getPOAttachment = async (poId: string) => {
  const response = await axiosInstance.get(
    `${ATTACHMENT_API.GET_ATTACH}?model=purchaseorder&id=${poId}`,
  );
  return response;
};

// Delete a specific attachment by its ID
export const deletePOAttachment = async (id: string) => {
  const response = await axiosInstance.delete(
    `${ATTACHMENT_API.DELETE_ATTACH}${id}/delete/`,
  );
  return response;
};
