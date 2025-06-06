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
    "/vendor/list",
    "/bill/list",
    "/purchaseorder/list",
    "/settings/general",
    "/settings/controls",
    "/settings/approvals",
    "/settings/members",
  ],
  member: [
    "/home",
    "/vendor/list",
    "/bill/list",
    "/purchaseorder/list",
    "/settings/general",
    "/settings/controls",
    "/settings/members",
  ],
  finance_manager: [
    "/home",
    "/vendor/list",
    "/approvals/list/review",
    "/settings/general",
    "/settings/members",
  ],
};

// Tab options for approvals
export const approvalTabOptions = ["PO approval", "Bill approval"];

// Table headers for the bill match items
export const billMatchHeaders = [
  "Description",
  "Quantity",
  "Unit price",
  "Amount",
];

// Table headers for the PO match items
export const poMatchHeaders = [
  "#",
  "Description",
  "Quantity",
  "Unit price",
  "Amount",
];
