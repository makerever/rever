// Component to show breadcrumb

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Users,
  Settings2,
  ReceiptText,
  UsersRound,
  UserRoundCheck,
  FileCheck2,
} from "lucide-react";
import { useBreadcrumbStore } from "@rever/stores";

type Crumb = {
  label: string | ((data: any) => string);
  href: string | ((data: any) => string);
  icon?: React.ReactNode;
};

const breadcrumbMap: Record<string, Crumb[]> = {
  "/home": [{ label: "Home", icon: <Home size={16} />, href: "/" }],

  "/vendor/list": [{ label: "Vendors", icon: <Users size={16} />, href: "" }],
  "/vendor/add": [
    { label: "Vendors", icon: <Users size={16} />, href: "/vendor/list" },
    { label: "Create vendor", icon: "", href: "" },
  ],
  "/vendor/view": [
    { label: "Vendors", icon: <Users size={16} />, href: "/vendor/list" },
    {
      label: (data) => data?.name || "",
      href: "",
    },
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

  "/settings/general": [
    { label: "General settings", icon: <Settings2 size={16} />, href: "/" },
  ],
  "/settings/controls": [
    { label: "Controls", icon: <Settings2 size={16} />, href: "/" },
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
    <nav className="text-sm text-slate-600 flex gap-1 items-center">
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
          <span key={index} className="flex items-center gap-1">
            {index !== 0 && <span>/</span>}
            {isLast ? (
              <span className="flex items-center gap-2">
                {crumb.icon}
                {label}
              </span>
            ) : href ? (
              <Link
                href={href}
                className="flex items-center gap-2 text-slate-800 font-medium hover:underline hover:text-black"
              >
                {crumb.icon}
                {label}
              </Link>
            ) : (
              <div className="flex items-center gap-2 hover:underline hover:text-black">
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
