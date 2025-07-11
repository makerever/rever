//This validation is used when create bill

import { z } from "zod";

export const addPurchaseOrderSchema = z.object({
  poNumber: z.string().optional(),
  comments: z.string().optional(),
  po_date: z.date().refine((val) => !!val, {
    message: "PO date is required",
  }),
  delivery_date: z.date().refine((val) => !!val, {
    message: "Delivery date is required",
  }),
  payment_terms: z.string().nullable().optional(),
  vendor: z.string().min(1, "Vendor is required"),
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

export type addPurchaseOrderSchemaValues = z.infer<
  typeof addPurchaseOrderSchema
>;
