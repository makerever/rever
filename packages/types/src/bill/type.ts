// Interface types for bills

import { addBillSchemaValues } from "@rever/validations";
import {
  Control,
  UseFormGetValues,
  UseFormRegister,
  UseFormSetValue,
} from "react-hook-form";
import { AddressTypeProps } from "../vendor/type";
import { OrgDataProps } from "../apiTypes/type";

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
  purchase_order_id?: string;
  purchase_order?: { id: string | number; po_number: string } | null;
  comments?: string;
  payment_terms?: string | undefined | null;
  bill_date?: string | undefined | null;
  due_date?: string | undefined | null;
  sub_total?: string | number;
  total_tax?: string | number;
  tax_percentage?: string | number;
  total?: number | string;
  is_attachment?: boolean;
  updated_at?: string;
  status: string;
  receipt_status?: string;
  receipt_comment?: string;
  items?: BillItemTypeProps[];
  created_at?: string;
  is_duplicate?: boolean;
}

export type BillItemTypeProps = {
  id?: string;
  description?: string | undefined;
  product_code?: string | undefined;
  quantity?: string | undefined;
  confirmed_quantity?: string | undefined;
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
  file_name?: string;
}

// Types for matching b/w PO and bill
export interface PurchaseOrderItem {
  quantity: string | number;
  received_quantity?: string | number;
  pending_approval_quantity?: string | number;
  unit_price: string | number;
  description: string;
  id?: string;
  line_number?: number;
}

export interface BillItem {
  quantity: string | number;
  unit_price: string | number;
  description: string;
  confirmed_quantity: string | number;
  bill?: string;
  id?: string;
  line_number: number;
  extra_bill_item?: boolean;
}

export interface MatchedLineItem {
  purchase_order_item: PurchaseOrderItem;
  bill_item?: BillItem;
  description_score?: number;
  description_status?: string;
  quantity_status?: boolean;
  unit_price_status?: boolean;
  overall_status?: "matched" | "mismatched" | "partial";
}

export interface UnmatchedLineItem {
  purchase_order_item: PurchaseOrderItem;
}

export interface OrgDetails {
  currency?: string;
}

export type BillItemsTableProps = {
  matchedLineItems: MatchedLineItem[];
  orgDetails?: OrgDataProps;
  billDetails: Partial<Bill>;
  triggerGetMatchResults: () => void;
};

export type MatchStatus =
  | "Matched"
  | "Mismatched"
  | "Partial matched"
  | "poNotAvailable"
  | "none";
export type TooltipSide = "right" | "top" | "bottom" | "left";
