import axiosInstance from "../api/axios";
import { BILL_API } from "../api/urls";

// Invite a new user to the platform
export const getBillsSummaryApi = async (filterKey: string | number) => {
  const response = await axiosInstance.get(
    `${BILL_API.BILL_SUMMARY}?filter=${filterKey}`,
  );
  return response;
};

export const getBarGraphDataAPI = async (filterKey: string | number) => {
  const response = await axiosInstance.get(
    `${BILL_API.BARGRAPH_DATA}?filter=${filterKey}`,
  );
  return response;
};
