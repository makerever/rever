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
import { useTranslate } from "@rever/i18n";

type Crumb = {
  label: string | ((data: any) => string);
  href: string | ((data: any) => string);
  icon?: React.ReactNode;
};

export default function Breadcrumb() {
  const pathname = usePathname();
  const dynamicData = useBreadcrumbStore((s) => s.dynamicCrumb[pathname]);
  const t = useTranslate();

  const breadcrumbMap: Record<string, Crumb[]> = {
    "/home": [
      { label: t("breadcrumbs.dashboard"), icon: <LayoutDashboard size={16} />, href: "/" },
    ],
    "/vendor/list": [{ label: t("breadcrumbs.vendors"), icon: <Users size={16} />, href: "" }],
    "/vendor/view": [
      { label: t("breadcrumbs.vendors"), icon: <Users size={16} />, href: "/vendor/list" },
      {
        label: (data) => data?.name || "",
        href: "",
      },
    ],
    "/vendor/add": [
      { label: t("breadcrumbs.vendors"), icon: <ReceiptText size={16} />, href: "/vendor/list" },
      { label: t("breadcrumbs.create_vendor"), icon: "", href: "" },
    ],
    "/vendor/update": [
      { label: t("breadcrumbs.vendors"), icon: <Users size={16} />, href: "/vendor/list" },
      {
        label: (data) => data?.name || "--",
        href: (data) => `/vendor/view?id=${data?.id}`,
      },
      { label: t("breadcrumbs.update"), href: "" },
    ],

    "/bill/list": [{ label: t("breadcrumbs.bills"), icon: <ReceiptText size={16} />, href: "" }],
    "/bill/add": [
      { label: t("breadcrumbs.bills"), icon: <ReceiptText size={16} />, href: "/bill/list" },
      { label: t("breadcrumbs.create_bill"), icon: "", href: "" },
    ],
    "/bill/view": [
      { label: t("breadcrumbs.bills"), icon: <ReceiptText size={16} />, href: "/bill/list" },
      {
        label: (data) => data?.name || "",
        href: "",
      },
    ],
    "/bill/edit": [
      { label: t("breadcrumbs.bills"), icon: <Users size={16} />, href: "/bill/list" },
      {
        label: (data) => data?.name || "--",
        href: (data) => `/bill/view?id=${data?.id}`,
      },
      { label: t("breadcrumbs.update"), href: "" },
    ],
    "/bill/match": [
      { label: t("breadcrumbs.bills"), icon: <ReceiptText size={16} />, href: "/bill/list" },
      {
        label: (data) => data?.name || "",
        href: (data) => `/bill/view?id=${data?.id}`,
      },
      { label: t("breadcrumbs.view_match"), href: "" },
    ],
    "/vendorcredit/list": [
      { label: t("breadcrumbs.vendor_credits"), icon: <NotepadText size={16} />, href: "" },
    ],
    "/vendorcredit/add": [
      {
        label: t("breadcrumbs.vendor_credits"),
        icon: <NotepadText size={16} />,
        href: "/vendorcredit/list",
      },
      { label: t("breadcrumbs.create_vendor_credit"), icon: "", href: "" },
    ],
    "/vendorcredit/view": [
      {
        label: t("breadcrumbs.vendor_credits"),
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
        label: t("breadcrumbs.vendor_credits"),
        icon: <NotepadText size={16} />,
        href: "/vendorcredit/list",
      },
      {
        label: (data) => data?.name || "--",
        href: (data) => `/vendorcredit/view?id=${data?.id}`,
      },
      { label: t("breadcrumbs.update"), href: "" },
    ],
    "/request-receipt/list": [
      { label: t("breadcrumbs.confirmations"), icon: <ReceiptText size={16} />, href: "" },
    ],
    "/request-receipt/view": [
      {
        label: t("breadcrumbs.confirmations"),
        icon: <ReceiptText size={16} />,
        href: "/request-receipt/list",
      },
      {
        label: (data) => data?.name || "",
        href: "",
      },
    ],
    "/approvals/list/review": [
      { label: t("breadcrumbs.approvals"), icon: <FileCheck2 size={16} />, href: "" },
    ],
    "/approvals/list/review/match": [
      {
        label: t("breadcrumbs.approvals"),
        icon: <FileCheck2 size={16} />,
        href: "/approvals/list/review",
      },
      {
        label: (data) => data?.name || "",
        href: (data) => `/bill/${data?.id}/review`,
      },
      { label: t("breadcrumbs.view_match"), href: "" },
    ],
    "/purchaseorder/list": [
      { label: t("breadcrumbs.purchase_orders"), icon: <ReceiptText size={16} />, href: "" },
    ],
    "/purchaseorder/add": [
      {
        label: t("breadcrumbs.purchase_orders"),
        icon: <ReceiptText size={16} />,
        href: "/purchaseorder/list",
      },
      { label: t("breadcrumbs.create_po"), icon: "", href: "" },
    ],
    "/purchaseorder/view": [
      {
        label: t("breadcrumbs.purchase_orders"),
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
        label: t("breadcrumbs.purchase_orders"),
        icon: <Users size={16} />,
        href: "/purchaseorder/list",
      },
      {
        label: (data) => data?.name || "--",
        href: (data) => `/purchaseorder/view?id=${data?.id}`,
      },
      { label: t("breadcrumbs.update"), href: "" },
    ],
    "/inbox": [{ label: t("breadcrumbs.inbox"), icon: <Inbox size={16} />, href: "/" }],
    "/profile": [
      { label: t("breadcrumbs.profile"), href: "/" },
    ],
    "/security": [
      { label: t("breadcrumbs.security"), href: "/" },
    ],
    "/preferences": [
      { label: t("breadcrumbs.preferences"), href: "/" },
    ],
    "/settings/general": [
      { label: t("breadcrumbs.general_settings"), icon: <Settings size={16} />, href: "/" },
    ],
    "/settings/controls": [
      { label: t("breadcrumbs.controls"), icon: <Settings size={16} />, href: "/" },
    ],
    "/settings/members": [
      { label: t("breadcrumbs.members"), icon: <UsersRound size={16} />, href: "/" },
    ],
    "/settings/approvals": [
      { label: t("breadcrumbs.approvals"), icon: <UserRoundCheck size={16} />, href: "/" },
    ],
    "/settings/members/invite": [
      {
        label: t("breadcrumbs.members"),
        icon: <UsersRound size={16} />,
        href: "/settings/members",
      },
      { label: t("breadcrumbs.invite_member"), icon: "", href: "" },
    ],
  };

  const breadcrumb = breadcrumbMap[pathname] || [];

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
