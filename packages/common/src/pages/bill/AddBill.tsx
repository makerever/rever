// Component to render Create Bill UI

"use client";

// Import dependencies, validation schemas, UI components, types, and utilities
import { addBillSchema, addBillSchemaValues } from "@rever/validations";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import {
  billExtractAnimation,
  Button,
  CustomTooltip,
  PdfViewer,
  TextAreaInput,
} from "@rever/common";
import { Label } from "@rever/common";
import { TextInput } from "@rever/common";
import { SelectComponent } from "@rever/common";
import { paymentTermsOptions } from "@rever/constants";
import { DatePickerDemo } from "@rever/common";
import BillItemsTable from "./BillLineItems";
import { NumberInput } from "@rever/common";
import { formatNumber, getStatusLabelForExtraction } from "@rever/utils";
import { Option, PurchaseOrder } from "@rever/types";
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
import { OutsideClickHandler } from "@rever/common";
import { UploadFileView } from "@rever/common";
import { ToggleSwitch } from "@rever/common";
import { IconWrapper } from "@rever/common";
import { formatDate } from "@rever/utils";
import { showErrorToast, showSuccessToast } from "@rever/common";
import {
  addBillAttachment,
  createBillApi,
  deleteBillAttachment,
  getBillAttachment,
  getBillDetailsByIdApi,
  getDocument,
  getPoByVendorApi,
  updateBillApi,
  uploadDocument,
} from "@rever/services";
import { getVendorsDataAPI } from "@rever/services";
import { VenderDataAPIType } from "@rever/types";
import { AttachmentProps, Bill } from "@rever/types";
import { useBreadcrumbStore, useUserStore } from "@rever/stores";
import { PageLoader } from "@rever/common";
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

// Main Add Bill component with URL params
const AddBillComponentWithParams = () => {
  // Initialize react-hook-form with Zod validation
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
    resolver: zodResolver(addBillSchema),
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

  // Get bill ID from URL if present
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const showPdfValue = searchParams.get("showPdf");
  const router = useRouter();

  // Watch bill line items for calculations
  const billItems =
    useWatch({
      control,
      name: "items",
    }) || [];

  // State for vendor dropdown options
  const [vendorOptionList, setVendorOptionList] = useState<Option[]>([]);

  // State for po dropdown options
  const [purchaseOrderOptionList, setPurchaseOrderOptionList] = useState<
    Option[]
  >([]);

  // UI and file upload states
  const [isLoaderFormSubmit, setIsLoaderFormSubmit] = useState(false);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [fileDetails, setFileDetails] = useState<File | null>(null);
  const [fileResponse, setFileResponse] = useState<AttachmentProps>({});
  const [showUploadFileView, setShowUploadFileView] = useState<boolean>(false);
  const [showPdf, setShowPdf] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  // Bill details and submit type state
  const [billDetails, setBillDetails] = useState<Partial<Bill>>({});
  const [submitType, setSubmitType] = useState("");

  const [showItemsDescription, setShowItemsDescription] =
    useState<boolean>(false);

  const [idValue, setIdValue] = useState<string | null>(id);
  const [files, setFiles] = useState<{
    file?: File;
    status?: string;
    id?: string;
    error_message?: string;
  }>({});

  const orgDetails = useUserStore((state) => state.user?.organization);

  const setDynamicCrumb = useBreadcrumbStore((s) => s.setDynamicCrumb);

  const billDate = watch("bill_date");
  const dueDate = watch("due_date");
  const vendor = watch("vendor");

  useEffect(() => {
    if (dueDate && new Date(dueDate) < new Date(billDate)) {
      resetField("due_date");
    }
  }, [billDate]);

  useEffect(() => {
    const vendor_id = getValues("vendor");
    if (vendor_id) {
      getPoList(vendor_id);
    }
  }, [vendor]);

  // Fetch bill details and attachment by ID (for editing)
  const getBillDetailsById = useCallback(
    async (idValue: string) => {
      const response = await getBillDetailsByIdApi(idValue);
      if (response?.status === 200) {
        if (response?.data?.status === "approved") {
          router.back();
        }
        setDynamicCrumb("/bill/edit", {
          id: response?.data?.id,
          name: response?.data?.bill_number,
        });
        setValue("billNumber", response?.data.bill_number);
        setValue("items", response?.data?.items);
        setValue("bill_date", new Date(response?.data?.bill_date));
        setValue("due_date", new Date(response?.data?.due_date));
        setValue("payment_terms", response?.data?.payment_terms);
        setValue("vendor", response?.data?.vendor?.id);
        setValue("purchase_order", response?.data?.purchase_order?.id);
        setValue("total_tax", response?.data?.tax_percentage);
        setValue("comments", response?.data?.comments);
        setBillDetails(response?.data);

        // Fetch bill attachment (PDF)
        const responseFile = await getBillAttachment(idValue);
        if (responseFile?.status === 200) {
          setFileResponse(responseFile?.data?.results[0]);
          setFileUrl(responseFile?.data?.results[0]?.file);
          setFiles({ status: "completed" });
        }
        setIsLoading(false);
      } else {
        router.push("/bill/list");
      }
    },
    [router, setValue],
  );

  // Fetch vendor list and bill details (if editing) on mount
  useEffect(() => {
    getVendorsList();
    if (idValue) {
      if (showPdfValue && showPdfValue === "true") {
        setShowPdf(true);
      }
      getBillDetailsById(idValue);
    } else {
      setIsLoading(false);
    }
  }, [getBillDetailsById, idValue, showPdfValue]);

  // Fetch vendor options for dropdown
  const getVendorsList = async () => {
    const response = await getVendorsDataAPI();
    if (response?.status === 200) {
      const data = response?.data?.results?.map((v: VenderDataAPIType) => {
        return {
          label: v?.vendor_name,
          value: v?.id,
        };
      });
      setVendorOptionList(data);
    }
  };

  // Fetch po options for dropdown
  const getPoList = async (id: string) => {
    const response = await getPoByVendorApi(id);
    if (response?.status === 200) {
      const data = response?.data?.map((v: PurchaseOrder) => {
        return {
          label: v?.po_number,
          value: v?.id,
        };
      });
      setPurchaseOrderOptionList(data);
    }
  };

  // Prevent form submission on Enter except for textarea
  const handleKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
    if (e.key === "Enter" && (e.target as HTMLElement).tagName !== "TEXTAREA") {
      e.preventDefault();
    }
  };

  // Handle form submission for create/update bill
  const submitForm = async (data: addBillSchemaValues) => {
    setIsLoaderFormSubmit(true);
    // Prepare bill items for API
    const billItems = data?.items?.map((val) => {
      return {
        id: val.id || undefined,
        description: val.description,
        product_code: val.product_code,
        quantity: val.quantity,
        unit_price: val.unit_price,
        amount: val.amount,
      };
    });

    // Prepare bill details payload
    const billDetails = {
      bill_number: data?.billNumber,
      vendor_id: data.vendor,
      purchase_order_id: data.purchase_order,
      payment_terms: data?.payment_terms,
      bill_date: data?.bill_date
        ? formatDate(data?.bill_date, "yyyy-MM-dd", "", true)
        : null,
      due_date: data?.due_date
        ? formatDate(data?.due_date, "yyyy-MM-dd", "", true)
        : null,
      comments: data?.comments ?? undefined,
      status: submitType,
      sub_total: subtotal.toFixed(2) || 0,
      total: total.toFixed(2) || 0,
      total_tax: totalTaxamount.toFixed(2) || 0,
      tax_percentage: data?.total_tax || 0,
      items: billItems,
    };

    // Update bill if editing, else create new bill
    if (idValue) {
      const response = await updateBillApi(billDetails, idValue);
      if (response?.status === 200) {
        if (fileDetails) {
          const formData = new FormData();
          formData.append("file", fileDetails);
          const responseFile = await addBillAttachment(
            formData,
            response?.data?.id,
          );
          if (responseFile?.status === 201) {
            setIsLoaderFormSubmit(false);
            showSuccessToast("Bill updated successfully");
            router.push("/bill/list");
          } else {
            showErrorToast("Something went wrong!!");
            router.push("/bill/list");
          }
        } else {
          setIsLoaderFormSubmit(false);
          showSuccessToast("Bill updated successfully");
          router.push("/bill/list");
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
      const response = await createBillApi(billDetails);
      if (response?.status === 201) {
        // If file is attached, upload it after bill creation
        if (fileDetails) {
          const formData = new FormData();
          formData.append("file", fileDetails);
          const responseFile = await addBillAttachment(
            formData,
            response?.data?.id,
          );
          if (responseFile?.status === 201) {
            setIsLoaderFormSubmit(false);
            showSuccessToast("Bill created successfully");
            router.push("/bill/list");
          } else {
            showErrorToast("Something went wrong!!");
            router.push("/bill/list");
          }
        } else {
          setIsLoaderFormSubmit(false);
          showSuccessToast("Bill created successfully");
          router.push("/bill/list");
        }
      } else {
        if (response?.data?.detail) {
          showErrorToast(response?.data?.detail);
        } else {
          setShowItemsDescription(true);
        }
        setIsLoaderFormSubmit(false);
      }
    }
  };

  // Bill Calculation
  const subtotal = billItems.reduce(
    (sum, item) =>
      (Number(item.quantity) || 0) * (Number(item.unit_price) || 0) + sum,
    0,
  );
  const totalTax = useWatch({ control, name: "total_tax" }) || 0;
  const totalTaxamount = (subtotal * Number(totalTax)) / 100;
  const total = subtotal + totalTaxamount;

  // PDF upload/preview handlers
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (uploadedFile && uploadedFile.type === PDF_TYPE) {
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
        formData.append("document_type", "bill");
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

  // Delete attachment
  async function deleteBillAttachmentFunc() {
    const response = await deleteBillAttachment(fileResponse?.id || "");
    if (response?.status === 204 && idValue) {
      showSuccessToast("Bill attachment deleted");
      getBillDetailsById(idValue);
    }
  }

  // Render UI
  return (
    <>
      {isLoading ? (
        <PageLoader />
      ) : (
        <>
          <div className="flex items-center justify-between mb-6">
            <div className="flex justify-between items-center">
              <p className="text-slate-800 text-lg font-semibold">
                Bill details
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

            {/* File upload or attachment actions */}
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
              files.status === "completed" && (
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
                    <div>
                      <UploadFileView
                        removeFile={() => {
                          if (idValue) deleteBillAttachmentFunc();
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
              {/* PDF Preview */}
              {fileUrl && showPdf && (
                <div className="lg:w-1/3 scrollbar_none overflow-auto bg-white shadow-5xl rounded-md overflow-hidden h-fit">
                  {files.status === "completed" ? (
                    <>
                      <div className="flex justify-end py-1 pr-2">
                        <IconWrapper
                          icon={
                            <a href={fileUrl || "#"} download="bill.pdf">
                              <Download className="cursor-pointer" width={16} />
                            </a>
                          }
                        />
                        <IconWrapper
                          onClick={() => {
                            if (idValue) deleteBillAttachmentFunc();
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
                          animationData={billExtractAnimation}
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

              {/* Bill form section */}
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
                    {/* Bill details fields */}
                    <div className="grid lg:grid-cols-3 md:grid-cols-2 grid-cols-1 gap-5 mb-5">
                      <div>
                        <Label htmlFor="billNumber" text="Bill number" />
                        <TextInput
                          register={register("billNumber")}
                          id="billNumber"
                          placeholder="Enter bill no"
                          error={errors.billNumber}
                          value={getValues("billNumber")}
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
                    </div>

                    {/* Bill date and due date fields */}
                    <div className="grid lg:grid-cols-3 md:grid-cols-2 grid-cols-1 gap-5 mb-5">
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
                      <div>
                        <Label
                          htmlFor="bill_date"
                          text="Bill date"
                          isRequired
                        />

                        <DatePickerDemo
                          register={register}
                          name="bill_date"
                          error={errors.bill_date}
                          trigger={trigger}
                          placeholder="Select bill date"
                          title="Bill date"
                          value={watch("bill_date")}
                        />
                      </div>
                      <div>
                        <Label htmlFor="due_date" text="Due date" isRequired />
                        <DatePickerDemo
                          register={register}
                          name="due_date"
                          error={errors.due_date}
                          trigger={trigger}
                          placeholder="Select due date"
                          title="Due date"
                          value={watch("due_date")}
                          disabledBefore={
                            watch("bill_date")
                              ? new Date(watch("bill_date"))
                              : undefined
                          }
                        />
                      </div>
                    </div>
                  </div>

                  {/* Bill line items table */}
                  <p className="text-slate-800 text-lg font-semibold mt-8 mb-6">
                    Bill line items
                  </p>

                  <BillItemsTable
                    getValues={getValues}
                    setValue={setValue}
                    control={control}
                    register={register}
                    showItemsDescription={showItemsDescription}
                  />

                  {/* Bill summary (subtotal, tax, total) */}
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
                  <div className="flex items-center gap-3 mt-10">
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

                    {/* Show "Save as draft" if creating or bill is draft */}
                    {(!idValue || billDetails?.status === "draft") && (
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
                            ? router.push(`/bill/view?id=${idValue}`)
                            : router.push("/bill/list")
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

// Suspense wrapper for AddBillComponentWithParams
const AddBillComponent = () => {
  return (
    <Suspense>
      <AddBillComponentWithParams />
    </Suspense>
  );
};

export default AddBillComponent;
