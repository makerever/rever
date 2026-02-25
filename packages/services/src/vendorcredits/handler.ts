//File for all the vendor credit API's

import axiosInstance from "../api/axios";
import { ATTACHMENT_API, INTELLIDOCS_API, VENOR_CREDIT_API } from "../api/urls";
import {
  ApproveRejectVendorCreditProps,
  VendorCreditProps,
} from "@rever/types";

// Fetch the list of all vendor credits
export const getVendorCreditListApi = async () => {
  const response = await axiosInstance.get(
    VENOR_CREDIT_API.MANAGE_VENDOR_CREDIT,
  );
  return response;
};

// Fetch details of a specific vendor credit by its ID
export const getVendorCreditDetailsByIdApi = async (vendorCreditID: string) => {
  const response = await axiosInstance.get(
    `${VENOR_CREDIT_API.MANAGE_VENDOR_CREDIT}${vendorCreditID}/`,
  );
  return response;
};

// Create a new vendor credit
export const createVendorCreditApi = async (data: VendorCreditProps) => {
  const response = await axiosInstance.post(
    VENOR_CREDIT_API.MANAGE_VENDOR_CREDIT,
    data,
  );
  return response;
};

// Update an existing vendor credit by its ID
export const updateVendorCreditApi = async (
  data: VendorCreditProps,
  vendorCreditID: string,
) => {
  const response = await axiosInstance.patch(
    `${VENOR_CREDIT_API.MANAGE_VENDOR_CREDIT}${vendorCreditID}/`,
    data,
  );
  return response;
};

// Delete a vendor credit by its ID
export const deleteVendorCreditByIdApi = async (vendorCreditID: string) => {
  const response = await axiosInstance.delete(
    `${VENOR_CREDIT_API.MANAGE_VENDOR_CREDIT}${vendorCreditID}/`,
  );
  return response;
};

// Add an attachment to a vendor credit
export const addVendorCreditAttachment = async (
  data: FormData,
  vendorCreditID: string,
) => {
  const response = await axiosInstance.post(
    `${ATTACHMENT_API.ADD_ATTACH}?model=vendorcredit&id=${vendorCreditID}`,
    data,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  );
  return response;
};

// Get all attachments for a specific vendor credit
export const getVendorCreditAttachment = async (vendorCreditID: string) => {
  const response = await axiosInstance.get(
    `${ATTACHMENT_API.GET_ATTACH}?model=vendorcredit&id=${vendorCreditID}`,
  );
  return response;
};

// Delete a specific attachment by its ID
export const deleteVendorCreditAttachment = async (id: string) => {
  const response = await axiosInstance.delete(
    `${ATTACHMENT_API.DELETE_ATTACH}${id}/delete/`,
  );
  return response;
};

// Send a vendor credit for approval
export const sendVendorCreditForApprovalApi = async (
  vendorCreditID: string | null,
) => {
  const response = await axiosInstance.post(
    `${VENOR_CREDIT_API.SEND_VENDOR_CREDIT_APPROVAL}${vendorCreditID}/`,
  );
  return response;
};

// Approve or reject a vendor credit
export const acceptRejectVendorCreditApi = async (
  vendorCreditData: ApproveRejectVendorCreditProps,
  vendorCreditID: string | null,
) => {
  const response = await axiosInstance.post(
    `${VENOR_CREDIT_API.APPROVE_REJECT_VENDOR_CREDIT}${vendorCreditID}/`,
    vendorCreditData,
  );
  return response;
};

// Get audit history for vendor credits
export const getVendorCreditAuditHistoryApi = async (id: string) => {
  const response = await axiosInstance.get(
    `${VENOR_CREDIT_API.AUDIT_HISTORY}${id}`,
  );
  return response;
};

export const getIndividualVendorCreditAuditApi = async (vendor_credit_id: string, history_id: number) => {
  const response = await axiosInstance.get(`/audit/vendorcredit/${vendor_credit_id}/history/${history_id}`);
  return response;
}

// Upload a vendor credit file
export const uploadVendorCreditDocument = async (data: FormData) => {
  const response = await axiosInstance.post(
    `${INTELLIDOCS_API.UPLOAD_DOCUMENT}`,
    data,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  );
  return response;
};

// Get uploaded vendor credit document
export const getVendorCreditDocument = async (id: string) => {
  const response = await axiosInstance.get(
    `${INTELLIDOCS_API.UPLOAD_DOCUMENT}${id}`,
  );
  return response;
};