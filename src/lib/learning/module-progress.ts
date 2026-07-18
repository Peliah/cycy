import { ModuleProgressStatus } from "@prisma/client";

import { prisma } from "@/lib/prismadb";

/** Ensure every member has progress rows; first module AVAILABLE, rest LOCKED (unless already further). */
export async function ensureMemberModuleProgress(
	serverId: string,
	memberId: string,
) {
	const curriculum = await prisma.curriculum.findUnique({
		where: { serverId },
		select: {
			modules: {
				orderBy: { order: "asc" },
				select: { id: true, order: true },
			},
		},
	});
	if (!curriculum || curriculum.modules.length === 0) return;

	const existing = await prisma.moduleProgress.findMany({
		where: { memberId },
		select: { moduleId: true, status: true },
	});
	const byModule = new Map(existing.map((e) => [e.moduleId, e.status]));

	for (let i = 0; i < curriculum.modules.length; i++) {
		const mod = curriculum.modules[i]!;
		if (byModule.has(mod.id)) continue;

		const status =
			i === 0
				? ModuleProgressStatus.AVAILABLE
				: ModuleProgressStatus.LOCKED;

		await prisma.moduleProgress.create({
			data: { memberId, moduleId: mod.id, status },
		});
	}
}

/** Align module channel icons with a member's ModuleProgress (viewer-local). */
export async function syncChannelsForMember(
	serverId: string,
	memberId: string,
) {
	const progresses = await prisma.moduleProgress.findMany({
		where: {
			memberId,
			module: { curriculum: { serverId } },
		},
		select: {
			status: true,
			module: { select: { externalId: true, order: true } },
		},
	});

	for (const p of progresses) {
		if (!p.module.externalId) continue;
		await prisma.channel.updateMany({
			where: { serverId, externalModuleId: p.module.externalId },
			data: {
				moduleStatus: p.status,
				moduleOrder: p.module.order,
			},
		});
	}
}

export async function syncChannelStatusesFromProgress(serverId: string) {
	const curriculum = await prisma.curriculum.findUnique({
		where: { serverId },
		select: {
			modules: {
				orderBy: { order: "asc" },
				select: { id: true, externalId: true, order: true },
			},
		},
	});
	if (!curriculum) return;

	for (let i = 0; i < curriculum.modules.length; i++) {
		const mod = curriculum.modules[i]!;
		if (!mod.externalId) continue;
		await prisma.channel.updateMany({
			where: { serverId, externalModuleId: mod.externalId },
			data: {
				moduleOrder: mod.order,
				...(i === 0
					? { moduleStatus: ModuleProgressStatus.AVAILABLE }
					: {}),
			},
		});
	}
}

const XP_TIME_PENALTY_FACTOR = 0.5;
const XP_FLOOR_FACTOR = 0.25;

export function computeXpEarned(
	xpReward: number,
	score: number,
	startedAt: Date | null,
	timeLimitMinutes: number,
): number {
	let xp = Math.round(xpReward * Math.min(1, Math.max(0, score)));
	if (startedAt) {
		const elapsedMin = (Date.now() - startedAt.getTime()) / 60_000;
		if (elapsedMin > timeLimitMinutes) {
			xp = Math.round(xp * XP_TIME_PENALTY_FACTOR);
		}
	}
	const floor = Math.round(xpReward * XP_FLOOR_FACTOR);
	return Math.max(floor, xp);
}

export async function completeModuleAndUnlockNext(args: {
	memberId: string;
	profileId: string;
	moduleId: string;
	serverId: string;
	score: number;
	xpEarned: number;
}) {
	const { memberId, profileId, moduleId, serverId, score, xpEarned } = args;

	await prisma.moduleProgress.update({
		where: { memberId_moduleId: { memberId, moduleId } },
		data: {
			status: ModuleProgressStatus.COMPLETED,
			score,
			xpEarned,
			completedAt: new Date(),
		},
	});

	await prisma.member.update({
		where: { id: memberId },
		data: { xp: { increment: xpEarned } },
	});
	await prisma.profile.update({
		where: { id: profileId },
		data: { totalXp: { increment: xpEarned } },
	});

	const mod = await prisma.module.findUnique({
		where: { id: moduleId },
		select: { order: true, externalId: true, curriculumId: true },
	});
	if (!mod) return;

	if (mod.externalId) {
		await prisma.channel.updateMany({
			where: { serverId, externalModuleId: mod.externalId },
			data: { moduleStatus: ModuleProgressStatus.COMPLETED },
		});
	}

	const next = await prisma.module.findFirst({
		where: {
			curriculumId: mod.curriculumId,
			order: { gt: mod.order },
		},
		orderBy: { order: "asc" },
		select: { id: true, externalId: true },
	});

	if (!next) return;

	const nextProgress = await prisma.moduleProgress.findUnique({
		where: { memberId_moduleId: { memberId, moduleId: next.id } },
	});

	if (
		!nextProgress ||
		nextProgress.status === ModuleProgressStatus.LOCKED
	) {
		await prisma.moduleProgress.upsert({
			where: { memberId_moduleId: { memberId, moduleId: next.id } },
			create: {
				memberId,
				moduleId: next.id,
				status: ModuleProgressStatus.AVAILABLE,
			},
			update: { status: ModuleProgressStatus.AVAILABLE },
		});
	}

	if (next.externalId) {
		await prisma.channel.updateMany({
			where: { serverId, externalModuleId: next.externalId },
			data: { moduleStatus: ModuleProgressStatus.AVAILABLE },
		});
	}
}
