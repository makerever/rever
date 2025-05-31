//This validation is used in login/signup

import { z } from "zod";

export const loginSignupSchema = z.object({
  email: z.string().email("Enter valid email"),
  password: z.string(),
  otp: z.string().optional(),
});

export type loginFormSchemaValues = z.infer<typeof loginSignupSchema>;
