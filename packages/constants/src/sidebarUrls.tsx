// Constant url's for sidebar links

import { SidebarLinkProps } from "@rever/types";
import {
  Bell,
  CirclePlus,
  CircleUserRound,
  FileText,
  Home,
  Key,
  KeyRound,
  ReceiptText,
  Settings2,
  // SunMoon,
  User,
  Users,
  UsersRound,
} from "lucide-react";

// Sidebar links for main navigation
export const sidebarLinks: SidebarLinkProps[] = [
  {
    name: "Home", // Home page link
    url: "/home",
    activeUrl: ["/home"],
    icon: <Home size={16} />,
  },

  {
    name: "Payables", // Payables section with sub-items
    url: "#",
    icon: <FileText size={16} />,
    subItems: [
      {
        name: "Vendors", // Vendor management routes
        url: ["/vendor/list", "/vendor/add", "/vendor/view", "/vendor/update"],
      },
      {
        name: "Purchase orders", // Purchase Order management routes
        url: [
          "/purchaseorder/list",
          "/purchaseorder/add",
          "/purchaseorder/view",
          "/purchaseorder/edit",
        ],
      },
      {
        name: "Bills", // Bill management routes
        url: [
          "/bill/list",
          "/bill/add",
          "/bill/view",
          "/bill/edit",
          "/bill/match",
        ],
      },
      {
        name: "Approvals", // Approval process routes
        key: "review",
        url: ["/approvals/list/review", "/bill"],
      },
    ],
  },

  {
    name: "Settings", // Settings section with sub-items
    url: "#",
    icon: <Settings2 size={16} />,
    subItems: [
      {
        name: "General", // General settings
        url: ["/settings/general"],
      },
      {
        name: "Controls", // General settings
        url: ["/settings/controls"],
      },
      {
        name: "Members", // Member management
        url: ["/settings/members", "/settings/members/invite"],
      },
      {
        name: "Approvals", // Approval settings
        url: ["/settings/approvals"],
      },
    ],
  },
];

// Sidebar links for user profile section
export const profileSidebarLinks: SidebarLinkProps[] = [
  {
    name: "Profile", // User profile page
    url: "/profile",
    activeUrl: ["/profile"],
    icon: <CircleUserRound size={16} />,
  },
  {
    name: "Security", // Security settings
    url: "/security",
    activeUrl: ["/security"],
    icon: <KeyRound size={16} />,
  },
  {
    name: "Notification", // Notification settings
    url: "/notification",
    activeUrl: ["/notification"],
    icon: <Bell size={16} />,
  },
  // {
  //   name: "Appereance", // Appearance/theme settings
  //   url: "/appearance",
  //   activeUrl: ["/appearance"],
  //   icon: <SunMoon size={16} />,
  // },
];

// All route paths related to payables for sidebar highlighting
export const payablePathNameUrl = [
  "vendor",
  "purchaseorder",
  "bill",
  "approvals",
];

// All route paths related to settings for sidebar highlighting
export const settingPathNameUrl = [
  "/settings/general",
  "/settings/controls",
  "/settings/members",
  "/settings/members/invite",
  "/settings/approvals",
];

// Routes available in global search (main app)
export const globalSearchRoutes = [
  {
    name: "Vendors",
    icon: <Users width={16} />,
    url: "/vendor/list",
    f_name: "vendor",
    a_name: "view",
  },
  {
    name: "PO's",
    icon: <ReceiptText width={16} />,
    url: "/purchaseorder/list",
    f_name: "purchaseorder",
    a_name: "view",
  },
  {
    name: "Bills",
    icon: <ReceiptText width={16} />,
    url: "/bill/list",
    f_name: "bill",
    a_name: "view",
  },
  {
    name: "Members",
    icon: <UsersRound width={16} />,
    url: "/settings/members",
    f_name: "members",
    a_name: "view",
  },
  {
    name: "Create vendor",
    icon: <CirclePlus width={16} />,
    url: "/vendor/add",
    f_name: "vendor",
    a_name: "create",
  },
  {
    name: "Create PO",
    icon: <CirclePlus width={16} />,
    url: "/purchaseorder/add",
    f_name: "purchaseorder",
    a_name: "create",
  },
  {
    name: "Create bill",
    icon: <CirclePlus width={16} />,
    url: "/bill/add",
    f_name: "bill",
    a_name: "create",
  },
];

// Routes available in global search (settings/profile)
export const globalSearchRoutesSetting = [
  {
    name: "Profile",
    icon: <User width={16} />,
    url: "/profile",
  },
  {
    name: "Change password",
    icon: <Key width={16} />,
    url: "/security",
  },
];
