//This validation is used in registraion

import { z } from "zod";

export const createRegisterSchema = (t: (key: string) => string) =>
  z
    .object({
      first_name: z.string().min(1, { message: t("validation.first_name_required") }),
      last_name: z.string().min(1, { message: t("validation.last_name_required") }),
      currency: z.string().min(1, { message: t("validation.org_currency_required") }),
      org_name: z.string().min(1, { message: t("validation.org_name_required") }),
      password: z
        .string()
        .min(8, { message: t("validation.password_min") })
        .refine((val) => /[A-Z]/.test(val), { message: t("validation.password_uppercase") })
        .refine((val) => /[a-z]/.test(val), { message: t("validation.password_lowercase") })
        .refine((val) => /\d/.test(val), { message: t("validation.password_number") })
        .refine((val) => /[^A-Za-z0-9]/.test(val), {
          message: t("validation.password_special"),
        }),
      confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
      path: ["confirmPassword"],
      message: t("validation.passwords_no_match"),
    });

export type registerSchemaValues = z.infer<ReturnType<typeof createRegisterSchema>>;
