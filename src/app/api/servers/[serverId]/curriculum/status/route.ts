import { CurriculumStatus } from "@prisma/client";
import { NextResponse } from "next/server";

import { getApiProfile } from "@/lib/api-auth";
import { isStaleBootstrap } from "@/lib/learning/bootstrap-stale";
import type { CurriculumLifecycleStatus } from "@/lib/cycy/types";
import { prisma } from "@/lib/prismadb";

export type LocalCurriculumStatusResponse = {
	serverId: string;
	status: CurriculumLifecycleStatus;
	summary: string | null;
	bootstrapPhase: string | null;
	contentVersion: number;
	updatedAt: string;
	recoveredFromStale?: boolean;
};

/** GET /api/servers/:serverId/curriculum/status — local DB only (no Nest hop). */
export async function GET(
	_req: Request,
	{ params }: { params: Promise<{ serverId: string }> },
) {
	try {
		const profile = await getApiProfile();
		if (!profile) {
			return new NextResponse("Unauthorized", { status: 401 });
		}

		const { serverId } = await params;
		if (!serverId) {
			return NextResponse.json({ message: "serverId is required" }, { status: 400 });
		}

		const membership = await prisma.member.findFirst({
			where: { serverId, profileId: profile.id },
			select: {
				server: {
					select: {
						curriculum: {
							select: {
								status: true,
								summary: true,
								bootstrapPhase: true,
								contentVersion: true,
								updatedAt: true,
							},
						},
					},
				},
			},
		});

		if (!membership) {
			return new NextResponse("Forbidden", { status: 403 });
		}

		let curriculum = membership.server.curriculum;
		if (!curriculum) {
			return NextResponse.json({ message: "No curriculum" }, { status: 404 });
		}

		let recoveredFromStale = false;
		if (
			curriculum.status === CurriculumStatus.GENERATING &&
			isStaleBootstrap(curriculum.updatedAt)
		) {
			curriculum = await prisma.curriculum.update({
				where: { serverId },
				data: {
					status: CurriculumStatus.FAILED,
					bootstrapPhase: null,
				},
				select: {
					status: true,
					summary: true,
					bootstrapPhase: true,
					contentVersion: true,
					updatedAt: true,
				},
			});
			recoveredFromStale = true;
		}

		const payload: LocalCurriculumStatusResponse = {
			serverId,
			status: curriculum.status as CurriculumLifecycleStatus,
			summary: curriculum.summary,
			bootstrapPhase: curriculum.bootstrapPhase,
			contentVersion: curriculum.contentVersion,
			updatedAt: curriculum.updatedAt.toISOString(),
			...(recoveredFromStale ? { recoveredFromStale: true } : {}),
		};

		return NextResponse.json(payload);
	} catch (error) {
		console.error(error, "LOCAL CURRICULUM STATUS ERROR");
		return new NextResponse("Internal Error", { status: 500 });
	}
}
