/** Runtime-safe Prisma enums for client components (do not import `@prisma/client` in `"use client"` files). */

export const ChannelType = {
	TEXT: "TEXT",
	AUDIO: "AUDIO",
	VIDEO: "VIDEO",
} as const;
export type ChannelType = (typeof ChannelType)[keyof typeof ChannelType];

export const MemberRole = {
	MODERATOR: "MODERATOR",
	GUEST: "GUEST",
	ADMIN: "ADMIN",
} as const;
export type MemberRole = (typeof MemberRole)[keyof typeof MemberRole];

export const MessageAuthorType = {
	USER: "USER",
	AI_AGENT: "AI_AGENT",
	SYSTEM: "SYSTEM",
} as const;
export type MessageAuthorType = (typeof MessageAuthorType)[keyof typeof MessageAuthorType];

export const ModuleProgressStatus = {
	LOCKED: "LOCKED",
	AVAILABLE: "AVAILABLE",
	IN_PROGRESS: "IN_PROGRESS",
	COMPLETED: "COMPLETED",
} as const;
export type ModuleProgressStatus =
	(typeof ModuleProgressStatus)[keyof typeof ModuleProgressStatus];
