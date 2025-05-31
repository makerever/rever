//This validation is used in registraion

import { z } from "zod";

export const registerSchema = z
  .object({
    first_name: z.string().min(1, { message: "First name required" }),
    last_name: z.string().min(1, { message: "Last name required" }),
    currency: z.string().min(1, { message: "Org currency required" }),
    org_name: z.string().min(1, { message: "Org name required" }),
    password: z
      .string()
      .min(8, { message: "Min 7 chars." })
      .refine((val) => /[A-Z]/.test(val), { message: "Add uppercase." })
      .refine((val) => /[a-z]/.test(val), { message: "Add lowercase." })
      .refine((val) => /\d/.test(val), { message: "Add number." })
      .refine((val) => /[^A-Za-z0-9]/.test(val), {
        message: "Add special char.",
      }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords don't match.",
  });

export type registerSchemaValues = z.infer<typeof registerSchema>;
