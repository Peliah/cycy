import { z } from "zod";

export const learningReasons = [
	{ value: "RETAKE", label: "Retaking a course" },
	{ value: "EXAM_PREP", label: "Preparing for an exam" },
	{ value: "JOB_PREP", label: "Preparing for a job" },
	{ value: "SELF_STUDY", label: "Studying on my own" },
	{ value: "HOBBY", label: "Learning for fun" },
] as const;

export const learningReasonSchema = z.enum(
	["RETAKE", "EXAM_PREP", "JOB_PREP", "SELF_STUDY", "HOBBY"],
	{ error: "Choose why you're learning this" },
);

export const learningMaterialSchema = z.object({
	fileName: z.string().min(1),
	fileUrl: z.string().url(),
	mimeType: z.string().min(1),
});

export const createGroupSchema = z.object({
	name: z.string().min(1, "Group name is required"),
	imageUrl: z.string().url().optional().or(z.literal("")),
	learningGoal: z.string().min(1, "Describe what you want to learn"),
	learningReason: learningReasonSchema,
	materials: z
		.array(learningMaterialSchema)
		.min(1, "Add a PDF, Word doc, or some notes to continue"),
});

export const joinGroupSchema = z.object({
	inviteCode: z.string().min(1, "Invite code is required"),
});

export type CreateGroupValues = z.infer<typeof createGroupSchema>;
export type JoinGroupValues = z.infer<typeof joinGroupSchema>;
export type MaterialItem = CreateGroupValues["materials"][number];
