//This validation is used in profile settings

import { z } from "zod";

export const createGeneralSettingSchema = (t: (key: string) => string) =>
  z.object({
    org_name: z.string().min(1, { message: t("validation.org_name_required") }),
    currency: z.string().optional(),
    date_format: z.string().optional(),
    financial_year: z.string().optional(),
    business_type: z.string().optional(),
    industry: z.string().optional(),
    email: z.string().trim().email().or(z.literal("")),
    phone_number: z.string().optional(),
    address: z.object({
      country: z.string().optional(),
      state: z.string().optional(),
      city: z.string().optional(),
      zip_code: z.string().optional(),
    }),
  });

export type generalSettingSchemaValues = z.infer<ReturnType<typeof createGeneralSettingSchema>>;
