//This validation is used when invite member

import { z } from "zod";

export const addApproverSchema = z.object({
  model_name: z.string(),
  assignments: z.array(
    z.object({
      approver: z.union([z.string(), z.number()]),
      level: z.number(),
    }),
  ),
});

export type addApproverSchemaValues = z.infer<typeof addApproverSchema>;
