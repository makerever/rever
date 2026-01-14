
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
  maxFractionDigits: number = 2
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

  const parts = [
    str.line1,
    str.line2,
    str.city,
    str.state,
    str.country,
    str.zip_code,
  ].filter(Boolean); // removes undefined, null, or empty strings

  return parts.length === 0 ? "--" : parts.join(", ");
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
  in_review: "Under Review",
  under_approval: "Under Approval",
  approved: "Approved",
  posted: "Ledger Entry",
  failed: "Failed",
  rejected: "Rejected",
  closed: "Closed",
  active: "Active",
  revoked: "Revoked",
  requested: "Pending",
  confirmed: "Confirmed",
  completed: "Completed",
  expired: "Expired",
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

  // Red
  Inactive: "text-red-800 bg-red-100 border-red-400 font-medium",
  inactive: "text-red-800 bg-red-100 border-red-400 font-medium",
  failed: "text-red-800 bg-red-100 border-red-400 font-medium",
  Revoked: "text-red-800 bg-red-100 border-red-400 font-medium",

  // Yellow
  Pending: "bg-yellow-100",
  Assigned: "bg-yellow-100",

  "Under Review": "bg-yellow-100",
  "Under Approval": "bg-cyan-100",
  Draft: "bg-secondary-200",
  "Ledger Entry": "bg-purple-100",
  Rejected: "bg-pink-100",
  Approved: "bg-lime-100",

  "Exact match": "bg-green-100",
  Mismatch: "bg-red-100",
  "Partial match": "bg-orange-100",
  "No PO": "bg-zinc-100",

  Expired: "bg-secondary-200",
};

// Function to get bill status pills
export const getStatusClass = (status: string = ""): string => {
  return statusClassMap[status] || "none";
};

// Function to export data as excel
export async function exportToExcel<T extends object>(
  data: T[],
  fileName = "export"
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

export function convertToPercentage(value: number) {
  return (value * 100).toFixed(1);
}

// Funcion to check value is object or not
export function isNamedObject(
  val: unknown,
): val is { name: string; id: string } {
  return typeof val === "object" && val !== null && "name" in val;
}

export const getStatusLabelForExtraction = (status: string) => {
  switch (status) {
    case "uploaded":
      return "processing";
    case "uploading":
      return "uploading";
    case "modeling":
      return "extracting";
    case "done":
      return "enriched";
    case "failed":
      return "failed";
    default:
      return status;
  }
};

//Get line items field value for Audit validation
export const getAuditFieldValue = (
  auditItem: boolean | Record<string, any> | undefined,
  key: string,
  subItem?: string
) => {
  if (!auditItem || typeof auditItem !== "object") return undefined;

  const value = auditItem[key];

  if (subItem && typeof value === "object") {
    return value?.[subItem];
  }

  return value;
};

//Get mismatch classname based on audit line items class
export const getLineItemAuditClass = (
  itemsAuditValidation: any[] | undefined,
  index: number,
  showAuditHistory: boolean,
  field?: boolean
) => {
  if (!showAuditHistory) return "";

  const auditItem = itemsAuditValidation?.[index];

  //Case 1: Entire row mismatch
  if (auditItem === false) {
    return "bg-indigo-100 border-b border-indigo-800";
  }

  //Case 2: Field-level mismatch
  if (auditItem && typeof auditItem === "object" && field === false) {
    return "bg-indigo-100 border-b border-indigo-800";
  }

  return "";
};

//Get mismatch classname except lineitem
export const checkAuditValidation = ({ showAuditHistory, field }: { showAuditHistory: boolean, field?: boolean }) => {
  if (showAuditHistory && !field) {
    return "bg-indigo-100 border border-indigo-800"
  }
  return ""
}
