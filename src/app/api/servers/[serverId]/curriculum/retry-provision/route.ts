import { NextResponse } from "next/server";
import { CurriculumStatus } from "@prisma/client";

import { getApiProfile } from "@/lib/api-auth";
import { invalidateServerLearningCache } from "@/lib/cache/redis";
import {
	BackendInternalError,
	enqueueEnrichInternal,
	provisionTemplateInternal,
} from "@/lib/cycy/backend-internal";
import { prisma } from "@/lib/prismadb";

/** POST /api/servers/:serverId/curriculum/retry-provision — FAILED legacy servers only */
export async function POST(
	_req: Request,
	{ params }: { params: Promise<{ serverId: string }> },
) {
	try {
		const profile = await getApiProfile();
		if (!profile) {
			return new NextResponse("Unauthorized", { status: 401 });
		}

		const { serverId } = await params;
		const member = await prisma.member.findFirst({
			where: { serverId, profileId: profile.id, role: "ADMIN" },
			select: { id: true },
		});
		if (!member) {
			return new NextResponse("Forbidden", { status: 403 });
		}

		const curriculum = await prisma.curriculum.findUnique({
			where: { serverId },
			select: { status: true },
		});
		if (!curriculum) {
			return NextResponse.json({ message: "No curriculum" }, { status: 404 });
		}
		if (curriculum.status === CurriculumStatus.READY) {
			return NextResponse.json({ message: "Already ready" }, { status: 409 });
		}

		const provision = await provisionTemplateInternal(serverId);

		await prisma.curriculum.update({
			where: { serverId },
			data: {
				status: CurriculumStatus.READY,
				bootstrapPhase: null,
				summary: provision.summary,
				contentVersion: provision.contentVersion ?? 1,
			},
		});

		await invalidateServerLearningCache(serverId);
		enqueueEnrichInternal(serverId);

		return NextResponse.json({
			status: CurriculumStatus.READY,
			contentVersion: provision.contentVersion ?? 1,
		});
	} catch (error) {
		console.error(error, "RETRY PROVISION ERROR");
		const message =
			error instanceof BackendInternalError
				? error.message
				: "Could not provision curriculum";
		return NextResponse.json({ message }, { status: 502 });
	}
}
