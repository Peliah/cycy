import { NextResponse } from "next/server";

import { CycyApiError } from "@/lib/cycy/client";
import { cycyErrorResponse, getCycyClient } from "@/lib/cycy/server";
import { syncModuleChannels } from "@/lib/learning/sync-module-channels";
import { prisma } from "@/lib/prismadb";

/** GET /api/cycy/servers/:serverId/curriculum/content → Nest full curriculum + channel sync */
export async function GET(
	_req: Request,
	{ params }: { params: Promise<{ serverId: string }> },
) {
	try {
		const { serverId } = await params;
		if (!serverId) {
			return NextResponse.json({ message: "serverId is required" }, { status: 400 });
		}

		const client = await getCycyClient();
		const data = await client.getCurriculumContent(serverId);

		await prisma.curriculum.updateMany({
			where: { serverId },
			data: {
				status: "READY",
				...(data.summary ? { summary: data.summary } : {}),
			},
		});

		const { upserted, skipped } = await syncModuleChannels(
			serverId,
			data.modules,
		);

		return NextResponse.json({
			...data,
			_sync: { upserted, skipped },
		});
	} catch (error) {
		if (error instanceof CycyApiError && error.status === 409) {
			return NextResponse.json(error.body ?? { message: error.message }, {
				status: 409,
			});
		}
		return cycyErrorResponse(error);
	}
}
