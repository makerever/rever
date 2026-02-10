// UI for the Inbox page

"use client";

import { useRef, useState, MouseEvent, useEffect, useCallback } from "react";
import Image from "next/image";
import { Bell, BellPlus, ChevronsLeftRight, Clock, Trash } from "lucide-react";
import { Message, Option } from "@rever/types";
import {
  deleteNotificationByIdApi,
  getNotificationByIdApi,
  getNotificationListApi,
  getNotificationUnreadCountApi,
  markedNotifiicationAsReadApi,
} from "@rever/services";
import {
  Button,
  ConfirmationPopup,
  IconWrapper,
  PageLoader,
  PillItem,
  showSuccessToast,
} from "@rever/common";
import { useRouter } from "next/navigation";
import { useUserStore } from "@rever/stores";

export default function Inbox() {
  const router = useRouter();
  const [message, setMessage] = useState<Message | null>(null);
  const [width, setWidth] = useState<number>(300);
  const isResizing = useRef<boolean>(false);

  const [selectedReadFilter, setSelectedReadFilter] = useState<Option>({
    value: "all",
    label: "All",
  });

  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<Boolean>(true);
  const [sinleMessageLoading, setSinleMessageLoading] =
    useState<Boolean>(false);
  const [notificationList, setNotificationList] = useState<Message[]>([]);

  const [isConfirmDelete, setIsConfirmDelete] = useState(false);

  // Get user data from store
  const user = useUserStore((state) => state.user);

  const handleMouseDown = () => {
    isResizing.current = true;
  };

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!isResizing.current) return;
    const newWidth = width + e.movementX;

    // Ensure left panel stays within min and max limits
    const maxLeftPanelWidth = window.innerWidth - 600;
    const minLeftPanelWidth = 220;

    if (newWidth >= minLeftPanelWidth && newWidth <= maxLeftPanelWidth) {
      setWidth(newWidth);
    }
  };

  const handleMouseUp = () => {
    isResizing.current = false;
  };

  const filteredMessages = notificationList.filter((msg) => {
    if (selectedReadFilter.value === "all") return true;
    return selectedReadFilter.value === "unread" ? msg.is_read : !msg.is_read;
  });

  const getNotificationList = useCallback(async () => {
    const response = await getNotificationListApi();
    if (response?.status === 200) {
      setNotificationList(response?.data?.results);
      const responseCount = await getNotificationUnreadCountApi();
      if (responseCount?.status === 200) {
        setUnreadCount(responseCount?.data?.unread_count);
        setIsLoading(false);
      } else {
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    getNotificationList();
  }, []);

  const viewMessage = async (msg: Message) => {
    setSinleMessageLoading(true);
    const responseMessage = await getNotificationByIdApi(msg.id);
    if (responseMessage?.status === 200) {
      setMessage(responseMessage?.data);
      setSinleMessageLoading(false);
      const data = { ...msg, is_read: true };
      const response = await markedNotifiicationAsReadApi(data, msg.id);
      if (response?.status === 200) {
        getNotificationList();
      }
    } else {
      setSinleMessageLoading(false);
    }
  };

  const handleDeleteNotification = async () => {
    const response = await deleteNotificationByIdApi(message?.id || "");
    if (response?.status === 204) {
      setIsConfirmDelete(false);
      setSinleMessageLoading(false);
      setMessage(null);
      showSuccessToast("Notification deleted");
      setIsLoading(true);
      getNotificationList();
    }
  };

  return (
    <>
      <div className="rounded-b-[20px] bg-white p-4 h-28 border border-secondary-200 flex items-end justify-start">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 w-full h-8">
          <div className="flex items-center gap-2">
            <p className="text-neutral-1100 text-2xl font-medium">
              Notifications
            </p>
          </div>
        </div>
      </div>
      <div>
        {isLoading ? (
          <PageLoader />
        ) : (
          <div
            className="flex h-[calc(100vh-140px)]"
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            {/* Left Pane - Messages List */}
            <div
              className="overflow-auto h-[calc(100%-0px)] custom_scrollbar border transition duration-300 border-secondary-200 rounded-[20px] bg-white"
              style={{ width: `${width}px` }}
            >
              {/* <div className="pt-2 px-4">
            <Tabs
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              tabNames={["Notifications", "Nudges"]}
            />
          </div> */}

              <>
                {filteredMessages.length > 0 ? (
                  filteredMessages.map((msg) => (
                    <div
                      key={msg.id}
                      onClick={() => viewMessage(msg)}
                      className={`select-none p-3 border-b cursor-pointer flex items-start gap-2 transition duration-300 hover:bg-secondary-100 ${
                        message?.id === msg.id ? "bg-secondary-100" : ""
                      }`}
                    >
                      <div className="shrink-0">
                        <div
                          className={`flex items-center justify-center w-8 h-8 rounded-full text-xs ${
                            !msg.is_read
                              ? "bg-secondary-200"
                              : "bg-secondary-100"
                          }`}
                        >
                          <Bell width={16} className="text-slate-800" />
                        </div>
                      </div>

                      <div className="min-w-0">
                        <p
                          className={`${!msg.is_read ? "font-semibold" : "font-medium"} text-neutral-1100 text-sm truncate`}
                        >
                          {msg.subject}
                        </p>
                        <p 
                          className="text-xs text-neutral-700 truncate"
                          dangerouslySetInnerHTML={{__html:msg.message}}  
                        />
                        <p className="text-xs text-neutral-700 mt-1 truncate">
                          {msg.time_since_created}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div
                    className="flex flex-col items-center justify-center px-4 space-y-4"
                    style={{ height: "calc(100vh - 350px)" }}
                  >
                    <Image
                      src="/images/noDataGif.gif"
                      alt="Empty inbox"
                      width={180}
                      height={180}
                      unoptimized
                    />
                    <p className="text-xs font-medium text-neutral-700 mt-6">
                      No notifications found
                    </p>
                  </div>
                )}
              </>
            </div>

            {/* Resize Handle */}
            <div
              onMouseDown={handleMouseDown}
              className="mx-0.5 mt-5 flex justify-center cursor-ew-resize"
            >
              <ChevronsLeftRight width={16} />
            </div>

            {/* Right Pane - Message Detail */}
            <div className="flex-1 min-w-70 p-4 border bg-white border-secondary-200 rounded-[20px]">
              {sinleMessageLoading ? (
                <PageLoader />
              ) : (
                <>
                  {" "}
                  {message ? (
                    <div>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <div
                            className={`flex items-center justify-center min-w-10 min-h-10 rounded-full text-xs bg-secondary-100`}
                          >
                            <Bell width={16} />
                          </div>
                          <p className="text-sm font-medium ms-3 text-neutral-1100">
                            Notification
                          </p>
                        </div>

                        <div className="flex items-center text-xs text-neutral-700">
                          <Clock width={16} />
                          <p className="ms-1">{message.time_since_created}</p>

                          <IconWrapper
                            onClick={() => setIsConfirmDelete(true)}
                            className="ms-1 hover:bg-red-100 hover:text-red-500"
                            icon={<Trash width={16} />}
                          />
                        </div>
                      </div>

                      <div className="mt-5">
                        <p className="text-sm font-semibold text-neutral-1100">
                          {message.subject}
                        </p>
                        <p 
                          className="mt-4 text-xs text-neutral-700"
                          dangerouslySetInnerHTML={{ __html: message.message }}
                        />
                      </div>

                      {message?.object_id ? (
                        <div className="w-fit mt-10">
                          <Button
                            type="submit"
                            name="View"
                            onClick={() => {
                              user?.role === "finance_manager"
                                ? router.push(
                                    `/${message?.object_name}/${message?.object_id}/review`,
                                  )
                                : router.push(
                                    `/${message?.object_name}/view?id=${message?.object_id}`,
                                  );
                            }}
                            button_type="primary"
                          />
                        </div>
                      ) : null}
                    </div>
                  ) : (
                    <div className="pt-36 flex flex-col items-center justify-center mt-6 text-xs font-medium text-neutral-700">
                      <BellPlus className="mb-2" width={32} height={32} />
                      Select a notification to view details.
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>

      <ConfirmationPopup
        isOpen={isConfirmDelete}
        onClose={() => setIsConfirmDelete(false)}
        onConfirm={handleDeleteNotification}
        message="Are you sure you want to delete this notification?"
      />
    </>
  );
}
