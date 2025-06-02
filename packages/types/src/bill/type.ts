// Interface types for bills

import { addBillSchemaValues } from "@rever/validations";
import {
  Control,
  UseFormGetValues,
  UseFormRegister,
  UseFormSetValue,
} from "react-hook-form";
import { AddressTypeProps } from "../vendor/type";

export type BillLineItemsProps = {
  billItems?: BillItemTypeProps[];
  billDetails?: Partial<Bill>;
};

// Interface representing the structure of a Bill object
export interface Bill {
  id?: number;
  bill_number?: string | undefined;
  billing_address?: AddressTypeProps | undefined;
  bill?: string | undefined;
  vendor_id?: string;
  vendor?: { id: string | number; name: string } | null;
  payment_terms?: string | undefined;
  bill_date?: string | undefined | null;
  due_date?: string | undefined | null;
  sub_total?: string | number;
  total_tax?: string | number;
  tax_percentage?: string | number;
  total?: number | string;
  status: string;
  items?: BillItemTypeProps[];
}

export type BillItemTypeProps = {
  description?: string | undefined;
  product_code?: string | undefined;
  quantity?: string | undefined;
  unit_price?: string | undefined;
  amount?: string | undefined;
};

// Interface for props used in the Bill Line Items Table component
export interface BillLineItemsTableProps {
  control: Control<addBillSchemaValues>;
  register: UseFormRegister<addBillSchemaValues>;
  setValue: UseFormSetValue<addBillSchemaValues>;
  getValues: UseFormGetValues<addBillSchemaValues>;
  showItemsDescription?: boolean;
}

// Interface for the API response containing an array of Bill objects
export interface BillApiResponse {
  results: Bill[];
}

// Interface for props used in the View Bill Details component
export interface ViewBillDetailsProps {
  billDetails: Partial<Bill>;
  billing_address?: AddressTypeProps;
  deleteBill: () => void;
  fileUrl: string;
  showPdf: boolean;
  setShowPdf: (val: boolean) => void;
  isLoaderFormSubmit: boolean;
  handleRejectBill?: () => void;
  handleApproveBill?: () => void;
  isApproverAvailable?: boolean;
  handleSendBillApproval?: () => void;
  isUserApproval?: boolean;
  handleApprovalAction?: () => void;
  handleRejectionAction?: () => void;
}

// Interface for attachment properties
export interface AttachmentProps {
  file?: string;
  id?: string;
}
