//This validation is used in profile settings

import { z } from "zod";

export const generalSettingSchema = z.object({
  org_name: z.string().min(1, { message: "First name required" }),
  currency: z.string().optional(),
  date_format: z.string().optional(),
  financial_year: z.string().optional(),
});

export type generalSettingSchemaValues = z.infer<typeof generalSettingSchema>;
