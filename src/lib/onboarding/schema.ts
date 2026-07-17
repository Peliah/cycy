import { z } from "zod";

export const learningMaterialSchema = z.object({
	fileName: z.string().min(1),
	fileUrl: z.string().url(),
	mimeType: z.string().min(1),
});

export const createGroupSchema = z.object({
	name: z.string().min(1, "Group name is required"),
	imageUrl: z.string().url().optional().or(z.literal("")),
	learningGoal: z.string().min(1, "Describe what you want to learn"),
	learningReason: z.string().min(1, "Tell us why you're learning this"),
	materials: z
		.array(learningMaterialSchema)
		.min(1, "Upload at least one PDF, Word, or text file"),
});

export const joinGroupSchema = z.object({
	inviteCode: z.string().min(1, "Invite code is required"),
});

export type CreateGroupValues = z.infer<typeof createGroupSchema>;
export type JoinGroupValues = z.infer<typeof joinGroupSchema>;
export type MaterialItem = CreateGroupValues["materials"][number];
