// Component to render Create Vendor UI

"use client";

import { createAddVendorSchema, addVendorSchemaValues } from "@rever/validations";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { Label, ToggleSwitch } from "@rever/common";
import { TextInput } from "@rever/common";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@rever/common";
import { useRouter } from "next/navigation";
import {
  paymentTermsOptions,
} from "@rever/constants";
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
import { useBreadcrumbStore } from "@rever/stores";
import { useTranslate } from "@rever/i18n";

// Main component for adding or editing a vendor
const AddVendorComponent = ({ vendorId }: AddVendorComponentType) => {
  const translate = useTranslate();
  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
    trigger,
    setValue,
    control,
  } = useForm({
    resolver: zodResolver(createAddVendorSchema(translate)),
    mode: "onChange",
  });

  const router = useRouter();

  // State for showing loader on form submit
  const [isLoaderFormSubmit, setIsLoaderFormSubmit] = useState(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [vendorSectionHeight, setVendorSectionHeight] = useState<number | null>(
    null
  );
  const vendorDetailsRef = useRef<HTMLDivElement | null>(null);
  const vendorAddressRef = useRef<HTMLDivElement | null>(null);

  const [isOn, setIsOn] = useState<boolean>(true);

  const setDynamicCrumb = useBreadcrumbStore((s) => s.setDynamicCrumb);

  //useeffect to track the height of vendorDetails and vendorAddress sections
  useEffect(() => {
    if (!isLoading) {
      const vendorDetailsheight = vendorDetailsRef.current?.offsetHeight;
      const vendorAddressheight = vendorAddressRef.current?.offsetHeight;
      setVendorSectionHeight(
        (vendorDetailsheight ?? 0) + (vendorAddressheight ?? 0)
      );
      // console.log(vendorDetailsheight, vendorAddressheight);
    }
  }, [isLoading]);

  // Fetch individual vendor details and populate form fields
  const handleGetIndividualVendor = useCallback(async () => {
    const response = await getVendorDetailsAPI(vendorId ?? "");
    if (response?.status === 200) {
      const vendorData = response.data;
      setDynamicCrumb("/vendor/update", {
        id: vendorData?.id,
        name: vendorData?.vendor_name,
      });
      setValue("vendorName", vendorData?.vendor_name ?? "");
      setValue("companyName", vendorData?.company_name ?? "");
      setValue("mobile", vendorData?.mobile ?? "");
      setValue("email", vendorData?.email ?? "");
      setValue("taxId", vendorData?.tax_id ?? "");
      setValue("website", vendorData?.website ?? "");
      setValue(
        "billingAddress.line1",
        vendorData?.billing_address?.line1 ?? ""
      );
      setValue(
        "billingAddress.line2",
        vendorData?.billing_address?.line2 ?? ""
      );
      setValue(
        "billingAddress.country",
        vendorData?.billing_address?.country ?? ""
      );
      setValue(
        "billingAddress.state",
        vendorData?.billing_address?.state ?? ""
      );
      setValue("billingAddress.city", vendorData?.billing_address?.city ?? "");
      setValue(
        "billingAddress.zip_code",
        vendorData?.billing_address?.zip_code ?? ""
      );
      setValue(
        "bank_account.account_holder_name",
        vendorData?.bank_account?.account_holder_name ?? ""
      );
      setValue(
        "bank_account.account_number",
        vendorData?.bank_account?.account_number ?? ""
      );
      setValue(
        "bank_account.bank_name",
        vendorData?.bank_account?.bank_name ?? ""
      );
      setValue("paymentTerms", vendorData?.payment_terms ?? "");
      setValue("status", vendorData?.is_active ? "active" : "inactive");

      if (vendorData?.is_active) {
        setIsOn(true);
      } else {
        setIsOn(false);
      }
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
      showSuccessToast(translate("vendors.created"));
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
      showSuccessToast(translate("vendors.updated"));
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
      bank_account: {
        account_holder_name: data?.bank_account?.account_holder_name,
        account_number: data?.bank_account?.account_number,
        bank_name: data?.bank_account?.bank_name,
      },
      is_active: isOn,
    };
    if (vendorId) {
      handleUpdateVendor({
        ...params,
        id: vendorId,
      });
    } else {
      handleCreateVendor(params);
    }
  };

  return (
    <>
      {/* Show nothing while loading vendor data */}
      {isLoading ? (
        <div
          className={`${vendorId ? "flex items-center justify-center h-full" : ""}`}
        >
          <PageLoader />
        </div>
      ) : (
        <>
          <div>
            <div className="bg-secondary-200 pb-px">
              <form onSubmit={handleSubmit(submitForm)} className="">
                <div className="flex items-center justify-between bg-white rounded-b-[20px] p-4 pt-16 border border-secondary-200">
                  <div className="flex items-center gap-2">
                    <p className="text-neutral-1100 text-2xl font-medium">
                      {vendorId
                        ? `Edit Vendor - ${getValues("vendorName")}`
                        : translate("vendors.create_vendor.heading")}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button
                      name={translate("buttons.cancel")}
                      onClick={() =>
                        vendorId
                          ? router.push(`/vendor/view?id=${vendorId}`)
                          : router.push("/vendor/list")
                      }
                      disabled={isLoaderFormSubmit}
                      button_type="secondary-outline"
                    />
                    <Button
                      type="submit"
                      name={vendorId ? translate("buttons.save_changes") : translate("buttons.save")}
                      disabled={isLoaderFormSubmit}
                      button_type="primary"
                      icon_type={isLoaderFormSubmit ? "loader" : null}
                    />
                  </div>
                </div>
                <div className="w-full">
                  {/* Vendor details section */}
                  <div
                    ref={vendorDetailsRef}
                    className="border border-secondary-200 rounded-[20px] bg-white p-4"
                  >
                    <div className="w-full flex items-start justify-between">
                      <p className="text-neutral-1100 text-xl mb-5 font-medium">
                        {translate("vendors.create_vendor.vendor_details.heading")}
                      </p>
                    </div>
                    <div className="grid lg:grid-cols-3 md:grid-cols-2 grid-cols-1 gap-5">
                      <div>
                        <Label
                          htmlFor="vendorName"
                          text={translate("vendors.create_vendor.vendor_details.vendor_name")}
                          className=""
                          isRequired
                        />
                        <TextInput
                          register={register("vendorName")}
                          id="vendorName"
                          placeholder={translate("vendors.create_vendor.vendor_details.enter_vendor_name")}
                          error={errors.vendorName}
                          value={getValues("vendorName")}
                        />
                      </div>
                      <div>
                        <Label
                          htmlFor="companyName"
                          text={translate("vendors.create_vendor.vendor_details.company_name")}
                          className=""
                        />
                        <TextInput
                          register={register("companyName")}
                          id="companyName"
                          placeholder={translate("vendors.create_vendor.vendor_details.enter_company_name")}
                          error={errors.companyName}
                          value={getValues("companyName")}
                        />
                      </div>
                      <div>
                        <Label htmlFor="email" text={translate("vendors.create_vendor.vendor_details.email")} className="" />
                        <TextInput
                          register={register("email")}
                          id="email"
                          placeholder={translate("vendors.create_vendor.vendor_details.enter_email")}
                          error={errors.email}
                          value={getValues("email")}
                        />
                      </div>
                      <div className="phone_input">
                        <Label htmlFor="mobile" text={translate("vendors.create_vendor.vendor_details.mobile")} className="" />
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
                      <div>
                        <Label htmlFor="taxId" text={translate("vendors.create_vendor.vendor_details.tax_id")} className="" />
                        <TextInput
                          register={register("taxId")}
                          id="taxId"
                          placeholder={translate("vendors.create_vendor.vendor_details.enter_tax_id")}
                          error={errors.taxId}
                          value={getValues("taxId")}
                        />
                      </div>
                      <div>
                        <Label htmlFor="website" text={translate("vendors.create_vendor.vendor_details.website")} className="" />
                        <TextInput
                          register={register("website")}
                          id="website"
                          placeholder={translate("vendors.create_vendor.vendor_details.enter_website")}
                          error={errors.website}
                          value={getValues("website") ?? ""}
                        />
                      </div>
                      <div>
                        <Label
                          htmlFor="paymentTerms"
                          text={translate("vendors.create_vendor.vendor_details.payment_terms")}
                          className=""
                        />
                        <SelectComponent
                          name="paymentTerms"
                          register={register}
                          trigger={trigger}
                          error={errors?.paymentTerms}
                          options={paymentTermsOptions.map((opt) => ({ ...opt, label: translate(`payment_terms_options.${opt.value}`) }))}
                          placeholder={translate("placeholders.bill.select_pt")}
                          isClearable={true}
                          getValues={getValues}
                        />
                      </div>
                      {/* Show status dropdown only when editing vendor */}
                      {vendorId && (
                        <>
                          <div>
                            <Label
                              htmlFor="status"
                              text="Vendor Status"
                              className=""
                            />
                            <div className="mt-3 flex items-center">
                              <ToggleSwitch
                                isOn={isOn}
                                setIsOn={() => setIsOn(!isOn)}
                              />

                              <p className="ms-2 text-xs text-slate-800 dark:text-gray-200">
                                {isOn ? "Active" : "Inactive"}
                              </p>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  {/* Vendor address section */}
                  <div
                    ref={vendorAddressRef}
                    className="border border-secondary-200 rounded-[20px] bg-white p-4"
                  >
                    <div className="w-full flex items-start justify-between">
                      <p className="text-neutral-1100 text-xl mb-5 font-medium">
                        {translate("vendors.create_vendor.vendor_address.heading")}
                      </p>
                    </div>
                    <div className="w-full">
                      <div className="grid lg:grid-cols-3 md:grid-cols-2 grid-cols-1 gap-5">
                        <div>
                          <Label
                            htmlFor="line1"
                            text={translate("vendors.create_vendor.vendor_address.address_line_1")}
                            className=""
                          />
                          <TextInput
                            register={register("billingAddress.line1")}
                            id="line1"
                            placeholder={translate("vendors.create_vendor.vendor_address.enter_address_line_1")}
                            error={errors.billingAddress?.line1}
                            value={getValues("billingAddress.line1")}
                          />
                        </div>
                        <div>
                          <Label
                            htmlFor="line2"
                            text={translate("vendors.create_vendor.vendor_address.address_line_2")}
                            className=""
                          />
                          <TextInput
                            register={register("billingAddress.line2")}
                            id="line2"
                            placeholder={translate("vendors.create_vendor.vendor_address.enter_address_line_2")}
                            error={errors.billingAddress?.line2}
                            value={getValues("billingAddress.line2")}
                          />
                        </div>
                        <div>
                          <Label
                            htmlFor="country"
                            text={translate("vendors.create_vendor.vendor_address.country")}
                            className=""
                          />
                          <TextInput
                            register={register("billingAddress.country")}
                            id="country"
                            error={errors.billingAddress?.country}
                            placeholder={translate("vendors.create_vendor.vendor_address.enter_country")}
                            value={getValues("billingAddress.country")}
                          />
                        </div>
                        <div>
                          <Label htmlFor="state" text={translate("vendors.create_vendor.vendor_address.state")} className="" />
                          <TextInput
                            register={register("billingAddress.state")}
                            id="state"
                            error={errors.billingAddress?.state}
                            placeholder={translate("vendors.create_vendor.vendor_address.enter_state")}
                            value={getValues("billingAddress.state")}
                          />
                        </div>
                        <div>
                          <Label htmlFor="city" text={translate("vendors.create_vendor.vendor_address.city")} className="" />
                          <TextInput
                            register={register("billingAddress.city")}
                            id="city"
                            error={errors.billingAddress?.city}
                            placeholder={translate("vendors.create_vendor.vendor_address.enter_city")}
                            value={getValues("billingAddress.city")}
                          />
                        </div>
                        <div>
                          <Label
                            htmlFor="zip_code"
                            text={translate("vendors.create_vendor.vendor_address.pin_code")}
                            className=""
                          />
                          <TextInput
                            register={register("billingAddress.zip_code")}
                            id="zip_code"
                            placeholder={translate("vendors.create_vendor.vendor_address.enter_zipcode")}
                            error={errors.billingAddress?.zip_code}
                            value={getValues("billingAddress.zip_code")}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* Vendor bank details section */}
                  <div
                    className="border border-secondary-200 rounded-[20px] bg-white p-4"
                    style={{
                      minHeight: `calc(100vh - 10rem - ${vendorSectionHeight ?? 0}px - ${vendorId ? "8.5px" : "34.5px"})`,
                    }}
                  >
                    <div className="w-full flex items-start justify-between">
                      <p className="text-neutral-1100 text-xl mb-5 font-medium">
                        {translate("vendors.create_vendor.bank_account_details.heading")}
                      </p>
                    </div>
                    <div className="grid lg:grid-cols-3 md:grid-cols-2 grid-cols-1 gap-5">
                      <div>
                        <Label
                          htmlFor="account_holder_name"
                          text={translate("vendors.create_vendor.bank_account_details.account_holder_name")}
                          className=""
                        />
                        <TextInput
                          register={register(
                            "bank_account.account_holder_name"
                          )}
                          id="account_holder_name"
                          placeholder={translate("vendors.create_vendor.bank_account_details.enter_account_holder_name")}
                          error={errors.bank_account?.account_holder_name}
                          value={getValues("bank_account.account_holder_name")}
                        />
                      </div>
                      <div>
                        <Label
                          htmlFor="account_number"
                          text={translate("vendors.create_vendor.bank_account_details.account_number")}
                          className=""
                        />
                        <TextInput
                          register={register("bank_account.account_number")}
                          id="account_number"
                          placeholder={translate("vendors.create_vendor.bank_account_details.enter_account_number")}
                          error={errors.bank_account?.account_number}
                          value={getValues("bank_account.account_number")}
                        />
                      </div>
                      <div>
                        <Label
                          htmlFor="bank_name"
                          text={translate("vendors.create_vendor.bank_account_details.bank_name")}
                          className=""
                        />
                        <TextInput
                          register={register("bank_account.bank_name")}
                          id="bank_name"
                          placeholder={translate("vendors.create_vendor.bank_account_details.enter_bank_name")}
                          error={errors.bank_account?.bank_name}
                          value={getValues("bank_account.bank_name")}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </>
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
