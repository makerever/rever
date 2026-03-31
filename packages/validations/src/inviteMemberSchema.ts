//This validation is used when invite member

import { z } from "zod";

export const createInviteMemberSchema = (
  adminDomain: string,
  t: (key: string, params?: Record<string, string>) => string,
) =>
  z.object({
    first_name: z.string().optional(),
    last_name: z.string().optional(),
    email: z
      .string()
      .min(1, t("validation.email_required"))
      .email(t("validation.enter_valid_email"))
      .refine((val) => val.endsWith(`@${adminDomain}`), {
        message: t("validation.email_domain", { domain: adminDomain }),
      }),
    role: z.string().min(1, t("validation.role_required")),
  });

export type inviteMemberSchemaValues = z.infer<
  ReturnType<typeof createInviteMemberSchema>
>;
