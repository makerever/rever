//This validation is used when create vendor credit

import { z } from "zod";

export const addCreditNoteSchema = z.object({
  credit_number: z.string().min(1, "Vendor credit is required"),
  credit_date: z.date({ required_error: "Vendor credit date is required" }),
  vendor: z.string().min(1, "Vendor is required"),
  notes: z.string().nullable().optional(),
  total_tax: z.string().optional(),
  sub_total: z.string().optional(),
  total: z.string().optional(),
  tax_percentage: z.string().optional(),
  items: z
    .array(
      z.object({
        id: z.string().optional(), // Optional ID for existing items
        description: z.string().optional(),
        quantity: z.string().optional(),
        unit_price: z.string().optional(),
        total_amount: z.string().optional(),
      }),
    )
    .optional(),
});

export type addCreditNoteSchemaValues = z.infer<typeof addCreditNoteSchema>;
