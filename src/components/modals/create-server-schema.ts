import {
	createGroupSchema,
	joinGroupSchema,
	type CreateGroupValues,
	type JoinGroupValues,
	type MaterialItem,
} from "@/lib/onboarding/schema";

/** Create tab — same contract as onboarding create-group. */
export const createServerSchema = createGroupSchema;
export type CreateServerFormValues = CreateGroupValues;
export type { MaterialItem };

/** Join tab */
export const joinServerSchema = joinGroupSchema;
export type JoinServerFormValues = JoinGroupValues;

export const CREATE_SERVER_DEFAULTS: CreateServerFormValues = {
	name: "",
	imageUrl: "",
	learningGoal: "",
	learningReason: "SELF_STUDY",
	materials: [],
};
