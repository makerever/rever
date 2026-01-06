// Constant values

import { Role } from "@rever/types";

// Tab options for UI navigation or filtering
export const tabOptions = [
  "Overview",
  "Under review",
  "Under approval",
  "Approved",
];

// Tab options for UI navigation or filtering
export const memberTabOptions = ["Active members", "Invited members"];

// Role-based access control: defines accessible routes for each role
export const roleBasedAccess: Record<Role, string[]> = {
  admin: [
    "/home",
    "/inbox",
    "/vendor/list",
    "/bill/list",
    "/purchaseorder/list",
    "/settings/general",
    "/settings/controls",
    "/settings/approvals",
    "/settings/members",
    "/profile",
    "/preferences",
    "/security",
  ],
  member: [
    "/home",
    "/inbox",
    "/vendor/list",
    "/bill/list",
    "/purchaseorder/list",
    "/settings/general",
    "/settings/controls",
    "/settings/members",
    "/profile",
    "/preferences",
    "/security",
  ],
  finance_manager: [
    "/home",
    "/inbox",
    "/vendor/list",
    "/approvals/list/review",
    "/settings/general",
    "/settings/members",
    "/profile",
    "/preferences",
    "/security",
  ],
  lite_user: [
    "/inbox",
    "/request-receipt/list",
    "/profile",
    "/preferences",
    "/security",
  ],
};

// Tab options for approvals
export const approvalTabOptions = ["PO approval", "Bill approval"];

// Table headers for the bill match items
export const billMatchHeaders = ["Description", "Qty", "Unit price", "Amount"];

// Table headers for the PO match items
export const poMatchHeaders = [
  "#",
  "Description",
  "Available Qty",
  "Unit price",
  "Amount",
];

// Tab options for receipt confirmation
export const tabOptionsReceiptConfirm = ["Open", "Closed", "Revoked"];

export type TaskStatus = "active" | "completed" | "revoked";

export const requestReceiptListStatus: Record<TaskStatus, string> = {
  active: "requested",
  completed: "confirmed",
  revoked: "revoked",
};
