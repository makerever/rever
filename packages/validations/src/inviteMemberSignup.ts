//This validation is used when do invite member signup

import { z } from "zod";

export const inviteMemberSignupSchema = z.object({
  first_name: z.string().min(1, "Fisrt name is required"),
  last_name: z.string().min(1, "Last name is required"),
  password: z
    .string()
    .min(8, { message: "Min 7 chars." })
    .refine((val) => /[A-Z]/.test(val), { message: "Add uppercase." })
    .refine((val) => /[a-z]/.test(val), { message: "Add lowercase." })
    .refine((val) => /\d/.test(val), { message: "Add number." })
    .refine((val) => /[^A-Za-z0-9]/.test(val), {
      message: "Add special char.",
    }),
});

export type inviteMemberSignupSchemaValues = z.infer<
  typeof inviteMemberSignupSchema
>;
