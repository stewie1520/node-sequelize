import { z } from "zod";

export const createWorkspaceSchema = z.object({
  name: z.string().nonempty(),
});

export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>;
