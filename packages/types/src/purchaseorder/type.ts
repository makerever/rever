import { AddressTypeProps, AuditValidationAddressTypeProps } from "../vendor/type";
import {
  Control,
  UseFormGetValues,
  UseFormRegister,
  UseFormSetValue,
} from "react-hook-form";
import { addPurchaseOrderSchemaValues } from "@rever/validations";

export type POLineItemsProps = {
  showAuditHistory: boolean;
  poItems?: poItemTypeProps[];
  poDetails?: Partial<PurchaseOrder>;
  itemsAuditValidation?: PoItemsAuditValidationType[] | boolean[];
  auditValidation: PoAuditValidationType | null;
};

export type POAPIResponse = {
  results: PurchaseOrder[];
};

export type poItemTypeProps = {
  description?: string | undefined;
  product_code?: string | undefined;
  quantity?: string | undefined;
  received_quantity?: string | undefined;
  pending_approval_quantity?: string | undefined;
  unit_price?: string | undefined;
  amount?: string | undefined;
};

// Interface representing the structure of a PO object
export interface PurchaseOrder {
  id?: number;
  po_number?: string | undefined;
  billing_address?: AddressTypeProps | undefined;
  po?: string | undefined;
  vendor_id?: string;
  vendor?: { id: string | number; name: string } | null;
  payment_terms?: string | undefined | null;
  po_date?: string | undefined | null;
  delivery_date?: string | undefined | null;
  sub_total?: string | number;
  total_tax?: string | number;
  tax_percentage?: string | number;
  total?: number | string;
  status: string;
  items?: poItemTypeProps[];
  comments?: string;
  updated_at?: string;
  created_at?: string;
  is_attachment?: boolean;
  reject_reason?: string;
}

export interface PoAuditValidationType {
  id?: boolean;
  po_number?: boolean;
  billing_address?: AuditValidationAddressTypeProps | boolean;
  po?: boolean;
  vendor_id?: boolean;
  vendor?: { id: boolean; name: boolean } | boolean;
  payment_terms?: boolean;
  po_date?: boolean;
  delivery_date?: boolean;
  sub_total?: boolean;
  total_tax?: boolean;
  tax_percentage?: boolean;
  total?: boolean;
  status: boolean;
  comments?: boolean;
  updated_at?: boolean;
  created_at?: boolean;
  is_attachment?: boolean;
  items?: PoItemsAuditValidationType[];
  reject_reason?: boolean;
}

export interface PoItemsAuditValidationType {
  description?: boolean;
  chart_of_account?: { id: boolean, name: boolean };
  product_code?: boolean;
  quantity?: boolean;
  received_quantity?: boolean;
  pending_approval_quantity?: boolean;
  unit_price?: boolean;
  amount?: boolean;
}

// Interface for props used in the View PO Details component
export interface ViewPODetailsProps {
  poDetails: Partial<PurchaseOrder>;
  po_address?: AddressTypeProps;
  deletePO: () => void;
  fileUrl?: string;
  showPdf: boolean;
  setShowPdf: (val: boolean) => void;
  isLoaderFormSubmit: boolean;
  handleRejectPO?: () => void;
  handleApprovePO?: () => void;
  isApproverAvailable?: boolean;
  handleSendPOApproval?: () => void;
  isUserApproval?: boolean;
  handleApprovalAction?: () => void;
  handleRejectionAction?: () => void;
}

// Interface for props used in the PO Line Items Table component
export interface poLineItemsTableProps {
  control: Control<addPurchaseOrderSchemaValues>;
  register: UseFormRegister<addPurchaseOrderSchemaValues>;
  setValue: UseFormSetValue<addPurchaseOrderSchemaValues>;
  getValues: UseFormGetValues<addPurchaseOrderSchemaValues>;
  showItemsDescription?: boolean;
}
