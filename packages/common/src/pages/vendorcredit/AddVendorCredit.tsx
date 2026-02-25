// Component to render Create vendor credit UI

"use client";

import {
  addCreditNoteSchema,
  addCreditNoteSchemaValues,
} from "@rever/validations";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import {
  Button,
  CustomTooltip,
  PdfViewer,
  TextAreaInput,
  Label,
  TextInput,
  SelectComponent,
  DatePickerDemo,
  NumberInput,
  OutsideClickHandler,
  UploadFileView,
  ToggleSwitch,
  IconWrapper,
  PageLoader,
  showErrorToast,
  showSuccessToast,
  DropdownButton,
} from "@rever/common";
import {
  formatDate,
  formatNumber,
  getStatusLabelForExtraction,
  isNamedObject,
} from "@rever/utils";
import {
  Option,
  VenderDataAPIType,
  AttachmentProps,
  VendorCreditProps,
} from "@rever/types";
import { useBreadcrumbStore, useUserStore } from "@rever/stores";
import {
  CircleAlert,
  CircleCheck,
  CircleDashed,
  Download,
  Loader,
  Paperclip,
  Trash,
  Upload,
} from "lucide-react";
import Lottie from "lottie-react";
import VendorCreditLineItemsTable from "./VendorCreditLineItems";
import {
  addVendorCreditAttachment,
  createVendorCreditApi,
  deleteVendorCreditAttachment,
  getVendorCreditAttachment,
  getVendorCreditDetailsByIdApi,
  getVendorCreditDocument,
  getVendorsDataAPI,
  updateVendorCreditApi,
  uploadVendorCreditDocument,
} from "@rever/services";
import vendorCreditExtractAnimation from "../../components/animations/vendorCreditExtraction.json";

const getStatusIcon = (status: string, error_message?: string) => {
  switch (status) {
    case "uploading":
      return <Loader className="animate-spin text-slate-800" size={20} />;
    case "processing":
      return <Loader className="animate-spin text-blue-500" size={20} />;
    case "extracting":
      return (
        <CircleDashed className="animate-spin text-purple-500" size={20} />
      );
    case "enriched":
      return <CircleCheck className="text-green-600" size={20} />;
    case "failed":
      return (
        <CustomTooltip
          content={
            error_message
              ? error_message
              : "File must be under 5MB and limited to 5 pages"
          }
          side="right"
        >
          <div>
            <CircleAlert className="text-red-500" size={20} />
          </div>
        </CustomTooltip>
      );
    default:
      return null;
  }
};

const MAX_ATTEMPTS = 20;
const DELAY_MS = 2000;

const AddVendorCreditComponentWithParams = () => {
  // react-hook-form setup
  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
    trigger,
    control,
    setValue,
    watch,
  } = useForm({
    resolver: zodResolver(addCreditNoteSchema),
    mode: "onChange",
    defaultValues: {
      items: [
        {
          description: "",
          quantity: "",
          unit_price: "",
          total_amount: "0",
        },
      ],
    },
  });

  // useRouter, URL params, state
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const showPdfValue = searchParams.get("showPdf");
  const router = useRouter();

  // state
  const [vendorOptionList, setVendorOptionList] = useState<Option[]>([]);
  const [idValue, setIdValue] = useState<string | null>(id);

  const [isLoaderFormSubmit, setIsLoaderFormSubmit] = useState(false);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [fileDetails, setFileDetails] = useState<File | null>(null);
  const [fileResponse, setFileResponse] = useState<AttachmentProps>({});
  const [showUploadFileView, setShowUploadFileView] = useState(false);
  const [showPdf, setShowPdf] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [vendorCreditDetails, setVendorCreditDetails] = useState<
    Partial<VendorCreditProps>
  >({});
  const [submitType, setSubmitType] = useState("");
  const [files, setFiles] = useState<{
    file?: File;
    status?: string;
    id?: string;
    error_message?: string;
  }>({});
  const [showItemsDescription, setShowItemsDescription] = useState(false);

  // stores
  const orgDetails = useUserStore((state) => state.user?.organization);
  const setDynamicCrumb = useBreadcrumbStore((s) => s.setDynamicCrumb);

  const vendorCreditItems = useWatch({ control, name: "items" }) || [];

  const [showBtnPopup, setShowBtnPopup] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const vendorCreditDetailsSection = useRef<HTMLDivElement | null>(null);
  const [vendorCreditDetailsHeight, setvendorCreditDetailsHeight] = useState<
    number | null
  >(null);

  // Vendor credit Calculation
  const subtotal = vendorCreditItems.reduce(
    (sum, item) =>
      (Number(item.quantity) || 0) * (Number(item.unit_price) || 0) + sum,
    0,
  );
  const totalTax = useWatch({ control, name: "total_tax" }) || 0;
  const totalTaxamount = (subtotal * Number(totalTax)) / 100;
  const total = subtotal + totalTaxamount;

  // Get vendor credit Details By ID (for editing)
  const getVendorCreditDetailsById = useCallback(
    async (idValue: string) => {
      const response = await getVendorCreditDetailsByIdApi(idValue);
      if (response?.status === 200) {
        if (response?.data?.status === "approved") {
          router.back();
          return;
        }
        setDynamicCrumb("/vendorcredit/edit", {
          id: response?.data?.id,
          name: response?.data?.credit_note_number || "--",
        });
        setValue("credit_number", response?.data?.credit_note_number || "");
        setValue("items", response?.data?.items);
        setValue(
          "credit_date",
          response?.data?.txn_date
            ? new Date(response?.data?.txn_date)
            : new Date(),
        );

        setValue("vendor", response?.data?.vendor?.id);
        // setValue("purchase_order", response?.data?.purchase_order?.id);
        setValue("total_tax", response?.data?.tax_percentage);
        setValue("notes", response?.data?.notes);
        setVendorCreditDetails(response?.data);

        // Get Vendor credit Attachment
        const responseFile = await getVendorCreditAttachment(idValue);
        if (responseFile?.status === 200) {
          setFileResponse(responseFile?.data?.results[0]);
          setFileUrl(responseFile?.data?.results[0]?.file);
          setIsLoading(false);
          setFiles({ status: "done" });
        } else {
          setIsLoading(false);
        }
      } else {
        router.push("/vendorcredit/list");
      }
    },
    [router, setValue, setDynamicCrumb],
  );

  // Fetch vendor list / vendor credit detail on mount
  useEffect(() => {
    getVendorsList();
    if (idValue) {
      if (showPdfValue === "true") setShowPdf(true);
      getVendorCreditDetailsById(idValue);
    } else {
      setIsLoading(false);
    }
  }, [getVendorCreditDetailsById, idValue, showPdfValue]);

  // Data Fetchers
  async function getVendorsList() {
    const response = await getVendorsDataAPI();
    if (response?.status === 200) {
      setVendorOptionList(
        response?.data?.results?.map((v: VenderDataAPIType) => ({
          label: v?.vendor_name,
          value: v?.id,
        })),
      );
    }
  }

  // Prevent Enter submit (except textarea)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
    if (e.key === "Enter" && (e.target as HTMLElement).tagName !== "TEXTAREA")
      e.preventDefault();
  };

  const triggerSubmit = (submitType: "draft" | "in_review") => {
    setSubmitType(submitType);
    handleSubmit((data) => submitForm(data, submitType))();
    setShowBtnPopup(false);
  };

  // Form Submission (CREATE or UPDATE)
  const submitForm = async (
    data: addCreditNoteSchemaValues,
    submitType: string,
  ) => {
    setIsLoaderFormSubmit(true);

    // Prepare vendor credit items
    const apiVendorCreditItems = data?.items?.map((val) => ({
      id: val.id || undefined,
      description: val.description,
      quantity: val.quantity,
      unit_price: val.unit_price,
      total_amount: (Number(val.quantity) * Number(val.unit_price)).toFixed(2),
    }));
    
    // Prepare payload
    const payload = {
      credit_note_number: data?.credit_number,
      vendor_id: data.vendor,
      txn_date: data?.credit_date
        ? formatDate(data?.credit_date, "yyyy-MM-dd", "", true)
        : null,
      notes: data?.notes ?? undefined,
      status: submitType,
      sub_total: subtotal.toFixed(2) || 0,
      total: total.toFixed(2) || 0,
      total_tax: totalTaxamount.toFixed(2) || 0,
      tax_percentage: data?.total_tax || 0,
      items: apiVendorCreditItems,
    };

    let response;
    if (idValue) {
      response = await updateVendorCreditApi(payload, idValue);
    } else {
      response = await createVendorCreditApi(payload);
    }

    // Handle API Response
    if (
      (idValue && response?.status === 200) ||
      (!idValue && response?.status === 201)
    ) {
      // If fileDetails present, attach after vendor credit created/updated
      if (fileDetails) {
        const formData = new FormData();
        formData.append("file", fileDetails);
        const responseFile = await addVendorCreditAttachment(
          formData,
          (response?.data?.id || idValue)!,
        );
        if (responseFile?.status === 201) {
          setIsLoaderFormSubmit(false);
          showSuccessToast(
            idValue
              ? "Vendor credit updated successfully"
              : "Vendor credit created successfully",
          );
          if (idValue) {
            router.push(`/vendorcredit/view?id=${idValue}`);
          } else if (response?.data?.id) {
            router.push(`/vendorcredit/view?id=${response?.data?.id}`);
          }
          else {
            router.push("/vendorcredit/list");
          }
          return;
        } else {
          showErrorToast("Something went wrong!!");
        }
        router.push("/vendorcredit/list");
        return;
      }
      setIsLoaderFormSubmit(false);
      showSuccessToast(
        idValue
          ? "Vendor credit updated successfully"
          : "Vendor credit created successfully",
      );
      if (idValue) {
        router.push(`/vendorcredit/view?id=${idValue}`);
      } else if (response?.data?.id) {
        router.push(`/vendorcredit/view?id=${response?.data?.id}`);
      }
      else {
        router.push("/vendorcredit/list");
      }
    } else {
      if (response?.data?.detail) {
        showErrorToast(response?.data?.detail);
      } else {
        setShowItemsDescription(true);
      }
      setIsLoaderFormSubmit(false);
    }
  };

  // PDF upload/preview handlers
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (uploadedFile && uploadedFile.type === "application/pdf") {
      setFileDetails(uploadedFile);
      const url = URL.createObjectURL(uploadedFile);
      setFileUrl(url);
      e.target.value = "";
      setShowPdf(true);

      // If new (not edit), poll for status after upload
      if (!idValue) {
        setFiles({ status: "uploading" });
        const formData = new FormData();
        formData.append("file", uploadedFile);
        formData.append("document_type", "vendorcredit");
        const uploadRes = await uploadVendorCreditDocument(formData);
        if (uploadRes?.status === 201) {
          const { id } = uploadRes.data;
          await pollDocumentStatus(id);
        } else {
          if (
            uploadRes &&
            uploadRes?.data[0] ===
            "Your subscription has expired. Please renew to continue."
          ) {
            showErrorToast(uploadRes?.data[0]);
            setShowPdf(false);
            setFileUrl(null);
            setFileDetails(null);
          } else {
            setShowPdf(false);
            setFileUrl(null);
            setFileDetails(null);
            showErrorToast("File must be under 5MB and limited to 5 pages");
          }
        }
      }
    } else {
      alert("Please upload a valid PDF file.");
    }
  };

  // Polling document extraction status
  const pollDocumentStatus = async (id: string) => {
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      try {
        const fileRes = await getVendorCreditDocument(id);
        if (fileRes.status !== 200) throw new Error("Fetch failed");
        const { status, target_object_id, error_message } = fileRes.data;
        setFiles({ status: status });
        if (["done"].includes(status)) {
          if (status === "done" && target_object_id) {
            setIdValue(target_object_id);
            setShowPdf(true);
          }
          break;
        }
        if (["failed"].includes(status)) {
          setShowPdf(false);
          setFileUrl(null);
          setFileDetails(null);
          showErrorToast(
            error_message
              ? error_message
              : "File must be under 5MB and limited to 5 pages",
          );
          break;
        }
      } catch (err) {
        console.error("Polling error:", err);
      }
      await new Promise((r) => setTimeout(r, DELAY_MS));
    }
  };

  // Delete attachment
  async function deleteVendorCreditAttachmentFunc() {
    const response = await deleteVendorCreditAttachment(fileResponse?.id || "");
    if (response?.status === 204 && idValue) {
      showSuccessToast("Vendor credit attachment deleted");
      getVendorCreditDetailsById(idValue);
    }
  }

  // Render
  return (
    <>
      {isLoading ? (
        <PageLoader />
      ) : (
        <>
          <div className="rounded-b-[20px] bg-white p-4 h-28 border border-secondary-200 flex items-end justify-start">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-3">
                <p className="text-neutral-1100 text-2xl font-medium">
                  {idValue
                    ? vendorCreditDetails?.credit_note_number
                    : "New vendor credit"}
                </p>

                <div className="flex justify-between items-center">
                  {fileUrl && (
                    <div className="flex items-center">
                      <ToggleSwitch isOn={showPdf} setIsOn={setShowPdf} />
                      <p className="ms-1.5 text-sm text-neutral-1100 font-medium">
                        {!showPdf ? "Show pdf" : "Hide pdf"}
                      </p>
                    </div>
                  )}
                </div>
              </div>
              {/* Action Buttons */}
              <div className="flex items-center gap-3">
                {!fileUrl ? (
                  <div>
                    {/* Hidden file input */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="application/pdf"
                      className="hidden"
                      onChange={handleFileChange}
                    />

                    <Button
                      name={
                        idValue ? "Upload vendor credit" : "Extract vendor credit"
                      }
                      button_type="primary-outline"
                      icon_type="upload"
                      disabled={isLoaderFormSubmit}
                      onClick={() => fileInputRef.current?.click()} // triggers file input
                    />
                  </div>
                ) : null}

                <Button
                  name="Cancel"
                  onClick={() =>
                    idValue
                      ? router.push(`/vendorcredit/view?id=${idValue}`)
                      : router.push("/vendorcredit/list")
                  }
                  button_type="secondary-outline"
                  disabled={isLoaderFormSubmit}
                />

                {!idValue || vendorCreditDetails?.status === "draft" ? (
                  <DropdownButton
                    name="Save"
                    onActionBtClick={() => {
                      triggerSubmit("in_review");
                    }}
                    onClose={() => setShowBtnPopup(false)}
                    onBtnPopupItemsClick={(val) => {
                      if (val === "Save as draft") {
                        triggerSubmit("draft");
                      }
                    }}
                    onClickArrow={() => setShowBtnPopup(true)}
                    showBtnPopup={showBtnPopup}
                    btnPopupItems={["Save", "Save as draft"]}
                    button_type="primary"
                  />
                ) : (
                  <Button
                    name="Save"
                    onClick={() => triggerSubmit("in_review")}
                    button_type="primary"
                    icon_type={isLoaderFormSubmit ? "loader" : null}
                    disabled={isLoaderFormSubmit}
                  />
                )}
              </div>
            </div>
          </div>

          <div>
            <div className="lg:flex">
              <form
                className={
                  fileUrl && showPdf ? "lg:w-[70%] mt-8 lg:mt-0" : "w-full"
                }
                onKeyDown={handleKeyDown}
              >
                <div>
                  <div
                    ref={vendorCreditDetailsSection}
                    className={`rounded-[20px] bg-white p-4 border border-secondary-200`}
                  >
                    <p className="text-neutral-1100 text-xl font-medium mb-5">
                      Vendor credit details
                    </p>
                    {/* Vendor credit details fields */}
                    <div className="grid lg:grid-cols-3 md:grid-cols-2 grid-cols-1 gap-5">
                      <div>
                        <Label
                          htmlFor="credit_number"
                          text="Vendor credit number"
                          isRequired
                        />
                        <TextInput
                          register={register("credit_number")}
                          id="credit_number"
                          placeholder="Enter vendor credit"
                          error={errors.credit_number}
                          value={getValues("credit_number")}
                        />
                      </div>

                      <div>
                        <Label htmlFor="vendor" text="Vendor" isRequired />
                        <SelectComponent
                          name="vendor"
                          register={register}
                          trigger={trigger}
                          title="Vendor"
                          error={errors?.vendor}
                          options={vendorOptionList}
                          placeholder="Select vendor"
                          isClearable={true}
                          getValues={getValues}
                        />
                      </div>

                      <div>
                        <Label
                          htmlFor="credit_date"
                          text="Vendor credit date"
                          isRequired
                        />
                        <DatePickerDemo
                          register={register}
                          name="credit_date"
                          error={errors.credit_date}
                          trigger={trigger}
                          placeholder="Select vendor credit date"
                          title="Vendor credit date"
                          value={watch("credit_date") ?? undefined}
                        />
                      </div>
                    </div>

                    {/* <div className="grid lg:grid-cols-3 md:grid-cols-2 grid-cols-1 gap-5 mb-5">
                      <div>
                        <Label htmlFor="purchase_order" text="Purchase order" />
                        <SelectComponent
                          name="purchase_order"
                          register={register}
                          trigger={trigger}
                          title="Purchase order"
                          error={errors?.purchase_order}
                          options={purchaseOrderOptionList}
                          placeholder="Select purchase order"
                          isClearable={true}
                          getValues={getValues}
                        />
                      </div>

                      <div>
                        <Label htmlFor="bill" text="Bill" />
                        <SelectComponent
                          name="bill"
                          register={register}
                          trigger={trigger}
                          title="Bill"
                          error={errors?.bill}
                          options={purchaseOrderOptionList}
                          placeholder="Select bill"
                          isClearable={true}
                          getValues={getValues}
                        />
                      </div>
                    </div> */}
                  </div>

                  <div
                    className={`rounded-[20px] bg-white p-4 border border-secondary-200`}
                    style={{
                      minHeight: `calc(100vh - 10rem - ${vendorCreditDetailsHeight ?? 0}px)`, //is for mesh UI - border 1px y-axis, padding 1px y-axis
                    }}
                  >
                    <p className="text-neutral-1100 text-xl font-medium mb-5">
                      Vendor credit line items
                    </p>

                    <VendorCreditLineItemsTable
                      getValues={getValues}
                      setValue={setValue}
                      control={control}
                      register={register}
                      showItemsDescription={showItemsDescription}
                      submitType={submitType}
                    />

                    <div className="flex items-center justify-between">
                      {/* Notes */}
                      <div className="w-1/2">
                        <Label htmlFor="notes" text="Notes" />
                        <TextAreaInput
                          rows={4}
                          register={register("notes")}
                          id="notes"
                          placeholder="Enter notes"
                          error={errors.notes}
                          value={getValues("notes") ?? undefined}
                        />
                      </div>

                      {/* Credit Summary */}
                      <div className="flex justify-end">
                        <div className="p-4 w-72 font-medium text-sm bg-secondary-100 rounded-[20px]">
                          <div className="grid grid-cols-2">
                            <p className="text-neutral-1100">Sub total:</p>
                            <p className="text-neutral-900 text-right">
                              {formatNumber(subtotal, orgDetails?.currency)}
                            </p>
                          </div>
                          <div className="grid items-center grid-cols-2 pb-2 mt-4 mb-2">
                            <div>
                              <p className="text-neutral-1100">Total tax:</p>
                              <span className="text-xs">
                                {formatNumber(
                                  totalTaxamount,
                                  orgDetails?.currency,
                                )}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <NumberInput
                                register={register("total_tax")}
                                id="totalTax"
                                error={errors.total_tax}
                                value={getValues("total_tax")}
                                onEnterPress={() => { }}
                                allowDecimal
                                className="text-right"
                              />
                              %
                            </div>
                          </div>
                          <div className="grid grid-cols-2 font-semibold">
                            <p className="text-neutral-1100">Grand total:</p>
                            <p className="text-neutral-900 text-right">
                              {formatNumber(total, orgDetails?.currency)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </form>

              {fileUrl && showPdf && (
                <div className="relative lg:w-[30%] scrollbar_none rounded-[20px] bg-white border border-secondary-200 overflow-hidden">
                  <p className="p-4 pb-0 text-neutral-1100 text-xl font-medium">
                    Vendor credit Preview
                  </p>
                  {files.status === "done" ? (
                    <>
                      <div className="flex justify-end py-1 pr-2">
                        <IconWrapper
                          icon={
                            <a href={fileUrl || "#"} download="credit.pdf">
                              <Download className="cursor-pointer" width={16} />
                            </a>
                          }
                        />
                        <IconWrapper
                          onClick={() => {
                            if (idValue) deleteVendorCreditAttachmentFunc();
                            setFileUrl(null);
                          }}
                          icon={<Trash width={16} />}
                          className="hover:bg-red-100 hover:text-red-500"
                        />
                      </div>
                      <PdfViewer fileUrl={fileUrl} />
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-[580px]">
                      <div
                        style={{
                          position: "relative",
                          width: "100%",
                          height: "90%",
                        }}
                        className="mb-2"
                      >
                        <Lottie
                          animationData={vendorCreditExtractAnimation}
                          loop
                          autoplay
                          style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                        />
                      </div>
                      <div className="mb-4 flex items-center gap-2 justify-center">
                        <h2 className="capitalize text-slate-800 text-sm font-medium text-center">
                          {getStatusLabelForExtraction(files.status || "")}
                        </h2>
                        {getStatusIcon(
                          getStatusLabelForExtraction(files.status || ""),
                          files.error_message,
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
};

// Suspense wrapper
const AddVendorCreditComponent = () => (
  <Suspense>
    <AddVendorCreditComponentWithParams />
  </Suspense>
);

export default AddVendorCreditComponent;