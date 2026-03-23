//This validation is used in profile settings

import { z } from "zod";

export const createProfileSettingSchema = (t: (key: string) => string) =>
  z.object({
    first_name: z.string().min(1, { message: t("validation.first_name_required") }),
    last_name: z.string().min(1, { message: t("validation.last_name_required") }),
    email: z.string(),
    display_name: z.string().optional(),
    timezone: z.string().optional(),
    role: z.string().optional(),
  });

export type profileSettingSchemaValues = z.infer<ReturnType<typeof createProfileSettingSchema>>;
