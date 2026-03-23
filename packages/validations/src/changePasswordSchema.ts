//This validation is used in change password

import { z } from "zod";

export const createChangePasswordSchema = (t: (key: string) => string) =>
  z
    .object({
      old_password: z.string().min(1, { message: t("validation.old_password_required") }),
      new_password: z
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
    .refine((data) => data.new_password === data.confirmPassword, {
      path: ["confirmPassword"],
      message: t("validation.passwords_no_match"),
    });

export type changePasswordSchemaValues = z.infer<ReturnType<typeof createChangePasswordSchema>>;
