//This validation is used when create vendor

import { z } from "zod";

export const addVendorSchema = z.object({
  vendorName: z.string().min(1, "Vendor name is required"),
  companyName: z.string().optional(),
  mobile: z.string().optional(),
  email: z.string().optional(),
  taxId: z.string().optional(),
  website: z
    .string()
    .optional()
    .nullable()
    .refine(
      (url) => !url || url.startsWith("https://"), // Only validate if a value is provided
      { message: "Website must start with https://" },
    ),
  country: z.string().optional(),
  paymentTerms: z.string().nullable().optional(),
  billingAddress: z.object({
    line1: z.string().optional(),
    line2: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zip_code: z.string().optional(),
    country: z.string().optional(),
  }),
  bank_account: z.object({
    account_holder_name: z.string().optional(),
    account_number: z.string().optional(),
    bank_name: z.string().optional(),
  }),
  status: z.string().optional(),
});

export type addVendorSchemaValues = z.infer<typeof addVendorSchema>;
