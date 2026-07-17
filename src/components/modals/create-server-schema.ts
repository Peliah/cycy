import { z } from "zod";

export const createServerSchema = z.object({
	name: z.string().min(1, { message: "Server name is required" }),
	imageUrl: z.string().optional(),
});

export type CreateServerFormValues = z.infer<typeof createServerSchema>;
