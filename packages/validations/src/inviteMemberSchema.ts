//This validation is used when invite member

import { z } from "zod";

export const inviteMemberSchema = z.object({
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  email: z.string().min(1, "Email is required"),
  role: z.string().min(1, "Role is required"),
});

export type inviteMemberSchemaValues = z.infer<typeof inviteMemberSchema>;
