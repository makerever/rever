import { ManageNotificationProps, Message } from "@rever/types";
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

// Get notification list
export const getNotificationListApi = async () => {
  const response = await axiosInstance.get(NOTIFICATION_API.GET_NOTIFICATION);
  return response;
};

// Get single notification
export const getNotificationByIdApi = async (id: string) => {
  const response = await axiosInstance.get(
    `${NOTIFICATION_API.GET_NOTIFICATION}${id}`,
  );
  return response;
};

// Get notification unread count
export const getNotificationUnreadCountApi = async () => {
  const response = await axiosInstance.get(
    NOTIFICATION_API.GET_NOTIFICATION_COUNT,
  );
  return response;
};

// Notification mark read
export const markedNotifiicationAsReadApi = async (
  data: Message,
  id: string,
) => {
  const response = await axiosInstance.post(
    `${NOTIFICATION_API.GET_NOTIFICATION}${id}/mark_read/`,
    data,
  );
  return response;
};

// Delete single notification
export const deleteNotificationByIdApi = async (id: string) => {
  const response = await axiosInstance.delete(
    `${NOTIFICATION_API.GET_NOTIFICATION}${id}/`,
  );
  return response;
};
