import { ModuleProgressStatus } from "@prisma/client";
import { NextResponse } from "next/server";

import { ensureMemberModuleProgress } from "@/lib/learning/module-progress";
import { prisma } from "@/lib/prismadb";
import { getCurrentProfile } from "@/lib/query";
import type { ConceptContent } from "@/lib/cycy/types";

/** GET module study payload; starts IN_PROGRESS when AVAILABLE */
export async function GET(
	_req: Request,
	{ params }: { params: Promise<{ serverId: string; moduleId: string }> },
) {
	try {
		const profile = await getCurrentProfile();
		if (!profile || !("id" in profile)) {
			return new NextResponse("Unauthorized", { status: 401 });
		}

		const { serverId, moduleId } = await params;
		const member = await prisma.member.findFirst({
			where: { serverId, profileId: profile.id },
			select: { id: true },
		});
		if (!member) {
			return new NextResponse("Forbidden", { status: 403 });
		}

		await ensureMemberModuleProgress(serverId, member.id);

		const mod = await prisma.module.findFirst({
			where: {
				id: moduleId,
				curriculum: { serverId },
			},
			include: {
				quiz: {
					select: {
						id: true,
						title: true,
						passScore: true,
						_count: { select: { questions: true } },
					},
				},
				progress: {
					where: { memberId: member.id },
					take: 1,
				},
			},
		});

		if (!mod) {
			return NextResponse.json({ message: "Module not found" }, { status: 404 });
		}

		let progress = mod.progress[0] ?? null;

		if (
			progress &&
			(progress.status === ModuleProgressStatus.AVAILABLE ||
				progress.status === ModuleProgressStatus.IN_PROGRESS)
		) {
			progress = await prisma.moduleProgress.update({
				where: { id: progress.id },
				data: {
					status: ModuleProgressStatus.IN_PROGRESS,
					startedAt: progress.startedAt ?? new Date(),
				},
			});

			if (mod.externalId) {
				await prisma.channel.updateMany({
					where: { serverId, externalModuleId: mod.externalId },
					data: { moduleStatus: ModuleProgressStatus.IN_PROGRESS },
				});
			}
		}

		const server = await prisma.server.findUnique({
			where: { id: serverId },
			select: { agentHandle: true },
		});

		return NextResponse.json({
			id: mod.id,
			externalId: mod.externalId,
			order: mod.order,
			title: mod.title,
			content: mod.content,
			concepts: (mod.conceptsJson as ConceptContent[] | null) ?? [],
			xpReward: mod.xpReward,
			timeLimitMinutes: mod.timeLimitMinutes,
			status: progress?.status ?? ModuleProgressStatus.LOCKED,
			startedAt: progress?.startedAt?.toISOString() ?? null,
			quiz: mod.quiz
				? {
						id: mod.quiz.id,
						title: mod.quiz.title,
						passScore: mod.quiz.passScore,
						questionCount: mod.quiz._count.questions,
					}
				: null,
			agentHandle: server?.agentHandle ?? null,
		});
	} catch (error) {
		console.error(error, "LEARN MODULE GET ERROR");
		return new NextResponse("Internal Error", { status: 500 });
	}
}
