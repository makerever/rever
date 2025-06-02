// Component to display Breadcrumb

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
  UserCheck,
} from "lucide-react";
import { Crumb } from "@rever/types";

// Mapping of routes to their breadcrumb trails
const breadcrumbMap: Record<string, Crumb[]> = {
  "/home": [{ label: "Home", icon: <Home size={16} />, href: "/" }],
  "/vendor/list": [{ label: "Vendors", icon: <Users size={16} />, href: "" }],
  "/vendor/add": [
    { label: "Vendors", icon: <Users size={16} />, href: "/vendor/list" },
    { label: "Create vendor", icon: "", href: "" },
  ],
  "/vendor/update": [
    { label: "Vendors", icon: <Users size={16} />, href: "/vendor/list" },
    { label: "Update vendor", icon: "", href: "/vendor/update" },
  ],
  "/vendor/view": [
    { label: "Vendors", icon: <Users size={16} />, href: "/vendor/list" },
    { label: "View vendor", icon: "", href: "" },
  ],
  "/bill/approvals/list": [
    { label: "Approvals", icon: <UserCheck size={16} />, href: "" },
  ],
  "/bill/list": [{ label: "Bills", icon: <ReceiptText size={16} />, href: "" }],
  "/bill/add": [
    { label: "Bills", icon: <ReceiptText size={16} />, href: "/bill/list" },
    { label: "Create bill", icon: "", href: "" },
  ],
  "/bill/edit": [
    { label: "Bills", icon: <ReceiptText size={16} />, href: "/bill/list" },
    { label: "Update bill", icon: "", href: "" },
  ],
  "/bill/view": [
    { label: "Bills", icon: <ReceiptText size={16} />, href: "/bill/list" },
    { label: "View bill", icon: "", href: "" },
  ],
  "/settings/general": [
    { label: "General settings", icon: <Settings2 size={16} />, href: "/" },
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

// Breadcrumb component definition
export default function Breadcrumb() {
  // Get the current route path
  const pathname = usePathname();
  // Get the breadcrumb trail for the current path, or empty if not found
  const breadcrumb = breadcrumbMap[pathname] || [];

  return (
    <nav className="text-sm text-slate-600 flex gap-1 items-center">
      {/* Render each breadcrumb item */}
      {breadcrumb.map((crumb, index) => {
        const isLast = index === breadcrumb.length - 1; // Check if this is the last breadcrumb

        return (
          <span key={index} className="flex items-center gap-1">
            {/* Add a slash separator except before the first item */}
            {index !== 0 && <span>/</span>}
            {isLast ? (
              // Active breadcrumb (not clickable)
              <span className="flex items-center gap-2">
                {crumb.icon}
                {crumb.label}
              </span>
            ) : // Clickable parent breadcrumb if href is provided
            crumb.href !== "" ? (
              <Link
                href={crumb.href}
                className="flex items-center gap-2 text-slate-800 font-medium hover:underline hover:text-black"
              >
                {crumb.icon}
                {crumb.label}
              </Link>
            ) : (
              // Non-clickable parent breadcrumb
              <div className="flex items-center gap-2 hover:underline hover:text-black">
                {crumb.icon}
                {crumb.label}
              </div>
            )}
          </span>
        );
      })}
    </nav>
  );
}
