// Component to render general setting UI

"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { Label, PhoneInputComp } from "@rever/common";
import { TextInput } from "@rever/common";
import { useEffect, useState } from "react";
import { Button } from "@rever/common";
import { SelectComponent } from "@rever/common";
import {
  generalSettingSchema,
  generalSettingSchemaValues,
} from "@rever/validations";
import { useUserStore } from "@rever/stores";
import {
  businessTypeOptions,
  cityOptions,
  countryOptions,
  currencyOptions,
  dateFormatOptions,
  industryOptions,
  stateOptions,
} from "@rever/constants";
import { getOrgApi, updateOrgApi } from "@rever/services";
import { showSuccessToast } from "@rever/common";
import { hasPermission } from "@rever/utils";
import { PageLoader } from "@rever/common";
import { CitiesOption, StateOption } from "@rever/types";

const GeneralSettings = () => {
  // Initialize react-hook-form with Zod validation
  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
    setValue,
    trigger,
    control,
    watch,
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

  const [stateOptionsList, setStateOptionsList] = useState<StateOption[]>([]);
  const [cityOptionsList, setCityOptionsList] = useState<CitiesOption[]>([]);

  // Watch selected country and state for address fields
  const selectedCountry = watch("address.country");
  const selectedState = watch("address.state");

  // Populate form fields with organization data when user changes
  useEffect(() => {
    getOrgDetails();
  }, [setValue, user]);

  const getOrgDetails = async () => {
    const response = await getOrgApi();
    if (response?.status === 200) {
      setValue("org_name", response?.data?.name || "");
      setValue("currency", response?.data?.currency || "");
      setValue("date_format", response?.data?.date_format || "");
      setValue("email", response?.data?.email || "");
      setValue("phone_number", response?.data?.phone_number || "");
      setValue("business_type", response?.data?.business_type || "");
      setValue("industry", response?.data?.industry || "");
      setValue("address.country", response?.data?.address?.country || "");
      setValue("address.state", response?.data?.address?.state || "");
      setValue("address.city", response?.data?.address?.city || "");
      setValue("address.zip_code", response?.data?.address?.zip_code || "");
      setIsLoading(false);
    } else {
      setIsLoading(false);
    }
  };

  // Update state dropdown when country changes
  useEffect(() => {
    const stateList = stateOptions.filter(
      (s) => s.countryId === getValues("address.country"),
    );
    setValue("address.state", " ");
    setValue("address.city", " ");
    setStateOptionsList(stateList);
    setCityOptionsList([]);
  }, [getValues, selectedCountry, setValue]);

  // Update city dropdown when state changes
  useEffect(() => {
    const citiesList = cityOptions.filter(
      (c) =>
        c.stateId === getValues("address.state") &&
        c.stateCode === getValues("address.country"),
    );

    setCityOptionsList(citiesList);
  }, [getValues, selectedState]);

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

            <div className="grid lg:grid-cols-3 md:grid-cols-2 grid-cols-1 gap-5 mb-5">
              <div>
                <Label htmlFor="email" text="Email" />
                <TextInput
                  register={register("email")}
                  id="email"
                  placeholder="Enter email"
                  error={errors.email}
                  value={getValues("email")}
                />
              </div>

              <div className="phone_input">
                <Label htmlFor="phone_number" text="Phone Number" />
                <Controller
                  name="phone_number"
                  control={control}
                  rules={{ required: "Phone number is required" }}
                  render={({ field }) => (
                    <PhoneInputComp
                      value={field.value || ""}
                      onChange={field.onChange}
                      error={errors.phone_number?.message}
                    />
                  )}
                />
              </div>
            </div>

            <div className="grid lg:grid-cols-3 md:grid-cols-2 grid-cols-1 gap-5 mb-5">
              <div>
                <Label htmlFor="business_type" text="Business type" />
                <SelectComponent
                  name="business_type"
                  register={register}
                  trigger={trigger}
                  error={errors?.business_type}
                  getValues={getValues}
                  options={businessTypeOptions}
                  placeholder="Select business type"
                  isClearable
                />
              </div>
              <div>
                <Label htmlFor="industry" text="Industry" />
                <SelectComponent
                  name="industry"
                  register={register}
                  trigger={trigger}
                  error={errors?.industry}
                  getValues={getValues}
                  options={industryOptions}
                  placeholder="Select industry"
                  isClearable
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

            <p className="text-slate-800 dark:text-slate-100 text-lg font-semibold mb-6">
              Company address
            </p>

            <div className="grid lg:grid-cols-3 md:grid-cols-2 grid-cols-1 gap-5 mb-5">
              <div>
                <Label htmlFor="country" text="Country" />
                <SelectComponent
                  name="address.country"
                  register={register}
                  getValues={getValues}
                  trigger={trigger}
                  error={errors?.address?.country}
                  options={countryOptions}
                  placeholder="Select country"
                  isClearable={true}
                />
              </div>
              <div>
                <Label htmlFor="state" text="State" />
                <SelectComponent
                  name="address.state"
                  register={register}
                  trigger={trigger}
                  getValues={getValues}
                  error={errors?.address?.state}
                  options={stateOptionsList}
                  placeholder="Select state"
                  isClearable={true}
                />
              </div>
            </div>

            <div className="grid lg:grid-cols-3 md:grid-cols-2 grid-cols-1 gap-5 mb-5">
              <div>
                <Label htmlFor="city" text="City" />
                <SelectComponent
                  name="address.city"
                  register={register}
                  getValues={getValues}
                  trigger={trigger}
                  error={errors?.address?.city}
                  options={cityOptionsList}
                  placeholder="Select city"
                  isClearable={true}
                />
              </div>
              <div>
                <Label htmlFor="zip_code" text="Zipcode" />
                <TextInput
                  register={register("address.zip_code")}
                  id="zip_code"
                  placeholder="Enter zipcode"
                  error={errors?.address?.zip_code}
                  value={getValues("address.zip_code")}
                />
              </div>
            </div>
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
