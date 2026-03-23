//This validation is used when create bill

import { z } from "zod";

export const createAddBillSchema = (t: (key: string) => string) =>
  z.object({
    billNumber: z.string().optional(),
    comments: z.string().nullable().optional(),
    bill_date: z.date().refine((val) => !!val, {
      message: t("validation.bill_date_required"),
    }),
    due_date: z.date().refine((val) => !!val, {
      message: t("validation.due_date_required"),
    }),
    payment_terms: z.string().nullable().optional(),
    vendor: z.string().min(1, t("validation.vendor_required")),
    purchase_order: z.string().optional(),
    total_tax: z.string().optional(),
    sub_total: z.string().optional(),
    total: z.string().optional(),
    tax_percentage: z.string().optional(),
    items: z
      .array(
        z.object({
          id: z.string().optional(),
          description: z.string().optional(),
          product_code: z.string().optional(),
          quantity: z.string().optional(),
          unit_price: z.string().optional(),
          amount: z.string().optional(),
        }),
      )
      .optional(),
  });

export type addBillSchemaValues = z.infer<ReturnType<typeof createAddBillSchema>>;
