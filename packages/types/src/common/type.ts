// TS common inteface objects

import { ColumnDef } from "@tanstack/react-table";
import { Dispatch, ReactNode, SetStateAction } from "react";
import {
  FieldError,
  FieldValues,
  Path,
  UseFormRegister,
  UseFormRegisterReturn,
  UseFormSetValue,
  UseFormTrigger,
} from "react-hook-form";
import { MultiValue, SingleValue } from "react-select";
import { bankDetailsTypes, billingAddress } from "../apiTypes/type";
import { LoggedUserProps } from "../store/type";

// Interface for button component props
export interface ButtonProps {
  name: string;
  onClick?: () => void;
  disabled?: boolean;
  type?: "submit" | "reset" | "button";
  button_type?:
  | "primary"
  | "primary-outline"
  | "secondary"
  | "secondary-outline"
  | "danger"
  | "danger-outline"
  | "success"
  | "success-outline";
  icon_type?:
  | "upload"
  | "download"
  | "create"
  | "approve"
  | "reject"
  | "loader"
  | "mailPlus"
  | "plus"
  | "loaderCircle"
  | null;
  width?: string;
}

// Interface for label component props
export interface LabelProps {
  htmlFor?: string;
  text: string;
  className?: string;
  isRequired?: boolean;
}

// Interface for text input component props
export interface TextInputProps<T extends FieldValues> {
  id: Path<T>;
  placeholder?: string;
  className?: string;
  value?: string;
  clearIcon?: boolean;
  clearInput?: () => void;
  register?: UseFormRegisterReturn;
  error?: { message?: string };
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  stepNo?: number;
  onEnterPress?: () => void;
  type?: string;
  disabled?: boolean;
  focusOnMount?: boolean;
  validateNumber?: boolean;
  noErrorIcon?: boolean;
}

// Interface for number input component props
export interface NumberInputProps<T extends FieldValues> {
  id?: string;
  name?: Path<T>;
  register?: UseFormRegisterReturn;
  value?: string | number;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: FieldError;
  onEnterPress?: () => void;
  allowDecimal?: boolean;
  className?: string;
}

// Interface for textarea input component props
export interface TextAreaInputProps<T extends FieldValues> {
  id: Path<T>;
  placeholder?: string;
  className?: string;
  value?: string;
  clearIcon?: boolean;
  clearInput?: () => void;
  register?: UseFormRegisterReturn;
  error?: { message?: string };
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  stepNo?: number;
  onEnterPress?: () => void;
  type?: string;
  disabled?: boolean;
  focusOnMount?: boolean;
  rows?: number;
  noErrorIcon?: boolean;
}

// Interface for password input component props
export interface PasswordInputProps<T extends FieldValues> {
  id: Path<T>;
  placeholder?: string;
  className?: string;
  value?: string;
  register?: UseFormRegisterReturn;
  error?: { message?: string };
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onEnterPress?: () => void;
  showPasswordStrength?: boolean;
  password?: string;
}

// Interface for OTP input component props
export interface OtpInputProps<T extends FieldValues> {
  name: Path<T>;
  length?: number;
  register: UseFormRegister<T>;
  setValue: UseFormSetValue<T>;
  trigger: UseFormTrigger<T>;
  handleContinue?: () => void;
}

// Interface for sidebar link props
export interface SidebarLinkProps {
  name: string;
  url: string | string[];
  activeUrl?: string[];
  icon?: React.ReactNode;
  subItems?: SidebarLink[];
}

// Interface for sidebar link
export interface SidebarLink {
  name: string;
  key?: string;
  url: string | string[];
  activeUrl?: string[];
  icon?: React.ReactNode;
  subItems?: SidebarLink[];
}

// Interface for sidebar component props
export interface SidebarProps {
  isSidebarCollapsed: boolean;
  setShowUserProfile?: () => void;
  setIsSidebarCollapsed?: () => void;
  routeAction?: (e: string) => void;
  user?: LoggedUserProps | null;
  handlClick?: (url: string) => void;
}

// Interface for profile sidebar component props
export interface ProfileSidebarProps {
  isProfileSidebarCollapsed: boolean;
  setIsProfileSidebarCollapsed?: () => void;
}

// Interface for checkbox component props
export type CheckBoxbVariant = "primary" | "danger";
export type CheckBoxVisualState = "unchecked" | "checked" | "indeterminate";
export interface checkBoxProps {
  checked: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isDisable?: boolean;
  variant?: CheckBoxbVariant;
  visualState?: CheckBoxVisualState;
}

// Interface for checkbox component props
export type RadioBtnVariant = "primary" | "danger";
export type RadioBtnVisualState = "unchecked" | "checked";
export interface RadioBtnProps {
  checked: boolean | undefined;
  onChange: (value: unknown) => void;
  isDisable?: boolean;
  variant?: RadioBtnVariant;
  visualState?: RadioBtnVisualState;
}

// Interface for table component props
export interface TableProps<T> {
  isHeader?: boolean;
  roundedBorder?: boolean;
  tableHeading?: string;
  exportKey?: string;
  addBtnText?: string;
  uploadBtnText?: string;
  onActionBtClick?: () => void;
  onUploadBtnClick?: () => void;
  tableData: T[];
  columns: ColumnDef<T>[];
  tabNames?: string[];
  activeTab?: string;
  setActiveTab?: (tab: string | undefined) => void;
  tabSeparatorAt?: number;
  statusList?: string[];
  roleList?: string[];
  search?: string;
  setSearch?: (e: string) => void;
  clearSearch?: () => void;
  actions?: boolean;
  handleDelete?: (row: T) => void;
  isMembers?: boolean;
  noStatusFilter?: boolean;
  filterHeading?: string;
  hideExportIcon?: boolean;
  showSyncIcon?: boolean;
  flowImageSrc?: string;
  handleSync?: () => void;
  btnPopupItems?: string[];
  onBtnPopupItemsClick?: (value: string) => void;
  isBillEmailConfigured?: string | undefined;
  perPageItemCount?: number[];
  defaultSelectedStatusFilter?: string[];
  isLoading?: boolean;
}

// Interface for status filter component props
export interface StatusFilterProps<T extends Record<string, unknown>> {
  data: T[];
  selected: string[];
  onChange: (next: string[]) => void;
  statusKey: keyof T;
}

// Interface for select option
export interface Option {
  label?: string | number;
  value?: string | number;
}

// Interface for select component props
export interface SelectComponentProps<T extends FieldValues> {
  placeholder?: string;
  isDisabled?: boolean;
  options: Option[];
  name?: Path<T>; // Change this from keyof T to Path<T>
  register?: UseFormRegister<T>;
  error?: FieldError;
  getValues?: (name?: Path<T>) => string | undefined; // Change this to Path<T>
  trigger?: UseFormTrigger<T>;
  isMulti?: boolean;
  title?: string;
  value?: SingleValue<Option> | MultiValue<Option> | null;
  onChange?: (value: SingleValue<Option>) => void;
  isClearable?: boolean;
  noErrorIcon?: boolean;
}

// Interface for date component props
export interface DateComponentProps<T extends FieldValues> {
  placeholder?: string;
  getValues?: (name?: Path<T>) => string | undefined;
  name?: Path<T>;
  register?: UseFormRegister<T>;
  trigger?: UseFormTrigger<T>;
  error?: FieldError;
  title?: string;
  value?: Date;
  disabledBefore?: Date;
}

// Type for state option
export type StateOption = {
  id: string;
  label: string;
  value: string;
  countryId: string;
};

// Type for cities option
export type CitiesOption = {
  id: string;
  label: string;
  value: string;
  stateId: string;
};

// Type for file options
export type FileOptions = {
  fileName: string | undefined;
  removeFile: () => void;
};

// Interface for toggle switch component props
export interface ToggleSwitchProps {
  isOn: boolean;
  setIsOn: (value: boolean) => void;
  disabled?: boolean;
}

// Type for alphabet filter props
export type AlphabetFilterProps = {
  selectedLetter: string;
  onSelect: (letter: string) => void;
  onClear: () => void;
};

// Interface for tabs component props
export interface TabsProps {
  tabNames: string[] | undefined;
  activeTab: string | undefined;
  setActiveTab: (tab: string | undefined) => void;
  separatorAt?: number;
}

// Type for icon wrapper props
export type IconWrapperProps = {
  icon: React.ReactNode;
  onClick?: () => void;
  className?: string;
  isDisabled?: boolean;
};

// Interface for confirmation popup component props
export interface ConfirmationPopupProps {
  title?: string;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  message: string;
  saveButton?: React.ReactNode;
  buttonText?: string;
  isConfirmLoading?: boolean;
}

// Interface for billing address with id
export interface BillingAddressWithId extends billingAddress {
  id?: string;
}

// Interface for vendor data API type
export interface VenderDataAPIType {
  id?: string;
  billing_address: BillingAddressWithId;
  bank_account: bankDetailsTypes;
  vendor_name: string;
  company_name: string;
  email: string;
  mobile: string;
  tax_id: string;
  account_number?: string;
  payment_terms: string | null;
  website: string;
  is_active: boolean;
  updated_at?: string;
  created_at?: string;
}

// Interface for vendor table list
export interface VendorTableList {
  id: string;
  vendorName: string;
  companyName: string;
  email: string;
  taxId: string;
  status: string;
  website: string;
  mobile: string;
  accountNumber: string;
  paymentTerms: string;
  billingAddress: {
    id: string;
    line1: string;
    line2: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
}

// Type for user role
export type Role = "admin" | "member" | "finance_manager" | "lite_user";
// Type for resource
export type Resource =
  | "vendor"
  | "bill"
  | "members"
  | "general"
  | "purchaseorder"
  | "inbox";
// Type for action
export type Action = "view" | "create" | "update" | "delete";

// Interface for approval list API type
export interface ApprovalListAPIType {
  id: string;
  bill_number: string;
  bill_date: string;
  due_date: string;
  vendor_id?: string;
  vendor?: { id: string | number; name: string } | null;
  total?: number | string;
  is_attachment?: boolean;
  status: string;
}

// Interface for approval table list
export interface ApprovalTableList {
  id: string;
  bill: string;
  vendor?: { id: string | number; name: string } | null;
  status: string;
  bill_date?: string;
  due_date?: string;
  is_attachment?: boolean;
  total?: number | string;
}

// Interface for search input props
export interface SearchInputPropos {
  onlyIcon?: boolean;
  noCmdIcon?: boolean;
  placeholder?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  search?: string;
  clearSearch?: () => void;
}

// Type for breadcrumb
export type Crumb = {
  label: string;
  icon: React.ReactNode;
  href: string;
};

// Type for modal props
export type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  className?: string;
};

// Interface for PDF viewer props
export interface PdfViewerProps {
  fileUrl: string;
}

// Type for step in stepper
export type Step = {
  id: number;
  label?: string;
};

// Type for stepper props
export type StepperProps = {
  steps: Step[];
  activeStep: number;
};

//Type for sidepanel
export interface SidePanelProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}

// Types for audit history change value
type ChangeEntry = {
  field: string;
  old: string;
  new: string;
};

// Types for audit history items
export interface AuditHistoryItemsProps {
  history_id: number | null;
  changed_on: string;
  changed_by: string;
  event: string;
  is_current: boolean;
  status: string
}

export type AuditHistoryDataProps = {
  data: AuditHistoryItemsProps[];
  isLoading?: boolean;
  setAuditVersionDate: Dispatch<SetStateAction<string | null>>;
  handleClickAuditHistoryCard: (id: number) => void;
  currentVersion: number | null;
  setCurrentVersion: Dispatch<SetStateAction<number | null>>;
};

export type LoaderContextType = {
  show: boolean;
  setShow: (value: boolean) => void;
};

// Type for pill item component props
export interface PillItemProps {
  name?: string;
  className: string;
  icon?: "check" | "info" | "warning";
  isRounded?: boolean;
  onClick?: () => void;
}

// Type for Upload files modal props
export interface UploadFilesModalProps extends Omit<ModalProps, "children"> {
  onFileSelect?: (files: File[]) => void;
  maxFiles?: number;
  acceptedFormats?: string;
  document_type?: string;
}

//Interface for Dummy Dropdown button component props
export interface DropdownItemProps {
  icon: ReactNode;
  name: string;
}

//Interface for Dropdown button component props
export interface DropdownButtonProps {
  name: string;
  onActionBtClick?: () => void;
  onClose: () => void;
  onBtnPopupItemsClick?: (value: string) => void;
  onClickArrow: () => void;
  showBtnPopup: boolean;
  btnPopupItems: string[] | DropdownItemProps[];
  button_type: string;
}

//Interface for Dummy Dropdown button component props
export interface PopupButtonMenuProps {
  icon: ReactNode;
  name: string;
  isShown: boolean;
  onClick: () => void;
}

//Interface for Popup button component props
export interface PopupButtonProps {
  children: ReactNode;
  onClose: () => void;
  showBtnPopup: boolean;
  btnPopupItems: PopupButtonMenuProps[];
}

export interface ApprovalTypes {
  tabs: string[];
  activeTab: string | undefined;
  setActiveTab: (tab: string | undefined) => void;
}
