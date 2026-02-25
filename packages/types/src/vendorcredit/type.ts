import { addCreditNoteSchemaValues } from "@rever/validations";
import {
  Control,
  UseFormGetValues,
  UseFormRegister,
  UseFormSetValue,
  UseFormTrigger,
} from "react-hook-form";
import {
  AddressTypeProps,
  AuditValidationAddressTypeProps,
} from "../vendor/type";

// Interface representing the structure of a vendor credit object
export interface VendorCreditProps {
  id?: string;
  credit_note_number?: string | undefined;
  txn_date?: Date | string | null;
  vendor?: { id: string; name: string } | null;
  total?: number | string;
  status: string;
  created_at?: string;
  vendor_id?: string;
  purchase_order_id?: string;
  purchase_order?: { id: string | number; po_number: string } | null;
  billing_address?: AddressTypeProps | undefined;
  notes?: string;
  sub_total?: string | number;
  total_tax?: string | number;
  tax_percentage?: string | number;
  is_attachment?: boolean;
  items?: VendorCreditLineItemsProps[];
  reject_reason?: string;
}

export interface VendorCreditAuditValidationType {
  id?: boolean;
  credit_note_number?: boolean;
  txn_date?: boolean;
  vendor?: { id: boolean; name: boolean };
  total?: boolean;
  status: boolean;
  created_at?: boolean;
  vendor_id?: boolean;
  purchase_order_id?: boolean;
  purchase_order?: { id: boolean; po_number: boolean };
  billing_address?: AuditValidationAddressTypeProps | boolean;
  notes?: boolean;
  sub_total?: boolean;
  total_tax?: boolean;
  tax_percentage?: boolean;
  is_attachment?: boolean;
  items?: VendorCreditItemsAuditValidationType[];
  reject_reason?: boolean;
}

export interface VendorCreditItemsAuditValidationType {
  id?: boolean;
  description?: boolean;
  account?: {
    id: boolean;
    name: boolean;
  };
  item?: {
    id: boolean;
    name: boolean;
  };
  quantity?: boolean;
  unit_price?: boolean;
  amount?: boolean;
}

// Interface for the API response containing an array of vendor credit objects
export interface CreditNoteApiResponse {
  results: VendorCreditProps[];
}

// Interface for props used in the vendor credit Line Items Table component
export interface VendorCreditLineItemsTableProps {
  control: Control<addCreditNoteSchemaValues>;
  register: UseFormRegister<addCreditNoteSchemaValues>;
  trigger?: UseFormTrigger<addCreditNoteSchemaValues>;
  setValue: UseFormSetValue<addCreditNoteSchemaValues>;
  getValues: UseFormGetValues<addCreditNoteSchemaValues>;
  showItemsDescription?: boolean;
  submitType?: string;
}

// For approving or rejecting a vendor credit
export interface ApproveRejectVendorCreditProps {
  action: string;
  comment?: string;
}

// Vendor Credit Line Items object
export type VendorCreditLineItemsDetailsProps = {
  vendorCreditItems?: VendorCreditLineItemsProps[];
  vendorCreditDetails?: Partial<VendorCreditProps>;
  showAuditHistory: boolean;
  itemsAuditValidation?: VendorCreditItemsAuditValidationType[] | boolean[];
};

// Vendor Credit Line Item object
export type VendorCreditLineItemsProps = {
  id?: string;
  description?: string | undefined;
  quantity?: string | undefined;
  unit_price?: string | undefined;
  amount?: string | undefined;
};

// Props for viewing vendor credit details
export interface ViewVendorCreditDetailsProps {
  vendorCreditDetails: Partial<VendorCreditProps>;
  billing_address?: AddressTypeProps;
  deleteVendorCredit: () => void;
  fileUrl: string;
  showPdf: boolean;
  setShowPdf: (val: boolean) => void;
  isLoaderFormSubmit: boolean;
  handleRejectVendorCredit?: () => void;
  handleApproveVendorCredit?: () => void;
  isApproverAvailable?: boolean;
  handleSendVendorCreditApproval?: () => void;
  isUserApproval?: boolean;
  handleApprovalAction?: () => void;
  handleRejectionAction?: () => void;
}
