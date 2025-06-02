// Manage notification page

"use client";

import { PageLoader, ToggleSwitch } from "@rever/common";
import {
  getNotificationStatusApi,
  updateNotificationStatusApi,
} from "@rever/services";
import { ManageNotificationProps } from "@rever/types";
import { useEffect, useState } from "react";

// Notification settings component
const Notification = () => {
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
    } else if (key === "2") {
      data.notify_on_approval_result = val;
    }
    const response = await updateNotificationStatusApi(data);
    if (response?.status === 200) {
      getNotificationStatus();
    }
  };

  return (
    <>
      {isLoading ? (
        <PageLoader />
      ) : (
        <>
          {/* Section title */}
          <p className="text-slate-800 dark:text-slate-100 text-lg font-semibold mb-6">
            Email notifications
          </p>

          {/* Toggle for transaction submitted notification */}
          <div className="flex items-center mb-4">
            <ToggleSwitch
              isOn={notiPreferenceApp1}
              setIsOn={(val) => updateNotificationStatus(val, "1")}
            />
            <p className="ms-2 text-xs text-slate-800 dark:text-gray-200">
              Notify when transactions are submitted for approval
            </p>
          </div>

          {/* Toggle for transaction approved notification */}
          <div className="flex items-center">
            <ToggleSwitch
              isOn={notiPreferenceApp2}
              setIsOn={(val) => updateNotificationStatus(val, "2")}
            />
            <p className="ms-2 text-xs text-slate-800 dark:text-gray-200">
              Notify when transaction is approved
            </p>
          </div>
        </>
      )}
    </>
  );
};

export default Notification;
