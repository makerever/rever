// Manage notification page

"use client";

import { PageLoader, showSuccessToast, ToggleSwitch } from "@rever/common";
import {
  getNotificationStatusApi,
  updateNotificationStatusApi,
} from "@rever/services";
import { ManageNotificationProps } from "@rever/types";
import { useEffect, useState } from "react";
import { useTranslate } from "@rever/i18n";

// Notification settings component
const Notification = () => {
  const translate = useTranslate();
  // State for first notification preference (e.g., transaction submitted)
  const [notiPreferenceApp1, setNotiPreferenceApp1] = useState<boolean>(false);
  // State for second notification preference (e.g., transaction approved)
  const [notiPreferenceApp2, setNotiPreferenceApp2] = useState<boolean>(false);

  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    getNotificationStatus();
  }, []);

  const getNotificationStatus = async () => {
    const response = await getNotificationStatusApi();
    if (response?.status === 200) {
      setNotiPreferenceApp1(response?.data?.notify_on_approval_request);
      setNotiPreferenceApp2(response?.data?.notify_on_approval_result);
      setIsLoading(false);
    }
  };

  const updateNotificationStatus = async (val: boolean, key: string) => {
    const data: ManageNotificationProps = {};
    if (key === "1") {
      data.notify_on_approval_request = val;
      setNotiPreferenceApp1(val);
    } else if (key === "2") {
      data.notify_on_approval_result = val;
      setNotiPreferenceApp2(val);
    }
    const responseData = await updateNotificationStatusApi(data);

    if (responseData?.status === 200) {
      showSuccessToast(translate("preferences.updated"));
    }
  };

  return (
    <>
      <div className="flex items-center justify-between bg-white rounded-b-[20px] p-4 pt-16 border border-secondary-200">
        <div className="flex items-center justify-between w-full h-8">
          <div className="flex items-center gap-3">
            <p className="text-neutral-1100 text-2xl font-medium">
              {translate("profile_sidebar.preferences")}
            </p>
          </div>
        </div>
      </div>
      {isLoading ? (
        <PageLoader />
      ) : (
        <div
          className="w-full bg-white border border-secondary-200 rounded-[20px] p-4"
          style={{
            minHeight: `calc(100vh - 10rem - 2px)`,
          }}
        >
          {/* Toggle for transaction submitted notification */}
          <div className="flex items-start justify-start gap-3 pb-3 border-b border-neutral-200">
            <ToggleSwitch
              isOn={notiPreferenceApp1}
              setIsOn={(val) => updateNotificationStatus(val, "1")}
            />
            <div className="-mt-0.5">
              <p className="font-medium text-sm text-neutral-1100 dark:text-gray-200">
                {translate("preferences.notify_submitted")}
              </p>
              <p className="mt-1 font-medium text-xs text-neutral-700 dark:text-gray-200">
                {translate("preferences.notify_submitted_desc")}
              </p>
            </div>
          </div>

          {/* Toggle for transaction approved notification */}
          <div className="flex items-start justify-start gap-3 pt-3">
            <ToggleSwitch
              isOn={notiPreferenceApp2}
              setIsOn={(val) => updateNotificationStatus(val, "2")}
            />
            <div className="-mt-0.5">
              <p className="font-medium text-sm text-neutral-1100 dark:text-gray-200">
                {translate("preferences.notify_approved")}
              </p>
              <p className="mt-1 font-medium text-xs text-neutral-700 dark:text-gray-200">
                {translate("preferences.notify_approved_desc")}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Notification;
