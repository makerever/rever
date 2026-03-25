// Component to render general setting UI

"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { Label, PhoneInputComp } from "@rever/common";
import { TextInput } from "@rever/common";
import { useEffect, useState, useRef } from "react";
import { SelectComponent } from "@rever/common";
import { createGeneralSettingSchema } from "@rever/validations";
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
import { useTranslate } from "@rever/i18n";

const GeneralSettings = () => {
  const translate = useTranslate();
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
    resolver: zodResolver(createGeneralSettingSchema(translate)),
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

  // ---------- AUTOSAVE HELPERS ----------
  const autoSaveTimer = useRef<NodeJS.Timeout | null>(null);
  const lastSavedData = useRef<any>(null);

  // Flags to prevent autosave during initial population / reset
  const isInitializing = useRef<boolean>(true);
  const isPopulatingForm = useRef<boolean>(false);

  // Populate form fields with organization data when component mounts
  useEffect(() => {
    getOrgDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getOrgDetails = async () => {
    setIsLoading(true);
    const response = await getOrgApi();

    if (response?.status === 200) {
      // Prevent autosave while we populate fields
      isPopulatingForm.current = true;

      const d = response.data;

      setValue("org_name", d?.name || "");
      setValue("currency", d?.currency || "");
      setValue("date_format", d?.date_format || "");
      setValue("email", d?.email || "");
      setValue("phone_number", d?.phone_number || "");
      setValue("business_type", d?.business_type || "");
      setValue("industry", d?.industry || "");
      setValue("address.country", d?.address?.country || "");
      setValue("address.state", d?.address?.state || "");
      setValue("address.city", d?.address?.city || "");
      setValue("address.zip_code", d?.address?.zip_code || "");

      // store snapshot of what is saved on server so autosave won't re-send same data
      lastSavedData.current = {
        org_name: d?.name || "",
        currency: d?.currency || "",
        date_format: d?.date_format || "",
        email: d?.email || "",
        phone_number: d?.phone_number || "",
        business_type: d?.business_type || "",
        industry: d?.industry || "",
        address: {
          country: d?.address?.country || "",
          state: d?.address?.state || "",
          city: d?.address?.city || "",
          zip_code: d?.address?.zip_code || "",
        },
      };

      // done populating — allow autosave from now on
      isPopulatingForm.current = false;
      isInitializing.current = false;
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
    // Reset dependent selects to empty value
    isPopulatingForm.current = true;
    setValue("address.state", "");
    setValue("address.city", "");
    setStateOptionsList(stateList);
    setCityOptionsList([]);
    isPopulatingForm.current = false;
  }, [selectedCountry]);

  // Update city dropdown when state changes
  useEffect(() => {
    const citiesList = cityOptions.filter(
      (c) =>
        c.stateId === getValues("address.state") &&
        c.stateCode === getValues("address.country"),
    );

    setCityOptionsList(citiesList);
  }, [selectedState]);

  // ---------------- AUTOSAVE EFFECT ----------------
  useEffect(() => {
    // if user doesn't have update permission, don't attempt autosave
    if (!hasPermission("general", "update")) return;

    const subscription = watch(async (formData) => {
      try {
        // Block autosave while we're initializing or populating the form via setValue
        if (isInitializing.current || isPopulatingForm.current) return;

        // Debounce: clear pending timer
        if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);

        // Schedule save
        autoSaveTimer.current = setTimeout(async () => {
          // Build a comparable snapshot in the same shape as lastSavedData
          const snapshot = {
            org_name: formData.org_name || "",
            currency: formData.currency || "",
            date_format: formData.date_format || "",
            email: formData.email || "",
            phone_number: formData.phone_number || "",
            business_type: formData.business_type || "",
            industry: formData.industry || "",
            address: {
              country: formData?.address?.country || "",
              state: formData?.address?.state || "",
              city: formData?.address?.city || "",
              zip_code: formData?.address?.zip_code || "",
            },
          };

          // If nothing changed compared to last saved snapshot, skip autosave
          if (
            JSON.stringify(lastSavedData.current) === JSON.stringify(snapshot)
          ) {
            return;
          }

          // mark as saving using the same loader state so UI remains consistent
          setIsLoaderFormSubmit(true);

          const response = await updateOrgApi(formData);

          if (response?.status === 200) {
            // update user store + snapshot
            setUser({
              id: user?.id,
              first_name: user?.first_name,
              last_name: user?.last_name,
              email: user?.email,
              role: user?.role,
              organization: response?.data,
              timezone: response?.data,
              locale: user?.locale ?? "en",
            });

            lastSavedData.current = snapshot;
            showSuccessToast(translate("approval_settings.autosaved"));
          }

          setIsLoaderFormSubmit(false);
        }, 500); // debounce delay 0.5s
      } catch (err) {
        // swallow errors (or you can add error toast)
        setIsLoaderFormSubmit(false);
      }
    });

    return () => {
      // cleanup subscription and timer
      subscription.unsubscribe();
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    };
    // include user in deps so setUser closure is up-to-date
  }, [watch, user]);

  return (
    <>
      {isLoading ? (
        <PageLoader />
      ) : (
        <form>
          <div className="w-full rounded-[20px] border bg-white shadow-xs p-4 min-h-[calc(100vh-160px)]">
            <div className="flex flex-row items-center border-b border-secondary-200 pb-3">
              <Label
                text={translate("general.org_name") + ":"}
                className="max-w-60 w-full text-secondary-700 mb-0 font-medium"
              />
              <div className="w-1/3">
                <TextInput
                  register={register("org_name")}
                  id="org_name"
                  placeholder={translate("placeholders.organization")}
                  error={errors.org_name}
                  value={getValues("org_name")}
                  disabled
                />
              </div>
            </div>
            <div className="flex flex-row items-center border-b border-secondary-200 py-3">
              <Label
                text={translate("general.base_currency") + ":"}
                className="max-w-60 w-full text-secondary-700 mb-0 font-medium"
              />
              <div className="w-1/3">
                <SelectComponent
                  name="currency"
                  register={register}
                  trigger={trigger}
                  error={errors?.currency}
                  getValues={getValues}
                  options={currencyOptions}
                  placeholder={translate("placeholders.select_base_currency")}
                  isDisabled
                />
              </div>
            </div>
            <div className="flex flex-row items-center border-b border-secondary-200 py-3">
              <Label
                text={translate("general.date_format") + ":"}
                className="max-w-60 w-full text-secondary-700 mb-0 font-medium"
              />
              <div className="w-1/3">
                <SelectComponent
                  name="date_format"
                  register={register}
                  trigger={trigger}
                  error={errors?.date_format}
                  getValues={getValues}
                  options={dateFormatOptions}
                  placeholder={translate("placeholders.select_date_format")}
                  isDisabled={!hasPermission("general", "update")}
                />
              </div>
            </div>
            <div className="flex flex-row items-center border-b border-secondary-200 py-3">
              <Label
                text={translate("general.email") + ":"}
                className="max-w-60 w-full text-secondary-700 mb-0 font-medium"
              />
              <div className="w-1/3">
                <TextInput
                  register={register("email")}
                  id="email"
                  placeholder={translate("placeholders.enter_email")}
                  error={errors.email}
                  value={getValues("email")}
                  disabled={true}
                />
              </div>
            </div>
            <div className="flex flex-row items-center border-b border-secondary-200 py-3">
              <Label
                text={translate("general.phone_number") + ":"}
                className="max-w-60 w-full text-secondary-700 mb-0 font-medium"
              />
              <div className="w-1/3">
                <Controller
                  name="phone_number"
                  control={control}
                  rules={{ required: "Phone number is required" }}
                  render={({ field }) => (
                    <PhoneInputComp
                      value={field.value || ""}
                      onChange={field.onChange}
                      error={errors.phone_number?.message}
                      disabled={!hasPermission("general", "update")}
                    />
                  )}
                />
              </div>
            </div>

            <div className="flex flex-row items-center border-b border-secondary-200 py-3">
              <Label
                text={translate("general.business_type") + ":"}
                className="max-w-60 w-full text-secondary-700 mb-0 font-medium"
              />
              <div className="w-1/3">
                <SelectComponent
                  name="business_type"
                  register={register}
                  trigger={trigger}
                  error={errors?.business_type}
                  getValues={getValues}
                  options={businessTypeOptions.map((opt) => ({ ...opt, label: translate(`business_types.${opt.value}`) }))}
                  placeholder={translate("placeholders.business_type")}
                  isClearable
                  isDisabled={!hasPermission("general", "update")}
                />
              </div>
            </div>
            <div className="flex flex-row items-center border-b border-secondary-200 py-3">
              <Label
                text={translate("general.industry") + ":"}
                className="max-w-60 w-full text-secondary-700 mb-0 font-medium"
              />
              <div className="w-1/3">
                <SelectComponent
                  name="industry"
                  register={register}
                  trigger={trigger}
                  error={errors?.industry}
                  getValues={getValues}
                  options={industryOptions.map((opt) => ({ ...opt, label: translate(`industry_options.${opt.value}`) }))}
                  placeholder={translate("placeholders.select_industry")}
                  isClearable
                  isDisabled={!hasPermission("general", "update")}
                />
              </div>
            </div>
            <div className="flex flex-row items-center border-b border-secondary-200 py-3">
              <Label
                text={translate("general.country") + ":"}
                className="max-w-60 w-full text-secondary-700 mb-0 font-medium"
              />
              <div className="w-1/3">
                <SelectComponent
                  name="address.country"
                  register={register}
                  getValues={getValues}
                  trigger={trigger}
                  error={errors?.address?.country}
                  options={countryOptions}
                  placeholder={translate("placeholders.select_country")}
                  isClearable={true}
                  isDisabled={!hasPermission("general", "update")}
                />
              </div>
            </div>
            <div className="flex flex-row items-center border-b border-secondary-200 py-3">
              <Label
                text={translate("general.state") + ":"}
                className="max-w-60 w-full text-secondary-700 mb-0 font-medium"
              />
              <div className="w-1/3">
                <SelectComponent
                  name="address.state"
                  register={register}
                  trigger={trigger}
                  getValues={getValues}
                  error={errors?.address?.state}
                  options={stateOptionsList}
                  placeholder={translate("placeholders.select_state")}
                  isClearable={true}
                  isDisabled={!hasPermission("general", "update")}
                />
              </div>
            </div>

            <div className="flex flex-row items-center border-b border-secondary-200 py-3">
              <Label
                text={translate("general.city") + ":"}
                className="max-w-60 w-full text-secondary-700 mb-0 font-medium"
              />
              <div className="w-1/3">
                <SelectComponent
                  name="address.city"
                  register={register}
                  getValues={getValues}
                  trigger={trigger}
                  error={errors?.address?.city}
                  options={cityOptionsList}
                  placeholder={translate("placeholders.select_city")}
                  isClearable={true}
                  isDisabled={!hasPermission("general", "update")}
                />
              </div>
            </div>
            <div className="flex flex-row items-center border-b border-secondary-200 py-3">
              <Label
                text={translate("general.zipcode") + ":"}
                className="max-w-60 w-full text-secondary-700 mb-0 font-medium"
              />
              <div className="w-1/3">
                <TextInput
                  register={register("address.zip_code")}
                  id="zip_code"
                  placeholder={translate("placeholders.enter_zipcode")}
                  error={errors?.address?.zip_code}
                  value={getValues("address.zip_code")}
                  disabled={!hasPermission("general", "update")}
                />
              </div>
            </div>
          </div>
        </form>
      )}
    </>
  );
};

export default GeneralSettings;