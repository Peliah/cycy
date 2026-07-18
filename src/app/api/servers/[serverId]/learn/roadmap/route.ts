import { NextResponse } from "next/server";

import { createCycyClient } from "@/lib/cycy";
import {
	ensureMemberModuleProgress,
	syncChannelsForMember,
} from "@/lib/learning/module-progress";
import { prisma } from "@/lib/prismadb";
import { getCurrentProfile } from "@/lib/query";
import { auth } from "@clerk/nextjs/server";

/** GET /api/servers/:serverId/learn/roadmap */
export async function GET(
	_req: Request,
	{ params }: { params: Promise<{ serverId: string }> },
) {
	try {
		const profile = await getCurrentProfile();
		if (!profile || !("id" in profile)) {
			return new NextResponse("Unauthorized", { status: 401 });
		}

		const { serverId } = await params;
		const member = await prisma.member.findFirst({
			where: { serverId, profileId: profile.id },
			select: { id: true, xp: true },
		});
		if (!member) {
			return new NextResponse("Forbidden", { status: 403 });
		}

		await ensureMemberModuleProgress(serverId, member.id);
		await syncChannelsForMember(serverId, member.id);

		const curriculum = await prisma.curriculum.findUnique({
			where: { serverId },
			select: {
				id: true,
				status: true,
				summary: true,
				modules: {
					orderBy: { order: "asc" },
					select: {
						id: true,
						externalId: true,
						order: true,
						title: true,
						xpReward: true,
						timeLimitMinutes: true,
						progress: {
							where: { memberId: member.id },
							select: {
								status: true,
								score: true,
								xpEarned: true,
								startedAt: true,
								completedAt: true,
							},
						},
					},
				},
			},
		});

		if (!curriculum) {
			return NextResponse.json({ message: "No curriculum" }, { status: 404 });
		}

		const channels = await prisma.channel.findMany({
			where: { serverId, externalModuleId: { not: null } },
			select: { id: true, externalModuleId: true, name: true },
		});
		const channelByExternal = new Map(
			channels.map((c) => [c.externalModuleId!, c]),
		);

		const modules = curriculum.modules.map((m) => {
			const progress = m.progress[0] ?? null;
			const channel = m.externalId
				? channelByExternal.get(m.externalId)
				: undefined;
			return {
				id: m.id,
				externalId: m.externalId,
				order: m.order,
				title: m.title,
				xpReward: m.xpReward,
				timeLimitMinutes: m.timeLimitMinutes,
				status: progress?.status ?? "LOCKED",
				score: progress?.score ?? null,
				xpEarned: progress?.xpEarned ?? 0,
				startedAt: progress?.startedAt?.toISOString() ?? null,
				completedAt: progress?.completedAt?.toISOString() ?? null,
				channelId: channel?.id ?? null,
				channelName: channel?.name ?? null,
			};
		});

		let nestProgress: {
			courseScore: number;
			rank: string;
			conceptsCompleted: number;
			conceptsTotal: number;
		} | null = null;

		try {
			const { getToken } = await auth();
			const token = await getToken();
			if (token) {
				const client = createCycyClient({ token });
				const p = await client.getProgress(serverId);
				const completed = p.concepts.filter((c) => c.status === "COMPLETED").length;
				nestProgress = {
					courseScore: p.courseScore,
					rank: p.rank,
					conceptsCompleted: completed,
					conceptsTotal: p.concepts.length,
				};
			}
		} catch {
			// Nest progress optional
		}

		const completedCount = modules.filter((m) => m.status === "COMPLETED").length;

		return NextResponse.json({
			serverId,
			summary: curriculum.summary,
			status: curriculum.status,
			memberXp: member.xp,
			modulesCompleted: completedCount,
			modulesTotal: modules.length,
			modules,
			nestProgress,
		});
	} catch (error) {
		console.error(error, "LEARN ROADMAP ERROR");
		return new NextResponse("Internal Error", { status: 500 });
	}
}
