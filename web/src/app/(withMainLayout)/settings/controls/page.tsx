// Controls setting page UI

"use client";

import { Button, RadioBtn, showSuccessToast } from "@rever/common";
import { matchingOptions } from "@rever/constants";
import { updateOrgApi } from "@rever/services";
import { useUserStore } from "@rever/stores";
import { Option } from "@rever/types";
import { hasPermission } from "@rever/utils";
import { useEffect, useState } from "react";

const Controls = () => {
  const orgDetails = useUserStore((state) => state.user?.organization);
  const user = useUserStore((state) => state.user);
  const setUser = useUserStore((state) => state.setUser);

  const [isLoaderFormSubmit, setIsLoaderFormSubmit] = useState(false);
  const [selectedMatchOption, setSelectedMatchOption] =
    useState<Option | null>();

  useEffect(() => {
    if (orgDetails?.matching_type) {
      const matchingType = orgDetails?.receipt_confirmation_enabled
        ? "three_way"
        : orgDetails.matching_type;
      const found = matchingOptions.find((v) => v.value === matchingType);
      if (found) setSelectedMatchOption(found);
    }
  }, [orgDetails]);

  const saveDetails = async () => {
    setIsLoaderFormSubmit(true);
    const data = {
      matching_type:
        selectedMatchOption?.value === "three_way"
          ? "two_way"
          : selectedMatchOption?.value,
      receipt_confirmation_enabled:
        selectedMatchOption?.value === "three_way" ? true : false,
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
        timezone: response?.data,
      });
      showSuccessToast("Changes saved");
    }
    setIsLoaderFormSubmit(false);
  };

  const baseLabelClass =
    "mb-3 border p-4 rounded-md flex items-center gap-4 transition-all duration-300 ease-in-out";

  return (
    <div>
      <p className="text-slate-800 dark:text-slate-100 text-lg font-semibold mb-6">
        Matching type
      </p>

      <div className="lg:w-1/2 w-full">
        {matchingOptions.map((val) => (
          <label
            key={val.value}
            className={`${baseLabelClass} ${
              selectedMatchOption?.value === val.value
                ? "bg-slate-50"
                : "hover:border-primary-500"
            } ${user?.role !== "admin" ? "cursor-not-allowed hover:border-slate-200" : "cursor-pointer"}`}
          >
            <RadioBtn
              isDisable={user?.role !== "admin"}
              checked={selectedMatchOption?.value === val.value}
              onChange={() => setSelectedMatchOption(val)}
            />
            <div>
              <p className="mb-1 text-xs font-semibold text-slate-800">
                {val.label}
              </p>
              <p className="text-2xs text-slate-500">{val.description}</p>
            </div>
          </label>
        ))}

        <label className="opacity-50 mb-3 border p-4 rounded-md flex items-center gap-4">
          <RadioBtn isDisable checked={false} onChange={() => {}} />
          <div>
            <p className="mb-1 text-xs font-semibold text-slate-800">
              4-Way match
            </p>
            <p className="text-2xs text-slate-600">
              Bill is matched against the PO&apos;s, receipt, and quality check.
            </p>
          </div>
        </label>
      </div>

      {hasPermission("general", "update") && (
        <div className="grid grid-cols-2 w-fit gap-3 mt-6">
          <Button
            type="button"
            text="Save"
            disabled={isLoaderFormSubmit}
            className="text-white"
            onClick={saveDetails}
            isLoading={isLoaderFormSubmit}
          />
        </div>
      )}
    </div>
  );
};

export default Controls;
