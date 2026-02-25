// Component to show breadcrumb

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Users,
  ReceiptText,
  UsersRound,
  UserRoundCheck,
  FileCheck2,
  Inbox,
  Settings,
  LayoutDashboard,
  NotepadText,
} from "lucide-react";
import { useBreadcrumbStore } from "@rever/stores";

type Crumb = {
  label: string | ((data: any) => string);
  href: string | ((data: any) => string);
  icon?: React.ReactNode;
};

const breadcrumbMap: Record<string, Crumb[]> = {
  "/home": [
    { label: "Dashboard", icon: <LayoutDashboard size={16} />, href: "/" },
  ],
  "/vendor/list": [{ label: "Vendors", icon: <Users size={16} />, href: "" }],
  "/vendor/view": [
    { label: "Vendors", icon: <Users size={16} />, href: "/vendor/list" },
    {
      label: (data) => data?.name || "",
      href: "",
    },
  ],
  "/vendor/add": [
    { label: "Vendors", icon: <ReceiptText size={16} />, href: "/vendor/list" },
    { label: "Create vendor", icon: "", href: "" },
  ],
  "/vendor/update": [
    { label: "Vendors", icon: <Users size={16} />, href: "/vendor/list" },
    {
      label: (data) => data?.name || "--",
      href: (data) => `/vendor/view?id=${data?.id}`,
    },
    { label: "Update", href: "" },
  ],

  "/bill/list": [{ label: "Bills", icon: <ReceiptText size={16} />, href: "" }],
  "/bill/add": [
    { label: "Bills", icon: <ReceiptText size={16} />, href: "/bill/list" },
    { label: "Create bill", icon: "", href: "" },
  ],
  "/bill/view": [
    { label: "Bills", icon: <ReceiptText size={16} />, href: "/bill/list" },
    {
      label: (data) => data?.name || "",
      href: "",
    },
  ],
  "/bill/edit": [
    { label: "Bills", icon: <Users size={16} />, href: "/bill/list" },
    {
      label: (data) => data?.name || "--",
      href: (data) => `/bill/view?id=${data?.id}`,
    },
    { label: "Update", href: "" },
  ],
  "/bill/match": [
    { label: "Bills", icon: <ReceiptText size={16} />, href: "/bill/list" },
    {
      label: (data) => data?.name || "",
      href: (data) => `/bill/view?id=${data?.id}`,
    },
    { label: "View match", href: "" },
  ],
  "/vendorcredit/list": [
    { label: "Vendor credits", icon: <NotepadText size={16} />, href: "" },
  ],
  "/vendorcredit/add": [
    {
      label: "Vendor credits",
      icon: <NotepadText size={16} />,
      href: "/vendorcredit/list",
    },
    { label: "Create vendor credit", icon: "", href: "" },
  ],
  "/vendorcredit/view": [
    {
      label: "Vendor credits",
      icon: <NotepadText size={16} />,
      href: "/vendorcredit/list",
    },
    {
      label: (data) => data?.name || "",
      href: "",
    },
  ],
  "/vendorcredit/edit": [
    {
      label: "Vendor credits",
      icon: <NotepadText size={16} />,
      href: "/vendorcredit/list",
    },
    {
      label: (data) => data?.name || "--",
      href: (data) => `/vendorcredit/view?id=${data?.id}`,
    },
    { label: "Update", href: "" },
  ],
  "/request-receipt/list": [
    { label: "Confirmations", icon: <ReceiptText size={16} />, href: "" },
  ],
  "/request-receipt/view": [
    {
      label: "Confirmations",
      icon: <ReceiptText size={16} />,
      href: "/request-receipt/list",
    },
    {
      label: (data) => data?.name || "",
      href: "",
    },
  ],
  "/approvals/list/review": [
    { label: "Approvals", icon: <FileCheck2 size={16} />, href: "" },
  ],
  "/approvals/list/review/match": [
    {
      label: "Approvals",
      icon: <FileCheck2 size={16} />,
      href: "/approvals/list/review",
    },
    {
      label: (data) => data?.name || "",
      href: (data) => `/bill/${data?.id}/review`,
    },
    { label: "View match", href: "" },
  ],
  "/purchaseorder/list": [
    { label: "Purchase orders", icon: <ReceiptText size={16} />, href: "" },
  ],
  "/purchaseorder/add": [
    {
      label: "Purchase orders",
      icon: <ReceiptText size={16} />,
      href: "/purchaseorder/list",
    },
    { label: "Create PO", icon: "", href: "" },
  ],
  "/purchaseorder/view": [
    {
      label: "Purchase orders",
      icon: <ReceiptText size={16} />,
      href: "/purchaseorder/list",
    },
    {
      label: (data) => data?.name || "",
      href: "",
    },
  ],
  "/purchaseorder/edit": [
    {
      label: "Purchase orders",
      icon: <Users size={16} />,
      href: "/purchaseorder/list",
    },
    {
      label: (data) => data?.name || "--",
      href: (data) => `/purchaseorder/view?id=${data?.id}`,
    },
    { label: "Update", href: "" },
  ],
  "/inbox": [{ label: "Inbox", icon: <Inbox size={16} />, href: "/" }],
  "/profile": [
    // { label: "Settings", icon: <Settings size={16} />, href: undefined },
    { label: "Profile", href: "/" },
  ],
  "/security": [
    // { label: "Settings", icon: <Settings size={16} />, href: undefined },
    { label: "Security", href: "/" },
  ],
  "/preferences": [
    // { label: "Settings", icon: <Settings size={16} />, href: undefined },
    { label: "Preferences", href: "/" },
  ],
  "/settings/general": [
    { label: "General settings", icon: <Settings size={16} />, href: "/" },
  ],
  "/settings/controls": [
    { label: "Controls", icon: <Settings size={16} />, href: "/" },
  ],
  "/settings/members": [
    { label: "Members", icon: <UsersRound size={16} />, href: "/" },
  ],
  "/settings/approvals": [
    { label: "Approvals", icon: <UserRoundCheck size={16} />, href: "/" },
  ],
  "/settings/members/invite": [
    {
      label: "Members",
      icon: <UsersRound size={16} />,
      href: "/settings/members",
    },
    { label: "Invite member", icon: "", href: "" },
  ],
};

export default function Breadcrumb() {
  const pathname = usePathname();
  const breadcrumb = breadcrumbMap[pathname] || [];
  const dynamicData = useBreadcrumbStore((s) => s.dynamicCrumb[pathname]);

  return (
    <nav className="flex items-center">
      {breadcrumb.map((crumb, index) => {
        const isLast = index === breadcrumb.length - 1;
        const label =
          typeof crumb.label === "function"
            ? crumb.label(dynamicData)
            : crumb.label;
        const href =
          typeof crumb.href === "function"
            ? crumb.href(dynamicData)
            : crumb.href;

        return (
          <span key={index} className="flex items-center text-xs">
            {index !== 0 && <span className="text-neutral-200 px-3">/</span>}
            {isLast ? (
              <span className="breadcrumb">
                {crumb.icon}
                {label}
              </span>
            ) : href ? (
              <Link href={href} className="breadcrumb breadcrumb-hover">
                {crumb.icon}
                {label}
              </Link>
            ) : (
              <div className="breadcrumb breadcrumb-hover">
                {crumb.icon}
                {label}
              </div>
            )}
          </span>
        );
      })}
    </nav>
  );
}
