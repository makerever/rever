//This validation is used in change password

import { z } from "zod";

export const changePasswordSchema = z
  .object({
    old_password: z.string().min(1, { message: "Old password required" }),
    new_password: z
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
  .refine((data) => data.new_password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords don't match.",
  });

export type changePasswordSchemaValues = z.infer<typeof changePasswordSchema>;
