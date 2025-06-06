import { AddressTypeProps } from "../vendor/type";
import {
  Control,
  UseFormGetValues,
  UseFormRegister,
  UseFormSetValue,
} from "react-hook-form";
import { addPurchaseOrderSchemaValues } from "@rever/validations";

export type POLineItemsProps = {
  poItems?: poItemTypeProps[];
  poDetails?: Partial<PurchaseOrder>;
};

export type POAPIResponse = {
  results: PurchaseOrder[];
};

export type poItemTypeProps = {
  description?: string | undefined;
  product_code?: string | undefined;
  quantity?: string | undefined;
  unit_price?: string | undefined;
  amount?: string | undefined;
};

// Interface representing the structure of a PO object
export interface PurchaseOrder {
  id?: string | number;
  po_number?: string | undefined;
  po_address?: AddressTypeProps | undefined;
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
