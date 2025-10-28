// Utility functions

import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { AddressTypeProps } from "@rever/types";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

//Function to get first letter of string
export const getFirstLetter = (str: string | undefined) => {
  if (str && str.length > 0) {
    return str[0];
  }
  return "";
};

//Function to format number
export function formatNumber(
  value: number | string | undefined,
  currency: string = "USD",
  locale?: string,
  compact?: boolean,
): string {
  if (value === undefined || value === null || value === "") return "";

  const num = typeof value === "string" ? parseFloat(value) : value;

  if (typeof num !== "number" || isNaN(num)) return "";

  const currencyLocaleMap: Record<string, string> = {
    USD: "en-US",
    INR: "en-IN",
    EUR: "en-IE",
    GBP: "en-GB",
    JPY: "ja-JP",
    AUD: "en-AU",
    CAD: "en-CA",
    CHF: "de-CH",
    CNY: "zh-CN",
    SGD: "en-SG",
    NZD: "en-NZ",
    SEK: "sv-SE",
  };

  const currencyPrefixMap: Record<string, string> = {
    AUD: "A$",
    CAD: "C$",
    SGD: "S$",
    NZD: "NZ$",
    USD: "$",
  };

  const resolvedLocale =
    locale ?? currencyLocaleMap[currency] ?? navigator.language;

  const formatted = new Intl.NumberFormat(resolvedLocale, {
    style: "currency",
    currency,
    notation: compact ? "compact" : "standard",
    currencyDisplay: "symbol",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);

  if (["AUD", "CAD", "SGD", "NZD"].includes(currency)) {
    return formatted.replace("$", currencyPrefixMap[currency]);
  }

  return formatted;
}

// For plain numbers only (no currency, just commas)
export function formatPlainNumber(
  value: number | string | undefined,
  compact?: boolean,
  minFractionDigits: number = 2,
  maxFractionDigits: number = 2,
): string {
  if (value === undefined || value === null || value === "") return "";

  const num = typeof value === "string" ? parseFloat(value) : value;
  if (typeof num !== "number" || isNaN(num)) return "";

  return new Intl.NumberFormat("en-US", {
    notation: compact ? "compact" : "standard",
    minimumFractionDigits: minFractionDigits,
    maximumFractionDigits: maxFractionDigits,
  }).format(num);
}

//Function to make first letter capital
export const capitalizeFirstLetter = (str: string) =>
  str.charAt(0).toUpperCase() + str.slice(1);

// Function to get combine address
export const getCombineAddress = (str?: AddressTypeProps) => {
  if (!str) return "--";

  return `${str.line1} ${str.line2} ${str.city ? "," + str.city : ""} ${
    str.state ? "," + str.state : ""
  } ${str.country ? "," + str.country : ""} ${
    str.zip_code ? "," + str.zip_code : ""
  }`;
};

// Function to list label for payment terms
export const PaymentTermsLabels: Record<string, string> = {
  net15: "Net 15 days",
  net30: "Net 30 days",
  net45: "Net 45 days",
  due: "Due on receipt",
};

//Function to get labels for payment terms
export const getLabelForTerm = (value: string) =>
  PaymentTermsLabels[value] || "--";

// Function to list label for bill status
export const billStatusLabels: Record<string, string> = {
  draft: "Draft",
  in_review: "Under review",
  under_approval: "Under approval",
  approved: "Approved",
  rejected: "Rejected",
  closed: "Closed",
  active: "Active",
  revoked: "Revoked",
  requested: "Pending",
  confirmed: "Confirmed",
  completed: "Completed",
  matched: "Exact match",
  partial: "Partial match",
  mismatched: "Mismatch",
  no_po: "No PO",
  pending: "Pending",
};

//Function to get labels for bill status
export const getLabelForBillStatus = (value: string) =>
  billStatusLabels[value] || "Unknown";

type StatusClassMap = Record<string, string>;

const statusClassMap: StatusClassMap = {
  // Green
  Active: "text-green-800 bg-green-100 border-green-400 font-medium",
  active: "text-green-800 bg-green-100 border-green-400 font-medium",
  Confirmed: "text-green-800 bg-green-100 border-green-400 font-medium",
  done: "text-green-800 bg-green-100 border-green-400 font-medium",
  completed: "text-green-800 bg-green-100 border-green-400 font-medium",
  Approved: "text-lime-800 bg-lime-100 border-lime-400 font-medium",

  // Red
  Inactive: "text-red-800 bg-red-100 border-red-400 font-medium",
  inactive: "text-red-800 bg-red-100 border-red-400 font-medium",
  failed: "text-red-800 bg-red-100 border-red-400 font-medium",
  Revoked: "text-red-800 bg-red-100 border-red-400 font-medium",
  Mismatch: "text-red-800 bg-red-100 border-red-400 font-medium",
  Rejected: "text-pink-800 bg-pink-100 border-pink-400 font-medium",

  // Yellow
  Pending: "text-yellow-800 bg-yellow-100 border-yellow-400 font-medium",
  Assigned: "text-yellow-800 bg-yellow-100 border-yellow-400 font-medium",
  "Under review": "text-yellow-800 bg-yellow-100 border-yellow-400 font-medium",

  // Sky
  "Under approval": "text-sky-800 bg-sky-100 border-sky-400 font-medium",

  // Slate
  Draft: "text-slate-800 bg-slate-100 border-slate-400 font-medium",

  // Indigo
  "Ledger entry": "text-indigo-800 bg-indigo-100 border-indigo-400 font-medium",

  // Teal
  "Exact match": "text-teal-800 bg-teal-100 border-teal-400 font-medium",

  // Orange
  "Partial match":
    "text-orange-800 bg-orange-100 border-orange-400 font-medium",

  // Zinc
  "No PO": "text-zinc-800 bg-zinc-100 border-zinc-400 font-medium",
};

// Function to get bill status pills
export const getStatusClass = (status: string = ""): string => {
  return statusClassMap[status] || "none";
};

// Function to export data as excel
export async function exportToExcel<T extends object>(
  data: T[],
  fileName = "export",
) {
  if (!data || data.length === 0) {
    console.warn("No data provided for Excel export.");
    return;
  }

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Sheet1");

  const columns = Object.keys(data[0]).map((key) => ({
    header: key,
    key,
  }));

  worksheet.columns = columns;

  data.forEach((item) => {
    worksheet.addRow(item);
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  saveAs(blob, `${fileName}.xlsx`);
}

// Function to list label for roles
export const RolesLabels: Record<string, string> = {
  admin: "Admin",
  member: "Member",
  finance_manager: "Finance manager",
  lite_user: "Lite user",
  Admin: "Admin",
  Member: "Member",
  "Finance manager": "Finance manager",
  "Lite user": "Lite user",
};

//Function to get labels for payment terms
export const getLabelForRoles = (value: string) =>
  RolesLabels[value] || "Unknown";

// Function to list label for member status
export const memberStatusLabels: Record<string, string> = {
  pending: "Pending",
  expired: "Expired",
};

//Function to get labels for bill status
export const getLabelForMemberStatus = (value: string) =>
  memberStatusLabels[value] || "--";

export function convertToPercentage(value: number) {
  return (value * 100).toFixed(1);
}
