//This validation is used in reset password

import { z } from "zod";

export const resetPasswordSchema = z
  .object({
    otp: z.string().min(1, { message: "OTP is required" }),
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

export type resetPasswordSchemaValues = z.infer<typeof resetPasswordSchema>;
