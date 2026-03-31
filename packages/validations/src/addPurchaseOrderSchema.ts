//This validation is used when create PO

import { z } from "zod";

export const createAddPurchaseOrderSchema = (t: (key: string) => string) =>
  z.object({
    poNumber: z.string().optional(),
    comments: z.string().nullable().optional(),
    po_date: z.date().refine((val) => !!val, {
      message: t("validation.po_date_required"),
    }),
    delivery_date: z.date().refine((val) => !!val, {
      message: t("validation.delivery_date_required"),
    }),
    payment_terms: z.string().nullable().optional(),
    vendor: z.string().min(1, t("validation.vendor_required")),
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

export type addPurchaseOrderSchemaValues = z.infer<
  ReturnType<typeof createAddPurchaseOrderSchema>
>;
