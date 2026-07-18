import { NextResponse } from "next/server";

import { CycyApiError } from "@/lib/cycy/client";
import { cycyErrorResponse, getCycyClient } from "@/lib/cycy/server";
import { syncModuleChannels } from "@/lib/learning/sync-module-channels";
import { prisma } from "@/lib/prismadb";
import { getCurrentProfile } from "@/lib/query";

/** POST /api/servers/:serverId/sync-modules — upsert module channels from Nest curriculum */
export async function POST(
	_req: Request,
	{ params }: { params: Promise<{ serverId: string }> },
) {
	try {
		const profile = await getCurrentProfile();
		if (!profile || !("id" in profile)) {
			return new NextResponse("Unauthorized", { status: 401 });
		}

		const { serverId } = await params;
		if (!serverId) {
			return NextResponse.json({ message: "serverId is required" }, { status: 400 });
		}

		const membership = await prisma.member.findFirst({
			where: { serverId, profileId: profile.id },
			select: { id: true },
		});
		if (!membership) {
			return new NextResponse("Forbidden", { status: 403 });
		}

		const client = await getCycyClient();
		// Prefer full /curriculum/content so Nest content endpoint is always used.
		const curriculum = await client.getCurriculumContent(serverId);

		const { upserted, skipped } = await syncModuleChannels(
			serverId,
			curriculum.modules,
		);

		await prisma.curriculum.updateMany({
			where: { serverId },
			data: {
				status: "READY",
				...(curriculum.summary ? { summary: curriculum.summary } : {}),
			},
		});

		return NextResponse.json({
			synced: true,
			status: curriculum.status,
			upserted,
			skipped,
			moduleCount: Array.isArray(curriculum.modules)
				? curriculum.modules.length
				: 0,
			source: "curriculum/content",
		});
	} catch (error) {
		if (error instanceof CycyApiError) {
			if (error.status === 409) {
				return NextResponse.json(
					{
						synced: false,
						...(typeof error.body === "object" && error.body !== null
							? error.body
							: { message: error.message }),
					},
					{ status: 409 },
				);
			}
			return cycyErrorResponse(error);
		}

		console.error(error, "SYNC MODULES ERROR");
		const message =
			error instanceof Error ? error.message : "Failed to sync module channels";
		return NextResponse.json({ message }, { status: 500 });
	}
}
