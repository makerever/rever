// TS common inteface objects

import { ColumnDef } from "@tanstack/react-table";
import { ReactNode } from "react";
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
import { billingAddress } from "../apiTypes/type";
import { LoggedUserProps } from "../store/type";

// Interface for button component props
export interface ButtonProps {
  text: string;
  onClick?: () => void;
  className?: string;
  icon?: ReactNode;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  isLoading?: boolean;
  width?: string;
  isDefault?: boolean;
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
  setIsSidebarCollapsed?: () => void;
  routeAction?: (e: string) => void;
  user?: LoggedUserProps | null;
}

// Interface for profile sidebar component props
export interface ProfileSidebarProps {
  isProfileSidebarCollapsed: boolean;
  setIsProfileSidebarCollapsed?: () => void;
}

// Interface for checkbox component props
export interface checkBoxProps {
  checked: boolean;
  onChange: (value: unknown) => void;
}

// Interface for table component props
export interface TableProps<T> {
  tableHeading?: string;
  addBtnText?: string;
  onActionBtClick?: () => void;
  tableData: T[];
  columns: ColumnDef<T>[];
  tabNames?: string[];
  activeTab?: string;
  setActiveTab?: (tab: string | undefined) => void;
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
  noLine?: boolean;
  tabStyleBox?: boolean;
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
}

// Interface for billing address with id
export interface BillingAddressWithId extends billingAddress {
  id?: string;
}

// Interface for vendor data API type
export interface VenderDataAPIType {
  id?: string;
  billing_address: BillingAddressWithId;
  vendor_name: string;
  company_name: string;
  email: string;
  mobile: string;
  tax_id: string;
  account_number?: string;
  payment_terms: string | null;
  website: string;
  is_active: boolean;
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
export type Role = "admin" | "member" | "finance_manager";
// Type for resource
export type Resource = "vendor" | "bill" | "members" | "general";
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
  status: string;
}

// Interface for approval table list
export interface ApprovalTableList {
  id: string;
  bill: string;
  vendor?: { id: string | number; name: string } | null;
  status: string;
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
