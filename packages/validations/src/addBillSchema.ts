//This validation is used when create bill

import { z } from "zod";

export const addBillSchema = z.object({
  billNumber: z.string().optional(),
  comments: z.string().optional(),
  bill_date: z.date().refine((val) => !!val, {
    message: "Bill date is required",
  }),
  due_date: z.date().refine((val) => !!val, {
    message: "Due date is required",
  }),
  payment_terms: z.string().nullable().optional(),
  vendor: z.string().min(1, "Vendor is required"),
  purchase_order: z.string().optional(),
  total_tax: z.string().optional(),
  sub_total: z.string().optional(),
  total: z.string().optional(),
  tax_percentage: z.string().optional(),
  items: z
    .array(
      z.object({
        id: z.string().optional(), // Optional ID for existing items
        description: z.string().optional(),
        product_code: z.string().optional(),
        quantity: z.string().optional(),
        unit_price: z.string().optional(),
        amount: z.string().optional(),
      }),
    )
    .optional(),
});

export type addBillSchemaValues = z.infer<typeof addBillSchema>;
