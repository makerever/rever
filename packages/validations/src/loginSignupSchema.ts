//This validation is used in login/signup

import { z } from "zod";

export const createLoginSignupSchema = (t: (key: string) => string) =>
  z.object({
    email: z.string().email(t("validation.enter_valid_email")),
    password: z.string(),
    otp: z.string().optional(),
  });

export type loginFormSchemaValues = z.infer<
  ReturnType<typeof createLoginSignupSchema>
>;
