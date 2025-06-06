import { EnableApprovalProps } from "@rever/types";
import axiosInstance from "../api/axios";
import { APPROVAL_API } from "../api/urls";
import { addApproverSchemaValues } from "@rever/validations";

/**
 * Fetch the current approval status from the API
 */
export const getApprovalStatusApi = async (model_name: string) => {
  const response = await axiosInstance.get(
    `${APPROVAL_API.GET_APPROVAL}?model_name=${model_name}`,
  );
  return response;
};

/**
 * Enable approval status by sending data to the API
 */
export const enableApprovalStatusApi = async (data: EnableApprovalProps) => {
  const response = await axiosInstance.post(
    `${APPROVAL_API.ENABLE_APPROVAL}?model_name=${data.model_name}`,
    data,
  );
  return response;
};

/**
 * Disable approval status for the "bill" model
 */
export const disableApprovalStatusApi = async (model_name: string) => {
  const response = await axiosInstance.delete(
    `${APPROVAL_API.DISABLE_APPROVAL}?model_name=${model_name}`,
  );
  return response;
};

/**
 * Assign an approver by sending data to the API
 */
export const assignApproverApi = async (data: addApproverSchemaValues) => {
  const response = await axiosInstance.post(
    `${APPROVAL_API.ASSIGN_APPROVER}?model_name=${data.model_name}`,
    data,
  );
  return response;
};

/**
 * Fetch assigned approvers for the "bill" model
 */
export const getAssignApprovalApi = async (model_name: string) => {
  const response = await axiosInstance.get(
    `${APPROVAL_API.ASSIGN_APPROVER}?model_name=${model_name}`,
  );
  return response;
};
