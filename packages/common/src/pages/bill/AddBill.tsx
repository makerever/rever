// Component to render Create Bill UI

"use client";

import {
  addBillSchema,
  addBillSchemaValues,
} from "@rever/validations";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useTranslate } from "@rever/i18n";

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
  ToggleSwitch,
  IconWrapper,
  PageLoader,
  showErrorToast,
  showSuccessToast,
  billExtractAnimation,
  DropdownButton,
} from "@rever/common";
import {
  // billFieldRules,
  paymentTermsOptions as paymentTermsOptionsBase
} from "@rever/constants";
import BillItemsTable from "./BillLineItems";
import {
  formatNumber,
  getStatusLabelForExtraction,
  isNamedObject,
  formatDate,
} from "@rever/utils";
import {
  Option,
  PurchaseOrder,
  VenderDataAPIType,
  AttachmentProps,
  Bill,
  // IntegrationFieldRules,
} from "@rever/types";
import { useBreadcrumbStore, useUserStore } from "@rever/stores";
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
  getVendorsDataAPI,
} from "@rever/services";
import {
  CircleAlert,
  CircleCheck,
  CircleDashed,
  Download,
  Loader,
  Trash,
} from "lucide-react";
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

const AddBillComponentWithParams = () => {
  const translate = useTranslate();
  const [submitType, setSubmitType] = useState("");
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

  const paymentTermsOptions = paymentTermsOptionsBase.map((option)=>{
    return{...option, label:translate('payment_terms_options.' + option.value)}
  })

  // useRouter, URL params, state
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const showPdfValue = searchParams.get("showPdf");
  const router = useRouter();

  // state
  const [vendorOptionList, setVendorOptionList] = useState<Option[]>([]);
  const [purchaseOrderOptionList, setPurchaseOrderOptionList] = useState<
    Option[]
  >([]);
  const [idValue, setIdValue] = useState<string | null>(id);

  const [isLoaderFormSubmit, setIsLoaderFormSubmit] = useState(false);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [fileDetails, setFileDetails] = useState<File | null>(null);
  const [fileResponse, setFileResponse] = useState<AttachmentProps>({});
  const [showUploadFileView, setShowUploadFileView] = useState(false);
  const [showPdf, setShowPdf] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [billDetails, setBillDetails] = useState<Partial<Bill>>({});
  const [files, setFiles] = useState<{
    file?: File;
    status?: string;
    id?: string;
    error_message?: string;
  }>({});
  const [showItemsDescription, setShowItemsDescription] = useState(false);

  const [showBtnPopup, setShowBtnPopup] = useState<boolean>(false);

  const billDetailsSection = useRef<HTMLDivElement | null>(null);
  const [billDetailsHeight, setBillDetailsHeight] = useState<number | null>(
    null,
  );

  // stores
  const orgDetails = useUserStore((state) => state.user?.organization);
  const setDynamicCrumb = useBreadcrumbStore((s) => s.setDynamicCrumb);

  // form watches
  const billDate = watch("bill_date");
  const dueDate = watch("due_date");
  const vendor = watch("vendor");
  const billItems = useWatch({ control, name: "items" }) || [];

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get integration field rules
  // const rules: IntegrationFieldRules = billFieldRules.default;

  // Bill Calculation
  const subtotal = billItems.reduce(
    (sum, item) =>
      (Number(item.quantity) || 0) * (Number(item.unit_price) || 0) + sum,
    0,
  );
  const totalTax = useWatch({ control, name: "total_tax" }) || 0;
  const totalTaxamount = (subtotal * Number(totalTax)) / 100;
  const total = subtotal + totalTaxamount;

  // Watch bill date / due date, clear due date when needed
  useEffect(() => {
    if (dueDate && billDate && new Date(dueDate) < new Date(billDate)) {
      resetField("due_date");
    }
  }, [billDate, dueDate, resetField]);

  // Watch vendor, fetch PO when vendor changes
  useEffect(() => {
    setValue("purchase_order", undefined);
    const vendor_id = getValues("vendor");
    if (vendor_id) getPoList(vendor_id);
  }, [vendor]);

  // Get Bill Details By ID (for editing)
  const getBillDetailsById = useCallback(
    async (idValue: string) => {
      const response = await getBillDetailsByIdApi(idValue);
      if (response?.status === 200) {
        if (response?.data?.status === "approved") {
          router.back();
          return;
        }
        setDynamicCrumb("/bill/edit", {
          id: response?.data?.id,
          name: response?.data?.bill_number,
        });
        setValue("billNumber", response?.data?.bill_number);
        setValue("items", response?.data?.items);
        setValue("bill_date", new Date(response?.data?.bill_date));
        setValue("due_date", new Date(response?.data?.due_date));
        setValue("payment_terms", response?.data?.payment_terms);
        setValue("vendor", response?.data?.vendor?.id);
        setValue("purchase_order", response?.data?.purchase_order?.id);
        setValue("total_tax", response?.data?.tax_percentage);
        setValue("comments", response?.data?.comments);
        setBillDetails(response?.data);

        // Get Bill Attachment
        const responseFile = await getBillAttachment(idValue);
        if (responseFile?.status === 200) {
          setFileResponse(responseFile?.data?.results[0]);
          setFileUrl(responseFile?.data?.results[0]?.file);
          setFiles({ status: "done" });
        }
        setIsLoading(false);
      } else {
        router.push("/bill/list");
      }
    },
    [router, setValue, setDynamicCrumb],
  );

  // Fetch vendor list / bill detail on mount
  useEffect(() => {
    getVendorsList();
    if (idValue) {
      if (showPdfValue === "true") setShowPdf(true);
      getBillDetailsById(idValue);
    } else {
      setIsLoading(false);
    }
  }, [getBillDetailsById, idValue, showPdfValue]);

  //to get current height of PO Detials section
  useEffect(() => {
    if (!isLoading) {
      setBillDetailsHeight(billDetailsSection?.current?.offsetHeight ?? 0);
    }
  }, [isLoading]);

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

  async function getPoList(id: string) {
    const response = await getPoByVendorApi(id);
    if (response?.status === 200) {
      setPurchaseOrderOptionList(
        response?.data?.map((v: PurchaseOrder) => ({
          label: v?.po_number,
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
  const submitForm = async (data: addBillSchemaValues, submitType: string) => {
    setIsLoaderFormSubmit(true);
    // Prepare bill items
    const billItems = data?.items?.map((val) => ({

      id: val.id || undefined,
      description: val.description,
      product_code: val.product_code,
      quantity: val.quantity,
      unit_price: val.unit_price,
      amount: val.amount,
    }));

    // API Payload
    const payload = {
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

    let response;
    if (idValue) {
      response = await updateBillApi(payload, idValue);
    } else {
      response = await createBillApi(payload);
    }

    // Handle API Response
    if (
      (idValue && response?.status === 200) ||
      (!idValue && response?.status === 201)
    ) {
      // If fileDetails present, attach after bill created/updated
      if (fileDetails) {
        const formData = new FormData();
        formData.append("file", fileDetails);
        const responseFile = await addBillAttachment(
          formData,
          (response?.data?.id || idValue)!,
        );
        if (responseFile?.status === 201) {
          setIsLoaderFormSubmit(false);
          showSuccessToast(
            idValue ? "Bill updated successfully" : "Bill created successfully",
          );
          if (idValue) {
            router.push(`/bill/view?id=${idValue}`);
          }
          else {
            router.push("/bill/list");
          }
          return;
        } else {
          showErrorToast("Something went wrong!!");
        }
        router.push("/bill/list");
        return;
      }
      setIsLoaderFormSubmit(false);
      showSuccessToast(
        idValue ? "Bill updated successfully" : "Bill created successfully",
      );
      if (idValue) {
        router.push(`/bill/view?id=${idValue}`);
      }
      else {
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
  async function deleteBillAttachmentFunc() {
    const response = await deleteBillAttachment(fileResponse?.id || "");
    if (response?.status === 204 && idValue) {
      showSuccessToast("Bill attachment deleted");
      getBillDetailsById(idValue);
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
                  {idValue ? billDetails?.bill_number : "New Bill"}
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
                      name={idValue ? "Upload bill" : "Extract bill"}
                      button_type="primary-outline"
                      icon_type="upload"
                      disabled={isLoaderFormSubmit}
                      onClick={() => fileInputRef.current?.click()} // triggers file input
                    />
                  </div>
                ) : null}

                <Button
                  name={translate('buttons.cancel')}
                  onClick={() =>
                    idValue
                      ? router.push(`/bill/view?id=${idValue}`)
                      : router.push("/bill/list")
                  }
                  button_type="secondary-outline"
                  disabled={isLoaderFormSubmit}
                />

                {!idValue || billDetails?.status === "draft" ? (
                  <DropdownButton
                    name={translate('buttons.save')}
                    onActionBtClick={() => {
                      triggerSubmit("in_review");
                    }}
                    onClose={() => setShowBtnPopup(false)}
                    onBtnPopupItemsClick={(val) => {
                      if (val === translate('buttons.save_draft')) {
                        triggerSubmit("draft");
                      }
                    }}
                    onClickArrow={() => setShowBtnPopup(true)}
                    showBtnPopup={showBtnPopup}
                    btnPopupItems={[translate('buttons.save'), translate('buttons.save_draft')]}
                    button_type="primary"
                  />
                ) : (
                  <Button
                    name={translate('buttons.save')}
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
              {/* ----- Bill Form  ------ */}
              <form
                className={
                  fileUrl && showPdf ? "lg:w-[70%] mt-8 lg:mt-0" : "w-full"
                }
                onKeyDown={handleKeyDown}
              >
                <div>
                  <div
                    ref={billDetailsSection}
                    className={`rounded-[20px] bg-white p-4 border border-secondary-200`}
                  >
                    {/* Bill details fields */}
                    <p className="text-neutral-1100 text-xl font-medium mb-5">
                      {translate('create_bill.heading')}
                    </p>
                    <div className="grid lg:grid-cols-3 md:grid-cols-2 grid-cols-1 gap-4">
                      <div>
                        <Label
                          htmlFor="billNumber"
                          text={translate('create_bill.bill_name')}
                          isRequired
                        />
                        <TextInput
                          register={register("billNumber")}
                          id="billNumber"
                          placeholder={translate('placeholders.bill.enter_bill')}
                          error={errors.billNumber}
                          value={getValues("billNumber")}
                        />
                      </div>
                      <div>
                        <Label htmlFor="vendor" text={translate('create_bill.vendor')} isRequired />
                        <SelectComponent
                          name="vendor"
                          register={register}
                          trigger={trigger}
                          title={translate('create_bill.vendor')}
                          error={errors?.vendor}
                          options={vendorOptionList}
                          placeholder={translate('placeholders.bill.select_vendor')}
                          isClearable={true}
                          getValues={getValues}
                        />
                      </div>
                      <div>
                        <Label htmlFor="purchase_order" text={translate('create_bill.purchase_order')} />
                        <SelectComponent
                          name="purchase_order"
                          register={register}
                          trigger={trigger}
                          title={translate('create_bill.purchase_order')}
                          error={errors?.purchase_order}
                          options={purchaseOrderOptionList}
                          placeholder={translate('placeholders.bill.select_po')}
                          isClearable={true}
                          getValues={getValues}
                        />
                      </div>
                      <div>
                        <Label htmlFor="payment_terms" text={translate('create_bill.payment_terms')} />
                        <SelectComponent
                          name="payment_terms"
                          register={register}
                          trigger={trigger}
                          error={errors?.payment_terms}
                          options={paymentTermsOptions}
                          placeholder={translate('placeholders.bill.select_pt')}
                          isClearable={true}
                          getValues={getValues}
                        />
                      </div>
                      <div>
                        <Label
                          htmlFor="bill_date"
                          text={translate('create_bill.bill_date')}
                        />
                        <DatePickerDemo
                          register={register}
                          name="bill_date"
                          error={errors.bill_date}
                          trigger={trigger}
                          placeholder={translate('placeholders.bill.select_bill_date')}
                          title={translate('create_bill.bill_date')}
                          value={watch("bill_date") ?? undefined}
                        />
                      </div>
                      <div>
                        <Label
                          htmlFor="due_date"
                          text={translate('create_bill.due_date')}
                        />
                        <DatePickerDemo
                          register={register}
                          name="due_date"
                          error={errors.due_date}
                          trigger={trigger}
                          placeholder={translate('placeholders.bill.select_due_date')}
                          title={translate('create_bill.due_date')}
                          value={watch("due_date") ?? undefined}
                          disabledBefore={
                            watch("bill_date") != null
                              ? new Date(watch("bill_date")!)
                              : undefined
                          }
                        />
                      </div>
                    </div>
                  </div>
                  {/* Bill line items */}

                  <div
                    className={`rounded-[20px] bg-white p-4 border border-secondary-200`}
                    style={{
                      minHeight: `calc(100vh - 10rem - ${billDetailsHeight ?? 0}px)`, //is for mesh UI - border 1px y-axis, padding 1px y-axis
                    }}
                  >
                    <p className="text-neutral-1100 text-xl font-medium mb-5">
                      {translate('create_bill.bill_line_items.heading')}
                    </p>

                    <BillItemsTable
                      getValues={getValues}
                      setValue={setValue}
                      control={control}
                      register={register}
                      showItemsDescription={showItemsDescription}
                    />

                    <div className="flex items-center justify-between">
                      {/* Notes */}
                      <div className="w-1/2">
                        <Label htmlFor="comments" text={translate('create_bill.notes')} />
                        <TextAreaInput
                          rows={4}
                          register={register("comments")}
                          id="comments"
                          placeholder={translate('create_bill.enter_notes')}
                          error={errors.comments}
                          value={getValues("comments") ?? undefined}
                        />
                      </div>

                      {/* Bill Summary */}
                      <div className="flex justify-end">
                        <div className="p-4 w-72 font-medium text-sm bg-secondary-100 rounded-[20px]">
                          <div className="grid grid-cols-2">
                            <p className="text-neutral-1100">{translate('create_bill.sub_total')}:</p>
                            <p className="text-neutral-900 text-right">
                              {formatNumber(subtotal, orgDetails?.currency)}
                            </p>
                          </div>
                          <div className="grid items-center grid-cols-2 pb-2 mt-4 mb-2">
                            <div>
                              <p className="text-neutral-1100">{translate('create_bill.total_tax')}:</p>
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
                            <p className="text-neutral-1100">{translate('create_bill.total')}:</p>
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
                    Bill preview
                  </p>
                  {files.status === "done" ? (
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
            </div>
          </div>
        </>
      )}
    </>
  );
};

// Suspense wrapper
const AddBillComponent = () => (
  <Suspense>
    <AddBillComponentWithParams />
  </Suspense>
);

export default AddBillComponent;
