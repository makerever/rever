// Controls setting page UI

"use client";

import { RadioBtn, showSuccessToast } from "@rever/common";
import { matchingOptions } from "@rever/constants";
import { updateOrgApi } from "@rever/services";
import { useUserStore } from "@rever/stores";
import { Option } from "@rever/types";
import { hasPermission } from "@rever/utils";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslate } from "@rever/i18n";

const Controls = () => {
  const translate = useTranslate();
  const orgDetails = useUserStore((state) => state.user?.organization);
  const user = useUserStore((state) => state.user);
  const setUser = useUserStore((state) => state.setUser);

  const [selectedMatchOption, setSelectedMatchOption] =
    useState<Option | null>();

  // Flags to prevent autosave at initialization
  const isInitialLoad = useRef(true);
  const lastSavedValue = useRef<string | null>(null);
  const autoSaveTimer = useRef<NodeJS.Timeout | null>(null);

  // LOAD EXISTING SELECTION
  useEffect(() => {
    if (orgDetails?.matching_type) {
      const matchingType = orgDetails?.receipt_confirmation_enabled
        ? "three_way"
        : orgDetails.matching_type;

      const found = matchingOptions.find((v) => v.value === matchingType);

      if (found) {
        setSelectedMatchOption(found);
        lastSavedValue.current = found.value; // store initial value to avoid autosave
      }
    }

    // Allow autosave AFTER load
    setTimeout(() => {
      isInitialLoad.current = false;
    }, 300);
  }, [orgDetails]);

  // AUTOSAVE FUNCTION
  const autoSave = useCallback(
    async (value: string) => {
      const data = {
        matching_type: value === "three_way" ? "two_way" : value,
        receipt_confirmation_enabled: value === "three_way",
      };

      const response = await updateOrgApi(data);

      if (response?.status === 200) {
        setUser({
          id: user?.id,
          first_name: user?.first_name,
          last_name: user?.last_name,
          email: user?.email,
          role: user?.role,
          organization: response?.data,
          timezone: user?.timezone,
          locale: user?.locale ?? "en",
        });

        showSuccessToast(translate("approval_settings.autosaved"));
      }
    },
    [user, setUser, translate],
  );

  // AUTOSAVE ON CHANGE
  useEffect(() => {
    if (isInitialLoad.current) return;
    if (!selectedMatchOption) return;

    const newVal = String(selectedMatchOption.value ?? "");

    // skip if value did not change
    if (newVal === lastSavedValue.current) return;

    // debounce
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);

    autoSaveTimer.current = setTimeout(() => {
      autoSave(newVal);
      lastSavedValue.current = String(newVal);
    }, 500);
  }, [selectedMatchOption, autoSave]);

  const baseLabelClass =
    "border-b border-secondary-200 p-4 rounded-md flex items-center gap-4 transition-all duration-300 ease-in-out";

  return (
    <div>
      <div className="rounded-b-[20px] bg-white p-4 h-28 border border-secondary-200 flex items-end justify-start">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 w-full h-8">
          <div className="flex items-center gap-2">
            <p className="text-neutral-1100 text-2xl font-medium">{translate("sidebar.settings.controls")}</p>
          </div>
        </div>
      </div>

      <div className="w-full rounded-[20px] border bg-white shadow-xs p-4 min-h-[calc(100vh-162px)]">
        <p className="text-neutral-1100 text-xl font-medium mb-5">{translate("controls.match_type")}</p>
        {matchingOptions.map((val) => (
          <label
            key={val.value}
            className={`${baseLabelClass} ${
              selectedMatchOption?.value === val.value ? "" : ""
            } ${
              user?.role !== "admin" ? "cursor-not-allowed" : "cursor-pointer"
            }`}
          >
            <RadioBtn
              isDisable={!hasPermission("general", "update")}
              checked={selectedMatchOption?.value === val.value}
              onChange={() => setSelectedMatchOption(val)}
            />
            <div>
              <p className="mb-1 text-sm font-medium text-neutral-1100">
                {val.label}
              </p>
              <p className="text-xs font-medium text-secondary-700">
                {val.description}
              </p>
            </div>
          </label>
        ))}

        <label className="opacity-50 mb-3 p-4 rounded-md flex items-center gap-4">
          <RadioBtn isDisable checked={false} onChange={() => {}} />
          <div>
            <p className="mb-1 text-xs font-semibold text-slate-800">
              {translate("controls.four_way_match")}
            </p>
            <p className="text-2xs text-slate-600">
              {translate("controls.four_way_match_description")}
            </p>
          </div>
        </label>
      </div>

      {/* Save button removed safely */}
    </div>
  );
};

export default Controls;