import { ManageNotificationProps } from "@rever/types";
import axiosInstance from "../api/axios";
import { NOTIFICATION_API } from "../api/urls";

// Get notification list
export const getNotificationStatusApi = async () => {
  const response = await axiosInstance.get(
    NOTIFICATION_API.MANAGE_NOTIFICATION,
  );
  return response;
};

// Update notification list
export const updateNotificationStatusApi = async (
  data: ManageNotificationProps,
) => {
  const response = await axiosInstance.patch(
    NOTIFICATION_API.MANAGE_NOTIFICATION,
    data,
  );
  return response;
};
