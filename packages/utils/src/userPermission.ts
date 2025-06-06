// To check role based authentication and access

import { roleBasedAccess } from "@rever/constants";
import { useUserStore } from "@rever/stores";
import { Action, Resource, Role, SidebarLinkProps } from "@rever/types";

// Filters sidebar links based on the user's role and allowed URLs
export function filterSidebarByRole(
  sidebarLinks: SidebarLinkProps[],
  role: Role | undefined,
): SidebarLinkProps[] {
  const allowedUrls = role ? roleBasedAccess[role] : [];

  if (!allowedUrls) return []; // If no allowed URLs, return empty array

  if (allowedUrls.includes("*")) return sidebarLinks; // If all URLs allowed, return all links

  // Filter sidebar links and their sub-items based on allowed URLs
  return sidebarLinks
    .map((item) => {
      if (item.subItems && item.subItems.length > 0) {
        // Filter sub-items if present
        const filteredSubItems = item.subItems.filter((sub) => {
          const subUrls = Array.isArray(sub.url) ? sub.url : [sub.url];
          return subUrls.some((u) => allowedUrls.includes(u));
        });

        if (filteredSubItems.length > 0) {
          return {
            ...item,
            subItems: filteredSubItems,
          };
        }

        return null; // Exclude item if no sub-items are allowed
      }

      const itemUrls = Array.isArray(item.url) ? item.url : [item.url];
      if (itemUrls.some((u) => allowedUrls.includes(u))) {
        return item; // Include item if its URL is allowed
      }

      return null; // Exclude item if not allowed
    })
    .filter(Boolean) as SidebarLinkProps[];
}

// Permissions mapping for each role and resource
export const userPermissions: Record<Role, Record<Resource, Action[]>> = {
  admin: {
    vendor: ["view", "create", "update", "delete"],
    bill: ["view", "create", "update", "delete"],
    purchaseorder: ["view", "create", "update", "delete"],
    members: ["view", "create", "update", "delete"],
    general: ["view", "create", "update", "delete"],
  },
  member: {
    vendor: ["view", "update", "create"],
    bill: ["view", "create", "update", "delete"],
    purchaseorder: ["view", "create", "update", "delete"],
    members: ["view"],
    general: ["view"],
  },
  finance_manager: {
    vendor: ["view"],
    bill: [],
    purchaseorder: [],
    members: ["view"],
    general: ["view"],
  },
};

// Type guard to check if a value is a valid Role
const isValidRole = (role: unknown): role is Role => {
  return (
    typeof role === "string" &&
    ["admin", "member", "finance_manager"].includes(role as Role)
  );
};

// Checks if the current user has permission for a specific resource and action
export const hasPermission = (
  resource: Resource | string,
  action: Action | string,
): boolean => {
  const role = useUserStore.getState()?.user?.role; // Get current user's role
  if (!isValidRole(role)) return false; // Return false if role is invalid

  const permissions = userPermissions[role];

  if (typeof resource === "string" && resource in permissions) {
    const allowedActions = permissions[resource as keyof typeof permissions];
    return allowedActions?.includes(action as Action) ?? false;
  }

  return false;
};
