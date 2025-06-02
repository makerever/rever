//This validation is used when invite member

import { z } from "zod";

export const addApproverSchema = z.object({
  approver: z.string().min(1, "Role is required"),
  model_name: z.string().optional(),
});

export type addApproverSchemaValues = z.infer<typeof addApproverSchema>;
