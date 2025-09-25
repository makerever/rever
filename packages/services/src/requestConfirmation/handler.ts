//API function to handle request confirmation related operations

import { ReqConfirmationApiType, ReqConfirmedApiType } from "@rever/types";
import axiosInstance from "../api/axios";
import { REQ_CONFIRMATION_API } from "../api/urls";

// Get all requested list
export const getRequestedListApi = async () => {
  const response = await axiosInstance.get(REQ_CONFIRMATION_API.REQ_LIST);
  return response;
};

// Get all requested confirmations list
export const getRequestedConfirmListApi = async () => {
  const response = await axiosInstance.get(
    REQ_CONFIRMATION_API.REQ_CONFIRMED_LIST,
  );
  return response;
};

// Request confirmation for a specific bill
export const requestConfirmationApi = async (
  billId: string,
  data: ReqConfirmationApiType,
) => {
  const response = await axiosInstance.post(
    `${REQ_CONFIRMATION_API.REQ_CONFIRMATION}${billId}/request/`,
    data,
  );
  return response;
};

// Confirm a request for a specific bill
export const confirmRequestApi = async (
  billId: string,
  data: ReqConfirmedApiType,
) => {
  const response = await axiosInstance.post(
    `${REQ_CONFIRMATION_API.REQ_CONFIRMATION}${billId}/confirm/`,
    data,
  );
  return response;
};

// Remind a user about a request confirmation
export const remindRequestConfirmationApi = async (
  billId: string,
  data: ReqConfirmationApiType,
) => {
  const response = await axiosInstance.post(
    `${REQ_CONFIRMATION_API.REQ_CONFIRMATION}${billId}/remind/`,
    data,
  );
  return response;
};

// Get confirmation history of a specific request confirmation
export const getRequestConfirmationHistoryApi = async (billId: string) => {
  const response = await axiosInstance.get(
    `${REQ_CONFIRMATION_API.REQ_CONFIRMATION}${billId}/tasks/`,
  );
  return response;
};
