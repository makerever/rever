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
  value: number | string,
  currency: string = "USD",
  locale?: string,
  compact?: boolean,
): string {
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return "";

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
    // Replace $ with AU$/CA$/SG$ etc.
    return formatted.replace("$", currencyPrefixMap[currency]);
  }

  return formatted;
}

//Function to make first letter capital
export const capitalizeFirstLetter = (str: string) =>
  str.charAt(0).toUpperCase() + str.slice(1);

// Function to get combine address
export const getCombineAddress = (str?: AddressTypeProps) => {
  if (!str) return "-";

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
};

//Function to get labels for bill status
export const getLabelForBillStatus = (value: string) =>
  billStatusLabels[value] || "Unknown";

//Function to get bill status pills
export const getStatusClass = (status: string = ""): string => {
  switch (status) {
    case "Approved":
      return "text-green-600 bg-green-50 border-green-200";
    case "Active":
      return "text-green-600 bg-green-50 border-green-200";
    case "Rejected":
      return "text-red-500 bg-red-50 border-red-200";
    case "Inactive":
      return "text-red-500 bg-red-50 border-red-200";
    case "Under review":
      return "text-purple-500 bg-purple-50 border-purple-200";
    case "Under approval":
      return "text-orange-400 bg-orange-50 border-orange-200";
    case "Draft":
      return "text-yellow-500 bg-yellow-50 border-yellow-200";
    case "Pending":
      return "text-yellow-500 bg-yellow-50 border-yellow-200";
    default:
      return "text-slate-800 bg-slate-50 border-slate-200";
  }
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
  Admin: "Admin",
  Member: "Member",
  "Finance manager": "Finance manager",
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
