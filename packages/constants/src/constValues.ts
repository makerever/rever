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
    "/settings/general",
    "/settings/approvals",
    "/settings/members",
  ],
  member: [
    "/home",
    "/vendor/list",
    "/bill/list",
    "/settings/general",
    "/settings/members",
  ],
  finance_manager: [
    "/home",
    "/vendor/list",
    "/bill/approvals/list",
    "/settings/general",
    "/settings/members",
  ],
};
