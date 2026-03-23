//This validation is used when do invite member signup

import { z } from "zod";

export const createInviteMemberSignupSchema = (t: (key: string) => string) =>
  z.object({
    first_name: z.string().min(1, t("validation.first_name_required")),
    last_name: z.string().min(1, t("validation.last_name_required")),
    password: z
      .string()
      .min(8, { message: t("validation.password_min") })
      .refine((val) => /[A-Z]/.test(val), { message: t("validation.password_uppercase") })
      .refine((val) => /[a-z]/.test(val), { message: t("validation.password_lowercase") })
      .refine((val) => /\d/.test(val), { message: t("validation.password_number") })
      .refine((val) => /[^A-Za-z0-9]/.test(val), {
        message: t("validation.password_special"),
      }),
  });

export type inviteMemberSignupSchemaValues = z.infer<
  ReturnType<typeof createInviteMemberSignupSchema>
>;
