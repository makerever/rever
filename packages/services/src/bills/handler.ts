//File for all the Bill API's

import { Bill } from "@rever/types";
import axiosInstance from "../api/axios";
import { ATTACHMENT_API, BILL_API } from "../api/urls";
import { ApproveRejectBillProps } from "@rever/types";

// Fetch the list of all bills
export const getBillsListApi = async () => {
  const response = await axiosInstance.get(BILL_API.MANAGE_BILLS);
  return response;
};

// Fetch details of a specific bill by its ID
export const getBillDetailsByIdApi = async (billId: string) => {
  const response = await axiosInstance.get(
    `${BILL_API.MANAGE_BILLS}${billId}/`,
  );
  return response;
};

// Create a new bill
export const createBillApi = async (data: Bill) => {
  const response = await axiosInstance.post(BILL_API.MANAGE_BILLS, data);
  return response;
};

// Update an existing bill by its ID
export const updateBillApi = async (data: Bill, billId: string) => {
  const response = await axiosInstance.patch(
    `${BILL_API.MANAGE_BILLS}${billId}/`,
    data,
  );
  return response;
};

// Delete a bill by its ID
export const deleteBillByIdApi = async (billId: string) => {
  const response = await axiosInstance.delete(
    `${BILL_API.MANAGE_BILLS}${billId}/`,
  );
  return response;
};

// Add an attachment to a bill
export const addBillAttachment = async (data: FormData, billId: string) => {
  const response = await axiosInstance.post(
    `${ATTACHMENT_API.ADD_ATTACH}?model=bill&id=${billId}`,
    data,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  );
  return response;
};

// Get all attachments for a specific bill
export const getBillAttachment = async (billId: string) => {
  const response = await axiosInstance.get(
    `${ATTACHMENT_API.GET_ATTACH}?model=bill&id=${billId}`,
  );
  return response;
};

// Delete a specific attachment by its ID
export const deleteBillAttachment = async (id: string) => {
  const response = await axiosInstance.delete(
    `${ATTACHMENT_API.DELETE_ATTACH}${id}/delete/`,
  );
  return response;
};

// Send a bill for approval
export const sendBillForApprovalApi = async (billId: string | null) => {
  const response = await axiosInstance.post(
    `${BILL_API.SEND_BILL_APPROVAL}${billId}/`,
  );
  return response;
};

// Approve or reject a bill
export const acceptRejectBillApi = async (
  billData: ApproveRejectBillProps,
  billId: string | null,
) => {
  const response = await axiosInstance.post(
    `${BILL_API.APPROVE_REJECT_BILL}${billId}/`,
    billData,
  );
  return response;
};
