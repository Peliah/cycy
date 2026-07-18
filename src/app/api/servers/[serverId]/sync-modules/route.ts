import { NextResponse } from "next/server";

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
		const curriculum = await client.getCurriculum(serverId);

		if (curriculum.status !== "READY") {
			return NextResponse.json({
				synced: false,
				status: curriculum.status,
				upserted: 0,
			});
		}

		const { upserted } = await syncModuleChannels(serverId, curriculum.modules);

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
		});
	} catch (error) {
		return cycyErrorResponse(error);
	}
}
