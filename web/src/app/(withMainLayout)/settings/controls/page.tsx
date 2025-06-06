// Controls setting page UI

"use client";

import {
  Button,
  Label,
  SelectComponent,
  showSuccessToast,
} from "@rever/common";
import { matchingOptions } from "@rever/constants";
import { updateOrgApi } from "@rever/services";
import { useUserStore } from "@rever/stores";
import { Option } from "@rever/types";
import { hasPermission } from "@rever/utils";
import { useEffect, useState } from "react";

const Controls = () => {
  // Get org details from zustand store
  const orgDetails = useUserStore((state) => state.user?.organization);
  // Get user from Zustand store
  const user = useUserStore((state) => state.user);
  const setUser = useUserStore((state) => state.setUser);

  const [isLoaderFormSubmit, setIsLoaderFormSubmit] = useState<boolean>(false);
  const [selectedMatchOption, setSelectedMatchOption] =
    useState<Option | null>();

  useEffect(() => {
    if (orgDetails && orgDetails?.matching_type) {
      const filterItem = matchingOptions?.filter(
        (v) => v.value === orgDetails?.matching_type,
      );
      if (filterItem.length) {
        setSelectedMatchOption(filterItem[0]);
      }
    }
  }, [orgDetails]);

  const saveDetails = async () => {
    setIsLoaderFormSubmit(true);
    const data = {
      matching_type: selectedMatchOption?.value,
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
      setIsLoaderFormSubmit(false);
      showSuccessToast("Changes saved");
    }
  };

  return (
    <div className="lg:w-3/4 w-full">
      <div className="grid lg:grid-cols-3 md:grid-cols-2 grid-cols-1 gap-5 mb-5">
        <div>
          <Label htmlFor="matching_type" text="Matching type" />
          <SelectComponent
            name="matching_type"
            options={matchingOptions}
            placeholder="Select matching type"
            onChange={(e) => setSelectedMatchOption?.(e)}
            value={selectedMatchOption}
          />
        </div>
      </div>

      {hasPermission("general", "update") && (
        <div className="grid grid-cols-2 w-fit gap-3 mt-6">
          <Button
            type="button"
            text="Save"
            disabled={isLoaderFormSubmit}
            className="text-white"
            onClick={saveDetails}
          />
        </div>
      )}
    </div>
  );
};

export default Controls;
