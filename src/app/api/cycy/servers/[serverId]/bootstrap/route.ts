import { NextResponse } from "next/server";
import { CurriculumStatus } from "@prisma/client";

import { invalidateServerLearningCache } from "@/lib/cache/redis";
import { cycyErrorResponse, getCycyClient } from "@/lib/cycy/server";
import { prisma } from "@/lib/prismadb";

/** POST /api/cycy/servers/:serverId/bootstrap → Cycy bootstrap */
export async function POST(
	_req: Request,
	{ params }: { params: Promise<{ serverId: string }> },
) {
	try {
		const { serverId } = await params;
		if (!serverId) {
			return NextResponse.json({ message: "serverId is required" }, { status: 400 });
		}

		await invalidateServerLearningCache(serverId);

		const client = await getCycyClient();
		const data = await client.bootstrapCurriculum(serverId);
		const status =
			"status" in data && data.status === "generating" ? 202 : 200;

		const localStatus =
			status === 202
				? CurriculumStatus.GENERATING
				: CurriculumStatus.READY;

		await prisma.curriculum
			.updateMany({
				where: { serverId },
				data: {
					status: localStatus,
					...("summary" in data && typeof data.summary === "string"
						? { summary: data.summary }
						: {}),
				},
			})
			.catch((error) => {
				console.error(error, "BOOTSTRAP LOCAL CURRICULUM SYNC ERROR");
			});

		return NextResponse.json(data, { status });
	} catch (error) {
		return cycyErrorResponse(error);
	}
}
