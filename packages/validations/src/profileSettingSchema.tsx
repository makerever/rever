//This validation is used in profile settings

import { z } from "zod";

export const profileSettingSchema = z.object({
  first_name: z.string().min(1, { message: "First name required" }),
  last_name: z.string().min(1, { message: "Last name required" }),
  email: z.string(),
  display_name: z.string().optional(),
  timezone: z.string().optional(),
  role: z.string().optional(),
});

export type profileSettingSchemaValues = z.infer<typeof profileSettingSchema>;
