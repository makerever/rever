//This validation is used when invite member

import { z } from "zod";

export const createInviteMemberSchema = (adminDomain: string) =>
  z.object({
    first_name: z.string().optional(),
    last_name: z.string().optional(),
    email: z
      .string()
      .min(1, "Email is required")
      .email("Enter valid email")
      .refine((val) => val.endsWith(`@${adminDomain}`), {
        message: `Email must end with @${adminDomain}`,
      }),
    role: z.string().min(1, "Role is required"),
  });

export type inviteMemberSchemaValues = z.infer<
  ReturnType<typeof createInviteMemberSchema>
>;
