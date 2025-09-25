import { Bill } from "./../bill/type";

// Interface representing the structure of a confirm receipt object
export interface ReqReceipt {
  task_id?: string;
  bill_id?: string;
  bill_number?: string | undefined;
  due_date?: string | undefined | null;
  assigned_at: string;
  completed_at?: string;
  requested_by_name: string;
  vendor_name?: string;
  comments?: string;
  bill_date?: string | undefined | null;
  status: string;
  task_status: string;
}

export type ReceiptConfirmPopupProps = {
  handleReqConfirmation: () => void;
  handleVersionHistory: () => void;
  reqConfirmStatus: string;
  confirmHistoryAvailable: boolean;
};

export type RequestConfirmModalProps = {
  onClose: () => void;
  billDetails: Partial<Bill>;
  reqConfirmed: () => void;
};

export type RequestedConfirationProps = {
  confirmationHistoryList: confirmationHistory[];
};

export interface confirmationHistory {
  task_id?: string;
  status?: string;
  assigned_at?: string; // ISO timestamp
  revoked_at?: string | null;
  revoked_by_id?: string | null;
  revoked_by_name?: string | null;
  completed_at?: string | null;
  last_reminded_at?: string | null;
  remind_count?: number;
  assignee_id?: string;
  assignee_name?: string;
  assignee_email?: string;
}
