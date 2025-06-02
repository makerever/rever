// Component to render Create Vendor UI

"use client";

import { addVendorSchema, addVendorSchemaValues } from "@rever/validations";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { Label } from "@rever/common";
import { TextInput } from "@rever/common";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@rever/common";
import { useRouter } from "next/navigation";
import {
  cityOptions,
  countryOptions,
  paymentTermsOptions,
  stateOptions,
  statusOptions,
} from "@rever/constants";
import { CitiesOption, StateOption } from "@rever/types";
import { SelectComponent } from "@rever/common";
import {
  createNewVendorAPI,
  getVendorDetailsAPI,
  updateVendorAPI,
} from "@rever/services";
import { VenderDataAPIType } from "@rever/types";
import { showErrorToast, showSuccessToast } from "@rever/common";

import { AddVendorComponentType } from "@rever/types";
import { PhoneInputComp } from "@rever/common";
import { PageLoader } from "@rever/common";

// Main component for adding or editing a vendor
const AddVendorComponent = ({ vendorId }: AddVendorComponentType) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
    trigger,
    watch,
    setValue,
    control,
  } = useForm({
    resolver: zodResolver(addVendorSchema),
    mode: "onChange",
  });

  const router = useRouter();

  // State for showing loader on form submit
  const [isLoaderFormSubmit, setIsLoaderFormSubmit] = useState(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [stateOptionsList, setStateOptionsList] = useState<StateOption[]>([]);
  const [cityOptionsList, setCityOptionsList] = useState<CitiesOption[]>([]);

  // Watch selected country and state for address fields
  const selectedCountry = watch("billingAddress.country");
  const selectedState = watch("billingAddress.state");

  // Update state dropdown when country changes
  useEffect(() => {
    const stateList = stateOptions.filter(
      (s) => s.countryId === getValues("billingAddress.country"),
    );
    setValue("billingAddress.state", " ");
    setValue("billingAddress.city", " ");
    setStateOptionsList(stateList);
    setCityOptionsList([]);
  }, [getValues, selectedCountry, setValue]);

  // Update city dropdown when state changes
  useEffect(() => {
    const citiesList = cityOptions.filter(
      (c) =>
        c.stateId === getValues("billingAddress.state") &&
        c.stateCode === getValues("billingAddress.country"),
    );

    setCityOptionsList(citiesList);
  }, [getValues, selectedState]);

  // Fetch individual vendor details and populate form fields
  const handleGetIndividualVendor = useCallback(async () => {
    const response = await getVendorDetailsAPI(vendorId ?? "");
    if (response?.status === 200) {
      const vendorData = response.data;
      setValue("vendorName", vendorData?.vendor_name ?? "");
      setValue("companyName", vendorData?.company_name ?? "");
      setValue("mobile", vendorData?.mobile ?? "");
      setValue("email", vendorData?.email ?? "");
      setValue("taxId", vendorData?.tax_id ?? "");
      setValue("website", vendorData?.website ?? "");
      setValue(
        "billingAddress.line1",
        vendorData?.billing_address?.line1 ?? "",
      );
      setValue(
        "billingAddress.line2",
        vendorData?.billing_address?.line2 ?? "",
      );
      setValue(
        "billingAddress.country",
        vendorData?.billing_address?.country ?? "",
      );
      setValue(
        "billingAddress.state",
        vendorData?.billing_address?.state ?? "",
      );
      setValue("billingAddress.city", vendorData?.billing_address?.city ?? "");
      setValue(
        "billingAddress.zip_code",
        vendorData?.billing_address?.zip_code ?? "",
      );
      setValue("paymentTerms", vendorData?.payment_terms ?? "");
      setValue("status", vendorData?.is_active ? "active" : "inactive");
      setIsLoading(false);
    }
  }, [setValue, vendorId]);

  // Fetch vendor details if editing an existing vendor
  useEffect(() => {
    if (vendorId) {
      handleGetIndividualVendor();
    } else {
      setIsLoading(false);
    }
  }, [handleGetIndividualVendor, vendorId]);

  // API call to create a new vendor
  const handleCreateVendor = async (data: VenderDataAPIType) => {
    setIsLoaderFormSubmit(true);
    const response = await createNewVendorAPI(data);
    if (response.status === 201) {
      setIsLoaderFormSubmit(false);
      showSuccessToast("Vendor created successfully");
      router.push("/vendor/list");
    } else {
      setIsLoaderFormSubmit(false);
      if (response?.data?.detail) {
        showErrorToast(response?.data?.detail);
      }
    }
  };

  // API call to update an existing vendor
  const handleUpdateVendor = async (data: VenderDataAPIType) => {
    setIsLoaderFormSubmit(true);
    const response = await updateVendorAPI(data);
    if (response.status === 200) {
      setIsLoaderFormSubmit(false);
      showSuccessToast("Vendor updated successfully");
      router.push("/vendor/list");
    } else {
      setIsLoaderFormSubmit(false);
      if (response?.data?.detail) {
        showErrorToast(response?.data?.detail);
      }
    }
  };

  // Handle form submission for both create and update
  const submitForm = async (data: addVendorSchemaValues) => {
    const params = {
      vendor_name: data.vendorName,
      payment_terms: data?.paymentTerms ? String(data.paymentTerms) : null,
      company_name: data.companyName || "",
      email: data.email || "",
      mobile: data.mobile || "",
      tax_id: data.taxId || "",
      website: data.website || "",
      billing_address: {
        line1: data.billingAddress.line1 || "",
        line2: data.billingAddress.line2 || "",
        city: data.billingAddress.city || "",
        state: data.billingAddress.state || "",
        zip_code: data.billingAddress.zip_code || "",
        country: data.billingAddress.country || "",
      },
      is_active: true,
    };
    if (vendorId) {
      handleUpdateVendor({
        ...params,
        id: vendorId,
        is_active: data.status === "active",
      });
    } else {
      handleCreateVendor(params);
    }
  };

  return (
    <>
      {/* Show nothing while loading vendor data */}
      {isLoading ? (
        <PageLoader />
      ) : (
        <form onSubmit={handleSubmit(submitForm)}>
          <div className="lg:w-3/4 w-full">
            {/* Vendor basic details row */}
            <div className="grid lg:grid-cols-3 md:grid-cols-2 grid-cols-1 gap-5 mb-5">
              <div>
                <Label htmlFor="vendorName" text="Vendor name" isRequired />
                <TextInput
                  register={register("vendorName")}
                  id="vendorName"
                  placeholder="Enter vendor name"
                  error={errors.vendorName}
                  value={getValues("vendorName")}
                />
              </div>
              <div>
                <Label htmlFor="companyName" text="Company name" />
                <TextInput
                  register={register("companyName")}
                  id="companyName"
                  placeholder="Enter company name"
                  error={errors.companyName}
                  value={getValues("companyName")}
                />
              </div>
              <div className="phone_input">
                <Label htmlFor="mobile" text="Mobile" />
                {/* <TextInput
                  register={register("mobile")}
                  id="mobile"
                  placeholder="Enter mobile"
                  error={errors.companyName}
                  value={getValues("mobile")}
                /> */}
                <Controller
                  name="mobile"
                  control={control}
                  rules={{ required: "Phone number is required" }}
                  render={({ field }) => (
                    <PhoneInputComp
                      value={field.value || ""}
                      onChange={field.onChange}
                      error={errors.mobile?.message}
                    />
                  )}
                />
              </div>
            </div>

            {/* Vendor contact details row */}
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
              <div>
                <Label htmlFor="taxId" text="Tax ID" />
                <TextInput
                  register={register("taxId")}
                  id="taxId"
                  placeholder="Enter tax id"
                  error={errors.taxId}
                  value={getValues("taxId")}
                />
              </div>
              <div>
                <Label htmlFor="website" text="Website" />
                <TextInput
                  register={register("website")}
                  id="website"
                  placeholder="Enter website"
                  error={errors.website}
                  value={getValues("website") ?? ""}
                />
              </div>
            </div>

            {/* Payment terms and status row */}
            <div className="grid lg:grid-cols-3 md:grid-cols-2 grid-cols-1 gap-5 mb-5">
              <div>
                <Label htmlFor="paymentTerms" text="Payment terms" />
                <SelectComponent
                  name="paymentTerms"
                  register={register}
                  trigger={trigger}
                  error={errors?.paymentTerms}
                  options={paymentTermsOptions}
                  placeholder="Select payment terms"
                  isClearable={true}
                  getValues={getValues}
                />
              </div>
              {/* Show status dropdown only when editing vendor */}
              {vendorId && (
                <div>
                  <Label htmlFor="status" text="Vendor Status" />
                  <SelectComponent
                    name="status"
                    register={register}
                    trigger={trigger}
                    error={errors?.status}
                    options={statusOptions}
                    placeholder="Select vendor status"
                    getValues={getValues}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Vendor address section */}
          <p className="text-slate-800 text-lg font-semibold mt-8 mb-6">
            Vendor address
          </p>

          <div className="lg:w-3/4 w-full">
            {/* Address line, country row */}
            <div className="grid lg:grid-cols-3 md:grid-cols-2 grid-cols-1 gap-5 mb-5">
              <div>
                <Label htmlFor="line1" text="Address line 1" />
                <TextInput
                  register={register("billingAddress.line1")}
                  id="line1"
                  placeholder="Enter address line 1"
                  error={errors.billingAddress?.line1}
                  value={getValues("billingAddress.line1")}
                />
              </div>
              <div>
                <Label htmlFor="line2" text="Address line 2" />
                <TextInput
                  register={register("billingAddress.line2")}
                  id="line2"
                  placeholder="Enter address line 2"
                  error={errors.billingAddress?.line2}
                  value={getValues("billingAddress.line2")}
                />
              </div>
              <div>
                <Label htmlFor="country" text="Country" />
                <SelectComponent
                  name="billingAddress.country"
                  register={register}
                  getValues={getValues}
                  trigger={trigger}
                  error={errors.billingAddress?.country}
                  options={countryOptions}
                  placeholder="Select country"
                  isClearable={true}
                />
              </div>
            </div>

            {/* State, city, zipcode row */}
            <div className="grid lg:grid-cols-3 md:grid-cols-2 grid-cols-1 gap-5 mb-5">
              <div>
                <Label htmlFor="state" text="State" />
                <SelectComponent
                  name="billingAddress.state"
                  register={register}
                  trigger={trigger}
                  getValues={getValues}
                  error={errors.billingAddress?.state}
                  options={stateOptionsList}
                  placeholder="Select state"
                  isClearable={true}
                />
              </div>
              <div>
                <Label htmlFor="city" text="City" />
                <SelectComponent
                  name="billingAddress.city"
                  register={register}
                  getValues={getValues}
                  trigger={trigger}
                  error={errors.billingAddress?.city}
                  options={cityOptionsList}
                  placeholder="Select city"
                  isClearable={true}
                />
              </div>
              <div>
                <Label htmlFor="zip_code" text="Zipcode" />
                <TextInput
                  register={register("billingAddress.zip_code")}
                  id="zip_code"
                  placeholder="Enter zipcode"
                  error={errors.billingAddress?.zip_code}
                  value={getValues("billingAddress.zip_code")}
                />
              </div>
            </div>
          </div>

          {/* Save and Cancel buttons */}
          <div className="grid grid-cols-2 w-fit gap-3 mt-6">
            <Button
              type="submit"
              text="Save"
              disabled={isLoaderFormSubmit}
              className="text-white"
            />

            <Button
              text="Cancel"
              onClick={() => router.back()}
              disabled={isLoaderFormSubmit}
              className="bg-transparent text-primary-500 border border-primary-500 disabled:hover:bg-transparent disabled:text-primary-500 hover:bg-primary-500 hover:text-white"
            />
          </div>
        </form>
      )}
    </>
  );
};

export default AddVendorComponent;

// const AddVendorComponent = () => {
//   return <Suspense>
//     <AddVendorComponentWithParams />
//   </Suspense>
// }

// export default AddVendorComponent;
