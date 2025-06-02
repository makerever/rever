// Component to render general setting UI

"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Label } from "@rever/common";
import { TextInput } from "@rever/common";
import { useEffect, useState } from "react";
import { Button } from "@rever/common";
import { SelectComponent } from "@rever/common";
import {
  generalSettingSchema,
  generalSettingSchemaValues,
} from "@rever/validations";
import { useUserStore } from "@rever/stores";
import { currencyOptions, dateFormatOptions } from "@rever/constants";
import { updateOrgApi } from "@rever/services";
import { showSuccessToast } from "@rever/common";
import { hasPermission } from "@rever/utils";
import { PageLoader } from "@rever/common";

const GeneralSettings = () => {
  // Initialize react-hook-form with Zod validation
  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
    setValue,
    trigger,
  } = useForm({
    resolver: zodResolver(generalSettingSchema),
    mode: "onChange",
  });

  // Get user from Zustand store
  const user = useUserStore((state) => state.user);
  const setUser = useUserStore((state) => state.setUser);

  // State for showing loader on form submit
  const [isLoaderFormSubmit, setIsLoaderFormSubmit] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Populate form fields with organization data when user changes
  useEffect(() => {
    setValue("org_name", user?.organization?.name || "");
    setValue("currency", user?.organization?.currency || "");
    setValue("date_format", user?.organization?.date_format || "");
    setIsLoading(false);
  }, [setValue, user]);

  // Handle form submission to update organization details
  const submitForm = async (data: generalSettingSchemaValues) => {
    setIsLoaderFormSubmit(true);
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

      showSuccessToast("Organization details updated");
      setIsLoaderFormSubmit(false);
    }
  };

  return (
    <>
      {/* Show nothing while loading organization data */}
      {isLoading ? (
        <PageLoader />
      ) : (
        <form onSubmit={handleSubmit(submitForm)}>
          <div className="lg:w-3/4 w-full">
            {/* First row: Organization name, Base currency, Date format */}
            <div className="grid lg:grid-cols-3 md:grid-cols-2 grid-cols-1 gap-5 mb-5">
              <div>
                <Label htmlFor="org_name" text="Organization name" isRequired />
                <TextInput
                  register={register("org_name")}
                  id="org_name"
                  placeholder="Enter org name"
                  error={errors.org_name}
                  value={getValues("org_name")}
                  disabled
                />
              </div>
              <div>
                <Label htmlFor="base_currency" text="Base currency" />
                <SelectComponent
                  name="currency"
                  register={register}
                  trigger={trigger}
                  error={errors?.currency}
                  getValues={getValues}
                  options={currencyOptions}
                  placeholder="Select base currency"
                  isDisabled
                />
              </div>
              <div>
                <Label htmlFor="date_format" text="Date format" />
                <SelectComponent
                  name="date_format"
                  register={register}
                  trigger={trigger}
                  error={errors?.date_format}
                  getValues={getValues}
                  options={dateFormatOptions}
                  placeholder="Select date format"
                />
              </div>
            </div>

            {/* Second row: Financial year */}
            {/* <div className="grid lg:grid-cols-3 md:grid-cols-2 grid-cols-1 gap-5 mb-5">
              <div>
                <Label htmlFor="financial_year" text="Financial year" />
                <SelectComponent
                  name="financial_year"
                  register={register}
                  trigger={trigger}
                  error={errors?.financial_year}
                  getValues={getValues}
                  options={[]}
                  placeholder="Select financial year"
                />
              </div>
            </div> */}
          </div>

          {/* Save button, only visible if user has update permission */}
          {hasPermission("general", "update") && (
            <div className="grid grid-cols-2 w-fit gap-3 mt-6">
              <Button
                type="submit"
                text="Save"
                disabled={isLoaderFormSubmit}
                className="text-white"
              />
            </div>
          )}
        </form>
      )}
    </>
  );
};

export default GeneralSettings;
