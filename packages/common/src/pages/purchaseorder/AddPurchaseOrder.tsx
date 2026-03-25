// Component to render Create PO UI

"use client";

import {
  createAddPurchaseOrderSchema,
  addPurchaseOrderSchemaValues,
} from "@rever/validations";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
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
  ToggleSwitch,
  IconWrapper,
  PageLoader,
  poExtractAnimation,
  PillItem,
  DropdownButton,
} from "@rever/common";
import { paymentTermsOptions } from "@rever/constants";
import POItemsTable from "./POLineItems";
import {
  formatNumber,
  getStatusLabelForExtraction,
  isNamedObject,
  formatDate,
  getStatusClass,
  getLabelForBillStatus,
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
  Trash,
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
import { useTranslate } from "@rever/i18n";
import Lottie from "lottie-react";

const getStatusIcon = (status: string, error_message?: string, fileSizeLimitMsg?: string) => {
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
          content={error_message || fileSizeLimitMsg || "File must be under 5MB and limited to 5 pages"}
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

const MAX_POLL_ATTEMPTS = 20;
const POLL_DELAY_MS = 2000;
const PDF_TYPE = "application/pdf";

const AddPOComponentWithParams = () => {
  const translate = useTranslate();
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
    resolver: zodResolver(createAddPurchaseOrderSchema(translate)),
    mode: "onChange",
    defaultValues: {
      items: [
        {
          description: "",
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

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [showBtnPopup, setShowBtnPopup] = useState<boolean>(false);
  const [isLoaderFormSubmit, setIsLoaderFormSubmit] = useState(false);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [fileDetails, setFileDetails] = useState<File | null>(null);
  const [fileResponse, setFileResponse] = useState<AttachmentProps>({});
  const [showUploadFileView, setShowUploadFileView] = useState<boolean>(false);
  const [showPdf, setShowPdf] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [poDetails, setPODetails] = useState<Partial<PurchaseOrder>>({});

  const poDetailsSection = useRef<HTMLDivElement | null>(null);
  const [poDetailsHeight, setPoDetailsHeight] = useState<number | null>(null);
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

  //to get current height of PO Detials section
  useEffect(() => {
    if (!isLoading) {
      setPoDetailsHeight(poDetailsSection?.current?.offsetHeight ?? 0);
    }
  }, [isLoading]);

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
        setValue(
          "po_date",
          new Date(response?.data?.po_date),
        );
        setValue(
          "delivery_date",
          new Date(response?.data?.delivery_date)
        );
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
          setFiles({ status: "done" });
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

  //  FILES / PDF HANDLING

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
        formData.append("document_type", "purchaseorder");

        const uploadRes = await uploadDocument(formData);
        if (uploadRes?.status === 201) {
          const { id } = uploadRes.data;
          await pollDocumentStatus(id);
        } else {
          if (
            uploadRes &&
            uploadRes?.data[0] ===
            "Your subscription has expired. Please renew to continue."
          ) {
            showErrorToast(translate("common.subscription_expired"));
            setShowPdf(false);
            setFileUrl(null);
            setFileDetails(null);
          } else {
            setShowPdf(false);
            setFileUrl(null);
            setFileDetails(null);
            showErrorToast(translate("common.file_size_limit"));
          }
        }
      }
    } else {
      alert(translate("common.upload_valid_pdf"));
    }
  };

  const pollDocumentStatus = async (id: string) => {
    for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt++) {
      try {
        const fileRes = await getDocument(id);
        if (fileRes.status !== 200) throw new Error("Fetch failed");
        const { status, target_object_id, error_message } = fileRes.data;
        setFiles({ status });

        if (status === "done" && target_object_id) {
          setIdValue(target_object_id);
          setShowPdf(true);
          break;
        }
        if (status === "failed") {
          setShowPdf(false);
          setFileUrl(null);
          setFileDetails(null);
          showErrorToast(
            error_message || translate("common.file_size_limit"),
          );
          break;
        }
      } catch (err) {
        console.error("Polling error:", err);
      }
      await new Promise((r) => setTimeout(r, POLL_DELAY_MS));
    }
  };

  const deletePOAttachmentFunc = useCallback(async () => {
    if (!fileResponse?.id) return;
    const response = await deletePOAttachment(fileResponse?.id || "");
    if (response?.status === 204 && idValue) {
      showSuccessToast(translate("purchase_order.attachment_deleted"));
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

  const triggerSubmit = (submitType: "draft" | "in_review") => {
    setSubmitType(submitType);
    handleSubmit((data) => submitForm(data, submitType))();
    setShowBtnPopup(false);
  };

  const submitForm = async (
    data: addPurchaseOrderSchemaValues,
    submitType: string,
  ) => {
    setIsLoaderFormSubmit(true);

    const poItemsList = data?.items?.map((val) => ({
      id: val.id || undefined,
      description: val.description,
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
          showSuccessToast(translate("purchase_order.updated"));
          // router.push("/purchaseorder/list");
          router.push(`/purchaseorder/view?id=${idValue}`);
        } else {
          if (response?.data?.detail) showErrorToast(response?.data.detail);
          else setShowItemsDescription(true);
        }
        setIsLoaderFormSubmit(false);
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
              showSuccessToast(translate("purchase_order.created"));
            } else {
              showErrorToast(translate("common.something_went_wrong"));
            }
            router.push("/purchaseorder/list");
          } else {
            showSuccessToast(translate("purchase_order.created"));
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
          {/* Header section: PO number, status, PDF toggle, edit/delete icons */}
          <div className="flex items-center justify-between bg-white rounded-b-[20px] p-4 pt-16 border border-secondary-200">
            <div className="flex items-center gap-3">
              {/* Po number */}
              <p className="text-neutral-1100 font-medium text-2xl">
                {poDetails?.po_number ?? translate("purchase_order.new_po")}
              </p>

              {/* Toggle to show/hide PDF if fileUrl exists */}
              {fileUrl ? (
                <div className="flex items-center">
                  <ToggleSwitch isOn={showPdf} setIsOn={setShowPdf} />
                  <p className="ms-1.5 text-sm text-neutral-1100 font-medium">
                    {!showPdf ? translate("purchase_order.actions.show_pdf") : translate("purchase_order.actions.hide_pdf")}
                  </p>
                </div>
              ) : null}
            </div>
            {/* Dropdown button for actions */}
            <div className="flex items-center justify-center gap-3">
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
                      name={idValue ? translate("purchase_order.upload_po_btn") : translate("purchase_order.extract_po_btn")}
                      button_type="primary-outline"
                      icon_type="upload"
                      disabled={isLoaderFormSubmit}
                      onClick={() => fileInputRef.current?.click()} // triggers file input
                    />
                  </div>
                ) : null}
              </div>
              {/* Form action buttons */}
              <div className="flex items-center gap-3">
                <div className="w-fit">
                  <Button
                    name={translate("buttons.cancel")}
                    onClick={() =>
                      idValue
                        ? router.push(`/purchaseorder/view?id=${idValue}`)
                        : router.push("/purchaseorder/list")
                    }
                    disabled={isLoaderFormSubmit}
                    button_type="secondary-outline"
                  />
                </div>
                {!idValue || poDetails?.status === "draft" ? (
                  <DropdownButton
                    name={translate("buttons.save")}
                    onActionBtClick={() => {
                      triggerSubmit("in_review");
                    }}
                    onClose={() => setShowBtnPopup(false)}
                    onBtnPopupItemsClick={(val) => {
                      if (val === translate("buttons.save_draft")) {
                        triggerSubmit("draft");
                      }
                    }}
                    onClickArrow={() => setShowBtnPopup(true)}
                    showBtnPopup={showBtnPopup}
                    btnPopupItems={[translate("buttons.save"), translate("buttons.save_draft")]}
                    button_type="primary"
                  />
                ) : (
                  <Button
                    name={translate("buttons.save")}
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
              {/* PO form section */}
              <form
                className={
                  fileUrl && showPdf ? "lg:w-[70%] mt-8 lg:mt-0" : "w-full"
                }
                onKeyDown={handleKeyDown}
              >
                {/* PO Details Section */}
                <div
                  ref={poDetailsSection}
                  className={`rounded-[20px] bg-white p-4 border border-secondary-200`}
                >
                  {/* PO details fields */}
                  <p className="text-neutral-1100 text-xl font-medium mb-5">
                    {translate("purchase_order.po_details")}
                  </p>
                  <div className="grid lg:grid-cols-3 md:grid-cols-2 grid-cols-1 gap-5 mb-5">
                    <div>
                      <Label htmlFor="poNumber" text={translate("purchase_order.create_po.po_number")} />
                      <TextInput
                        register={register("poNumber")}
                        id="poNumber"
                        placeholder={translate("placeholders.po.enter_po")}
                        error={errors.poNumber}
                        value={getValues("poNumber")}
                      />
                    </div>
                    <div>
                      <Label htmlFor="vendor" text={translate("purchase_order.create_po.vendor")} isRequired />
                      <SelectComponent
                        name="vendor"
                        register={register}
                        trigger={trigger}
                        title={translate("purchase_order.create_po.vendor")}
                        error={errors?.vendor}
                        options={vendorOptionList}
                        placeholder={translate("placeholders.bill.select_vendor")}
                        isClearable={true}
                        getValues={getValues}
                      />
                    </div>
                    <div>
                      <Label htmlFor="payment_terms" text={translate("purchase_order.create_po.payment_terms")} />
                      <SelectComponent
                        name="payment_terms"
                        register={register}
                        trigger={trigger}
                        error={errors?.payment_terms}
                        options={paymentTermsOptions.map((opt) => ({ ...opt, label: translate(`payment_terms_options.${opt.value}`) }))}
                        placeholder={translate("placeholders.bill.select_pt")}
                        isClearable={true}
                        getValues={getValues}
                      />
                    </div>
                  </div>
                  {/* PO date and due date fields */}
                  <div className="grid lg:grid-cols-3 md:grid-cols-2 grid-cols-1 gap-5 mb-5">
                    <div>
                      <Label htmlFor="po_date" text={translate("purchase_order.create_po.po_date")} />
                      <DatePickerDemo
                        register={register}
                        name="po_date"
                        error={errors.po_date}
                        trigger={trigger}
                        placeholder={translate("placeholders.po.select_po_date")}
                        title={translate("purchase_order.create_po.po_date")}
                        value={watch("po_date") ?? undefined}
                      />
                    </div>
                    <div>
                      <Label htmlFor="delivery_date" text={translate("purchase_order.create_po.delivery_date")} />
                      <DatePickerDemo
                        register={register}
                        name="delivery_date"
                        error={errors.delivery_date}
                        trigger={trigger}
                        placeholder={translate("placeholders.po.select_delivery_date")}
                        title={translate("purchase_order.create_po.delivery_date")}
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
                <div
                  className={`rounded-[20px] bg-white py-4 border border-secondary-200`}
                  style={{
                    minHeight: `calc(100vh - 10rem - ${poDetailsHeight ?? 0}px - 2px)`, //2px (348) is for mesh UI - border 1px y-axis, padding 1px y-axis
                  }}
                >
                  <p className="text-neutral-1100 text-xl font-medium mb-5 px-4">
                    {translate("purchase_order.create_po.po_line_items.heading")}
                  </p>
                  <POItemsTable
                    getValues={getValues}
                    setValue={setValue}
                    control={control}
                    register={register}
                    showItemsDescription={showItemsDescription}
                  />
                  <div className="flex items-center justify-between mt-5 px-4">
                    <div className="w-1/2">
                      <Label htmlFor="comments" text={translate("purchase_order.create_po.notes")} />
                      <TextAreaInput
                        rows={4}
                        register={register("comments")}
                        id="comments"
                        placeholder={translate("purchase_order.create_po.enter_notes")}
                        error={errors.comments}
                        value={getValues("comments") ?? undefined}
                      />
                    </div>
                    {/* PO summary (subtotal, tax, total) */}
                    <div className="p-3 w-72 font-medium text-sm bg-secondary-100 rounded-[20px] flex flex-col gap-5">
                      <div className="grid grid-cols-2">
                        <p className="text-neutral-1100">{translate("purchase_order.create_po.sub_total")}:</p>
                        <p className="text-right text-neutral-900">
                          {formatNumber(subtotal, orgDetails?.currency)}
                        </p>
                      </div>
                      <div className="grid items-center grid-cols-2">
                        <div className="flex flex-col text-neutral-1100">
                          <p className="">{translate("purchase_order.create_po.total_tax")}:</p>
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
                            onEnterPress={() => { }}
                            allowDecimal
                            className="text-right"
                          />
                          %
                        </div>
                      </div>
                      <div className="grid grid-cols-2 font-semibold">
                        <p className="text-neutral-1100">{translate("purchase_order.create_po.grand_total")}:</p>
                        <p className="text-right text-neutral-900">
                          {formatNumber(total, orgDetails?.currency)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </form>
              {/* PDF preview section (if file uploaded and showPdf is true) */}
              {fileUrl && showPdf && (
                <div className="relative lg:w-[30%] scrollbar_none rounded-[20px] bg-white border border-secondary-200 overflow-hidden">
                  <p className="p-4 pb-0 text-neutral-1100 text-xl font-medium">
                    {translate("purchase_order.purchase_order_preview")}
                  </p>
                  {files?.status === "done" ? (
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
                  {files?.status === "done" ? (
                    <PdfViewer fileUrl={fileUrl} />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-145">
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
                          undefined,
                          translate("common.file_size_limit"),
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

// Suspense wrapper for AddPOComponentWithParams
const AddPOComponent = () => (
  <Suspense>
    <AddPOComponentWithParams />
  </Suspense>
);

export default AddPOComponent;
