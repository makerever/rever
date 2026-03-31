// Constant url's for sidebar links

import { SidebarLinkProps } from "@rever/types";
import {
  Building,
  CirclePlus,
  FileText,
  Inbox,
  Key,
  LayoutDashboard,
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
    name: "Dashboard", // Home page link
    i18nKey: "sidebar.home",
    url: "/home",
    activeUrl: ["/home"],
    icon: <LayoutDashboard size={16} />,
  },

  {
    name: "Expenses", // Expenses section with sub-items
    i18nKey: "sidebar.expenses.expenses",
    url: "#",
    icon: <FileText size={16} />,
    subItems: [
      {
        name: "Bills", // Bill management routes
        i18nKey: "sidebar.expenses.bills",
        url: [
          "/bill/list",
          "/bill/add",
          "/bill/view",
          "/bill/edit",
          "/bill/match",
        ],
      },
      {
        name: "Purchase orders", // Purchase Order management routes
        i18nKey: "sidebar.expenses.purchase_order",
        url: [
          "/purchaseorder/list",
          "/purchaseorder/add",
          "/purchaseorder/view",
          "/purchaseorder/edit",
        ],
      },
      {
        name: "Vendors", // Vendor management routes
        i18nKey: "sidebar.expenses.vendors",
        url: ["/vendor/list", "/vendor/add", "/vendor/view", "/vendor/update"],
      },
      {
        name: "Vendor credits", // Vendor management routes
        i18nKey: "sidebar.expenses.vendor_credits",
        url: [
          "/vendorcredit/list",
          "/vendorcredit/add",
          "/vendorcredit/view",
          "/vendorcredit/edit",
        ],
      },
      {
        name: "Approvals", // Approval process routes
        i18nKey: "sidebar.expenses.approvals",
        key: "review",
        url: ["/approvals/list/review", "/bill"],
      },
      {
        name: "Confirmations", // Request receipt routes
        i18nKey: "sidebar.expenses.confirmations",
        url: [
          "/request-receipt/list",
          "/request-receipt/view",
          "/request-receipt/",
        ],
      },
    ],
  },
  {
    name: "Inbox", // Inbox page link
    i18nKey: "sidebar.inbox",
    url: "/inbox",
    activeUrl: ["/inbox"],
    icon: <Inbox size={16} />,
  },
];

// Sidebar links for user profile section
export const profileSidebarLinks: SidebarLinkProps[] = [
  {
    name: "PERSONAL SETTINGS",
    i18nKey: "profile_sidebar.personal_settings",
    url: "#",
    icon: <User size={16} />,
    subItems: [
      {
        name: "Profile", // User profile page
        i18nKey: "profile_sidebar.profile",
        url: "/profile",
        activeUrl: ["/profile"],
        // icon: <CircleUserRound size={16} />,
      },
      {
        name: "Security", // Security settings
        i18nKey: "profile_sidebar.security",
        url: "/security",
        activeUrl: ["/security"],
        // icon: <KeyRound size={16} />,
      },
      {
        name: "Preferences", // Notification settings
        i18nKey: "profile_sidebar.preferences",
        url: "/preferences",
        activeUrl: ["/preferences"],
        // icon: <Bell size={16} />,
      },
    ],
  },
  {
    name: "ORGANIZATION SETTINGS", // Settings section with sub-items
    i18nKey: "profile_sidebar.organization_settings",
    url: "#",
    icon: <Building size={16} />,
    subItems: [
      {
        name: "General", // General settings
        i18nKey: "sidebar.settings.general",
        url: ["/settings/general"],
      },
      {
        name: "Controls", // General settings
        i18nKey: "sidebar.settings.controls",
        url: ["/settings/controls"],
      },
      {
        name: "Members", // Member management
        i18nKey: "sidebar.settings.members",
        url: ["/settings/members", "/settings/members/invite"],
      },
      {
        name: "Approvals", // Approval settings
        i18nKey: "sidebar.settings.approvals",
        url: ["/settings/approvals"],
      },
    ],
  },
  // {
  //   name: "Appereance", // Appearance/theme settings
  //   url: "/appearance",
  //   activeUrl: ["/appearance"],
  //   icon: <SunMoon size={16} />,
  // },
];

// All route paths related to expenses for sidebar highlighting
export const payablePathNameUrl = [
  "vendor",
  "purchaseorder",
  "bill",
  "approvals",
  "request-receipt",
  "vendorcredit",
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
    i18nKey: "global_search.vendors",
    icon: <Users width={16} />,
    url: "/vendor/list",
    f_name: "vendor",
    a_name: "view",
  },
  {
    name: "PO's",
    i18nKey: "global_search.po",
    icon: <ReceiptText width={16} />,
    url: "/purchaseorder/list",
    f_name: "purchaseorder",
    a_name: "view",
  },
  {
    name: "Bills",
    i18nKey: "global_search.bills",
    icon: <ReceiptText width={16} />,
    url: "/bill/list",
    f_name: "bill",
    a_name: "view",
  },
  {
    name: "Members",
    i18nKey: "global_search.members",
    icon: <UsersRound width={16} />,
    url: "/settings/members",
    f_name: "members",
    a_name: "view",
  },
  {
    name: "Create vendor",
    i18nKey: "global_search.create_vendor",
    icon: <CirclePlus width={16} />,
    url: "/vendor/add",
    f_name: "vendor",
    a_name: "create",
  },
  {
    name: "Create PO",
    i18nKey: "global_search.create_po",
    icon: <CirclePlus width={16} />,
    url: "/purchaseorder/add",
    f_name: "purchaseorder",
    a_name: "create",
  },
  {
    name: "Create bill",
    i18nKey: "global_search.create_bill",
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
    i18nKey: "global_search.profile",
    icon: <User width={16} />,
    url: "/profile",
  },
  {
    name: "Change password",
    i18nKey: "global_search.change_password",
    icon: <Key width={16} />,
    url: "/security",
  },
];
