// Component to render Create PO UI

"use client";

import {
  addPurchaseOrderSchema,
  addPurchaseOrderSchemaValues,
} from "@rever/validations";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import {
  Button,
  CustomTooltip,
  PdfViewer,
  showErrorToast,
  showSuccessToast,
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
  poExtractAnimation,
} from "@rever/common";
import { paymentTermsOptions } from "@rever/constants";
import POItemsTable from "./POLineItems";
import {
  formatNumber,
  getStatusLabelForExtraction,
  formatDate,
} from "@rever/utils";
import {
  Option,
  PurchaseOrder,
  VenderDataAPIType,
  AttachmentProps,
} from "@rever/types";
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
import {
  addPOAttachment,
  createPOApi,
  deletePOAttachment,
  getDocument,
  getPOAttachment,
  getPODetailsByIdApi,
  getVendorsDataAPI,
  updatePOApi,
  uploadDocument,
} from "@rever/services";
import { useBreadcrumbStore, useUserStore } from "@rever/stores";
import Lottie from "lottie-react";

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
const PDF_TYPE = "application/pdf";

const AddPOComponentWithParams = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
    trigger,
    control,
    setValue,
    watch,
    resetField,
  } = useForm({
    resolver: zodResolver(addPurchaseOrderSchema),
    mode: "onChange",
    defaultValues: {
      items: [
        {
          description: "",
          product_code: "",
          quantity: "",
          unit_price: "",
          amount: "0",
        },
      ],
    },
  });

  //  URL/ROUTING

  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const showPdfValue = searchParams.get("showPdf");
  const router = useRouter();

  // Watch PO line items for calculations
  const poItems =
    useWatch({
      control,
      name: "items",
    }) || [];

  const [vendorOptionList, setVendorOptionList] = useState<Option[]>([]);

  const [idValue, setIdValue] = useState<string | null>(id);

  const [isLoaderFormSubmit, setIsLoaderFormSubmit] = useState(false);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [fileDetails, setFileDetails] = useState<File | null>(null);
  const [fileResponse, setFileResponse] = useState<AttachmentProps>({});
  const [showUploadFileView, setShowUploadFileView] = useState<boolean>(false);
  const [showPdf, setShowPdf] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [poDetails, setPODetails] = useState<Partial<PurchaseOrder>>({});
  const [submitType, setSubmitType] = useState("");
  const [files, setFiles] = useState<{
    file?: File;
    status?: string;
    id?: string;
    error_message?: string;
  }>({});
  const [showItemsDescription, setShowItemsDescription] =
    useState<boolean>(false);

  const orgDetails = useUserStore((state) => state.user?.organization);

  const poDate = watch("po_date");
  const deliveryDate = watch("delivery_date");

  const setDynamicCrumb = useBreadcrumbStore((s) => s.setDynamicCrumb);

  // EFFECTS

  useEffect(() => {
    getVendorsList();
    if (idValue) {
      if (showPdfValue === "true") setShowPdf(true);
      fetchPODetailsById(idValue);
    } else {
      setIsLoading(false);
    }
  }, [idValue, showPdfValue]);

  useEffect(() => {
    if (deliveryDate && poDate && new Date(deliveryDate) < new Date(poDate)) {
      resetField("delivery_date");
    }
  }, [poDate]);

  //  FETCHERS

  const fetchPODetailsById = useCallback(
    async (idValue: string) => {
      const response = await getPODetailsByIdApi(idValue);
      if (response?.status === 200) {
        setDynamicCrumb("/purchaseorder/edit", {
          id: response?.data?.id,
          name: response?.data?.po_number,
        });
        setValue("poNumber", response?.data?.po_number);
        setValue("po_date", new Date(response?.data.po_date));
        setValue("delivery_date", new Date(response?.data.delivery_date));
        setValue("payment_terms", response?.data?.payment_terms);
        setValue("vendor", response?.data.vendor?.id);
        setValue("total_tax", response?.data?.tax_percentage);
        setValue("items", response?.data.items);
        setValue("comments", response?.data?.comments);
        setPODetails(response?.data);

        const responseFile = await getPOAttachment(idValue);
        if (responseFile?.status === 200) {
          setFileResponse(responseFile?.data?.results[0]);
          setFileUrl(responseFile?.data?.results[0]?.file);
          setFiles({ status: "completed" });
        }
        setIsLoading(false);
      } else {
        router.push("/purchaseorder/list");
      }
    },
    [router, setValue, setDynamicCrumb],
  );

  const getVendorsList = async () => {
    const response = await getVendorsDataAPI();
    if (response?.status === 200) {
      setVendorOptionList(
        response?.data?.results?.map((v: VenderDataAPIType) => ({
          label: v?.vendor_name,
          value: v?.id,
        })),
      );
    }
  };

  // PDF upload/preview handlers
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (uploadedFile && uploadedFile.type === PDF_TYPE) {
      setFileDetails(uploadedFile);
      const url = URL.createObjectURL(uploadedFile);
      setFileUrl(url);
      e.target.value = "";
      setShowPdf(true);

      if (!idValue) {
        setFiles({ status: "uploading" });
        const formData = new FormData();
        formData.append("file", uploadedFile);
        formData.append("document_type", "purchase_order");
        const uploadRes = await uploadDocument(formData);
        if (uploadRes?.status === 202) {
          const { task_id } = uploadRes.data;
          await pollDocumentStatus(task_id);
        } else {
          setShowPdf(false);
          setFileUrl(null);
          setFileDetails(null);
          showErrorToast("File must be under 5MB and limited to 5 pages");
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
        const fileRes = await getDocument(id);
        if (fileRes.status !== 200) throw new Error("Fetch failed");
        const responseData = fileRes.data;

        setFiles({ status: responseData?.status });
        if (["completed"].includes(responseData?.status)) {
          if (
            responseData?.status === "completed" &&
            responseData?.document_id
          ) {
            setIdValue(responseData?.document_id);
            setShowPdf(true);
          }
          break;
        }
        if (["failed"].includes(responseData?.status)) {
          setShowPdf(false);
          setFileUrl(null);
          setFileDetails(null);
          showErrorToast(
            responseData?.message
              ? responseData?.message
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

  const deletePOAttachmentFunc = useCallback(async () => {
    if (!fileResponse?.id) return;
    const response = await deletePOAttachment(fileResponse?.id || "");
    if (response?.status === 204 && idValue) {
      showSuccessToast("PO attachment deleted");
      fetchPODetailsById(idValue);
    }
  }, [fileResponse?.id, idValue, fetchPODetailsById]);

  //  FORM SUBMIT

  // Calculations
  const subtotal = poItems.reduce((sum, item) => {
    const qty = Number(item.quantity) || 0;
    const up = Number(item.unit_price) || 0;
    return sum + qty * up;
  }, 0);

  const totalTax = useWatch({ control, name: "total_tax" }) || 0;
  const totalTaxamount = (subtotal * Number(totalTax)) / 100;
  const total = subtotal + totalTaxamount;

  // Prevent Enter on form except textarea
  const handleKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
    if (e.key === "Enter" && (e.target as HTMLElement).tagName !== "TEXTAREA") {
      e.preventDefault();
    }
  };

  const submitForm = async (data: addPurchaseOrderSchemaValues) => {
    setIsLoaderFormSubmit(true);

    const poItemsList = data?.items?.map((val) => ({
      id: val.id || undefined,
      description: val.description,
      product_code: val.product_code,
      quantity: val.quantity,
      unit_price: val.unit_price,
      amount: val.amount,
    }));

    const poDetailsPayload = {
      po_number: data?.poNumber,
      vendor_id: data.vendor,
      payment_terms: data?.payment_terms,
      po_date: data?.po_date
        ? formatDate(data?.po_date, "yyyy-MM-dd", "", true)
        : null,
      delivery_date: data?.delivery_date
        ? formatDate(data?.delivery_date, "yyyy-MM-dd", "", true)
        : null,
      status: submitType,
      sub_total: subtotal.toFixed(2) || 0,
      total: total.toFixed(2) || 0,
      total_tax: totalTaxamount.toFixed(2) || 0,
      tax_percentage: data?.total_tax || 0,
      items: poItemsList,
      comments: data?.comments ?? undefined,
    };

    try {
      if (idValue) {
        const response = await updatePOApi(poDetailsPayload, idValue);
        if (response?.status === 200) {
          if (fileDetails) {
            const formData = new FormData();
            formData.append("file", fileDetails);
            const responseFile = await addPOAttachment(
              formData,
              response?.data?.id,
            );
            if (responseFile?.status === 201) {
              setIsLoaderFormSubmit(false);
              showSuccessToast("PO updated successfully");
              router.push("/purchaseorder/list");
            } else {
              showErrorToast("Something went wrong!!");
              router.push("/purchaseorder/list");
            }
          } else {
            setIsLoaderFormSubmit(false);
            showSuccessToast("PO updated successfully");
            router.push("/purchaseorder/list");
          }
        } else {
          if (response?.data?.detail) {
            showErrorToast(response?.data?.detail);
          } else {
            setShowItemsDescription(true);
          }
          setIsLoaderFormSubmit(false);
        }
      } else {
        const response = await createPOApi(poDetailsPayload);
        if (response?.status === 201) {
          // If file is attached, upload it after PO creation
          if (fileDetails) {
            const formData = new FormData();
            formData.append("file", fileDetails);
            const responseFile = await addPOAttachment(
              formData,
              response?.data?.id,
            );
            if (responseFile?.status === 201) {
              showSuccessToast("PO created successfully");
            } else {
              showErrorToast("Something went wrong!!");
            }
            router.push("/purchaseorder/list");
          } else {
            showSuccessToast("PO created successfully");
            router.push("/purchaseorder/list");
          }
        } else {
          if (response?.data?.detail) showErrorToast(response?.data?.detail);
          else setShowItemsDescription(true);
        }
        setIsLoaderFormSubmit(false);
      }
    } catch (error) {
      setIsLoaderFormSubmit(false);
    }
  };

  //  MAIN RENDER
  return (
    <>
      {isLoading ? (
        <PageLoader />
      ) : (
        <>
          <div className="flex items-center justify-between mb-6">
            <div className="flex justify-between items-center">
              <p className="text-slate-800 text-lg font-semibold">
                Purchase order details
              </p>
              {fileUrl ? (
                <div className="ms-4 flex items-center">
                  <ToggleSwitch isOn={showPdf} setIsOn={setShowPdf} />
                  <p className="ms-2 text-xs text-slate-800 dark:text-gray-200">
                    {!showPdf ? "Show pdf" : "Hide pdf"}
                  </p>
                </div>
              ) : null}
            </div>
            {/* File upload or file preview actions */}
            {!fileUrl ? (
              <label>
                <input
                  onChange={handleFileChange}
                  type="file"
                  className="hidden"
                  accept={PDF_TYPE}
                />
                <div className="bg-transparent flex items-center text-xs rounded-md transition duration-300 px-3 py-1 cursor-pointer text-primary-500 border border-primary-500 disabled:hover:bg-transparent disabled:text-primary-500 hover:bg-primary-500 hover:text-white">
                  <Upload width={16} className="mr-1" /> Extract PDF
                </div>
              </label>
            ) : (
              files?.status === "completed" && (
                <OutsideClickHandler
                  onClose={() => setShowUploadFileView(false)}
                >
                  <div
                    onClick={() => setShowUploadFileView(!showUploadFileView)}
                    className="flex items-center text-primary-500 hover:text-primary-600 cursor-pointer text-sm"
                  >
                    <Paperclip width={16} className="mr-1" />1 file
                  </div>
                  {showUploadFileView && (
                    <div className="transition-allpdduration-300 ease-out">
                      <UploadFileView
                        removeFile={() => {
                          if (idValue) deletePOAttachmentFunc();
                          setFileUrl(null);
                          setShowUploadFileView(false);
                        }}
                        fileName={
                          fileDetails?.name ||
                          fileResponse?.file_name ||
                          "File 1"
                        }
                      />
                    </div>
                  )}
                </OutsideClickHandler>
              )
            )}
          </div>
          <div>
            <div className="lg:flex gap-10">
              {/* PDF preview section (if file uploaded and showPdf is true) */}
              {fileUrl && showPdf && (
                <div className="lg:w-1/3 bg-white shadow-5xl rounded-md overflow-hidden h-fit">
                  {files?.status === "completed" ? (
                    <div className="flex justify-end py-1 pr-2">
                      <IconWrapper
                        icon={
                          <a href={fileUrl || "#"} download="purchaseorder.pdf">
                            <Download className="cursor-pointer" width={16} />
                          </a>
                        }
                      />
                      <IconWrapper
                        onClick={() => {
                          if (idValue) {
                            deletePOAttachmentFunc();
                          }
                          setFileUrl(null);
                        }}
                        icon={<Trash width={16} />}
                        className="hover:bg-red-100 hover:text-red-500"
                      />
                    </div>
                  ) : null}

                  {/* PDF PREVIEW OR LOADING GIF */}
                  {files?.status === "completed" ? (
                    <PdfViewer fileUrl={fileUrl} />
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
                          animationData={poExtractAnimation}
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
                          {getStatusLabelForExtraction(files?.status || "")}
                        </h2>
                        {getStatusIcon(
                          getStatusLabelForExtraction(files?.status || ""),
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* PO form section */}
              <form
                className={
                  fileUrl && showPdf ? "lg:w-2/3 mt-8 lg:mt-0" : "w-full"
                }
                onKeyDown={handleKeyDown}
                onSubmit={handleSubmit(submitForm)}
              >
                <div>
                  <div
                    className={
                      fileUrl && showPdf ? "w-full" : "lg:w-3/4 w-full"
                    }
                  >
                    {/* PO details fields */}
                    <div className="grid lg:grid-cols-3 md:grid-cols-2 grid-cols-1 gap-5 mb-5">
                      <div>
                        <Label htmlFor="poNumber" text="PO number" />
                        <TextInput
                          register={register("poNumber")}
                          id="poNumber"
                          placeholder="Enter PO no"
                          error={errors.poNumber}
                          value={getValues("poNumber")}
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
                        <Label htmlFor="payment_terms" text="Payment terms" />
                        <SelectComponent
                          name="payment_terms"
                          register={register}
                          trigger={trigger}
                          error={errors?.payment_terms}
                          options={paymentTermsOptions}
                          placeholder="Select payment terms"
                          isClearable={true}
                          getValues={getValues}
                        />
                      </div>
                    </div>
                    {/* PO date and due date fields */}
                    <div className="grid lg:grid-cols-3 md:grid-cols-2 grid-cols-1 gap-5 mb-5">
                      <div>
                        <Label htmlFor="po_date" text="PO date" />
                        <DatePickerDemo
                          register={register}
                          name="po_date"
                          error={errors.po_date}
                          trigger={trigger}
                          placeholder="Select PO date"
                          title="PO date"
                          value={watch("po_date") ?? undefined}
                        />
                      </div>
                      <div>
                        <Label htmlFor="delivery_date" text="Delivery date" />
                        <DatePickerDemo
                          register={register}
                          name="delivery_date"
                          error={errors.delivery_date}
                          trigger={trigger}
                          placeholder="Select delivery date"
                          title="Delivery date"
                          value={watch("delivery_date") ?? undefined}
                          disabledBefore={
                            watch("po_date") != null
                              ? new Date(watch("po_date")!)
                              : undefined
                          }
                        />
                      </div>
                    </div>
                  </div>
                  {/* PO line items table */}
                  <p className="text-slate-800 text-lg font-semibold mt-8 mb-6">
                    PO line items
                  </p>
                  <POItemsTable
                    getValues={getValues}
                    setValue={setValue}
                    control={control}
                    register={register}
                    showItemsDescription={showItemsDescription}
                  />
                  {/* PO summary (subtotal, tax, total) */}
                  <div className="flex justify-end">
                    <div className="p-3 w-72 font-medium text-slate-600 text-sm bg-gray-50 rounded-md">
                      <div className="grid grid-cols-2">
                        <p>Sub total:</p>
                        <p className="text-right">
                          {formatNumber(subtotal, orgDetails?.currency)}
                        </p>
                      </div>
                      <div className="grid items-center grid-cols-2 pb-2 mt-4 mb-3 border-b">
                        <div>
                          <p>Total tax:</p>
                          <span className="text-xs">
                            {formatNumber(totalTaxamount, orgDetails?.currency)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <NumberInput
                            register={register("total_tax")}
                            id="totalTax"
                            error={errors.total_tax}
                            value={getValues("total_tax")}
                            onEnterPress={() => {}}
                            allowDecimal
                            className="text-right"
                          />
                          %
                        </div>
                      </div>
                      <div className="grid grid-cols-2 text-slate-800 font-semibold">
                        <p>Total:</p>
                        <p className="text-right">
                          {formatNumber(total, orgDetails?.currency)}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3">
                    <div>
                      <Label htmlFor="comments" text="Notes" />
                      <TextAreaInput
                        rows={3}
                        register={register("comments")}
                        id="comments"
                        placeholder="Enter notes"
                        error={errors.comments}
                        value={getValues("comments") ?? undefined}
                      />
                    </div>
                  </div>
                  {/* Form action buttons */}
                  <div className="flex items-center gap-3 mt-6">
                    <div className="w-fit">
                      <Button
                        type="submit"
                        text="Save"
                        disabled={isLoaderFormSubmit}
                        className="text-white"
                        onClick={() => setSubmitType("in_review")}
                        isLoading={
                          submitType === "in_review" && isLoaderFormSubmit
                        }
                      />
                    </div>
                    {(!idValue || poDetails?.status === "draft") && (
                      <div className="w-fit">
                        <Button
                          text="Save as draft"
                          type="submit"
                          disabled={isLoaderFormSubmit}
                          onClick={() => setSubmitType("draft")}
                          isLoading={
                            submitType === "draft" && isLoaderFormSubmit
                          }
                          isLoaderDark
                          className="bg-transparent text-primary-500 border border-primary-500 disabled:hover:bg-transparent disabled:text-primary-500 hover:bg-primary-500 hover:text-white"
                        />
                      </div>
                    )}
                    <div className="w-fit">
                      <Button
                        text="Cancel"
                        type="button"
                        onClick={() =>
                          idValue
                            ? router.push(`/purchaseorder/view?id=${idValue}`)
                            : router.push("/purchaseorder/list")
                        }
                        disabled={isLoaderFormSubmit}
                        className="bg-transparent text-primary-500 border border-primary-500 disabled:hover:bg-transparent disabled:text-primary-500 hover:bg-primary-500 hover:text-white"
                      />
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

// Suspense wrapper for AddPOComponentWithParams
const AddPOComponent = () => (
  <Suspense>
    <AddPOComponentWithParams />
  </Suspense>
);

export default AddPOComponent;
