import { NextResponse } from "next/server";
import { CurriculumStatus } from "@prisma/client";

import {
	getCachedReadyCurriculum,
	setCachedReadyCurriculum,
} from "@/lib/cache/redis";
import { cycyErrorResponse, getCycyClient } from "@/lib/cycy/server";
import type { CurriculumLifecycleStatus } from "@/lib/cycy/types";
import { syncModuleChannels } from "@/lib/learning/sync-module-channels";
import { prisma } from "@/lib/prismadb";

function toPrismaStatus(status: CurriculumLifecycleStatus): CurriculumStatus {
	switch (status) {
		case "PENDING":
			return CurriculumStatus.PENDING;
		case "GENERATING":
			return CurriculumStatus.GENERATING;
		case "READY":
			return CurriculumStatus.READY;
		case "FAILED":
			return CurriculumStatus.FAILED;
		default:
			return CurriculumStatus.PENDING;
	}
}

async function mirrorReadyCurriculum(
	serverId: string,
	status: CurriculumLifecycleStatus,
	summary: string | null,
	modules: Parameters<typeof syncModuleChannels>[1],
) {
	await prisma.curriculum
		.updateMany({
			where: { serverId },
			data: {
				status: toPrismaStatus(status),
				...(summary ? { summary } : {}),
			},
		})
		.catch((error) => {
			console.error(error, "CURRICULUM LOCAL SYNC ERROR");
		});

	if (status !== "READY") return;

	try {
		await syncModuleChannels(serverId, modules);
	} catch (error) {
		console.error(error, "MODULE CHANNEL SYNC ERROR");
	}
}

/** GET /api/cycy/servers/:serverId/curriculum → Cycy curriculum status */
export async function GET(
	_req: Request,
	{ params }: { params: Promise<{ serverId: string }> },
) {
	try {
		const { serverId } = await params;
		if (!serverId) {
			return NextResponse.json({ message: "serverId is required" }, { status: 400 });
		}

		const cached = await getCachedReadyCurriculum(serverId);
		if (cached) {
			await mirrorReadyCurriculum(
				serverId,
				cached.status,
				cached.summary,
				cached.modules,
			);
			return NextResponse.json(cached);
		}

		const client = await getCycyClient();
		const data = await client.getCurriculum(serverId);

		await mirrorReadyCurriculum(
			serverId,
			data.status,
			data.summary,
			data.modules,
		);

		if (data.status === "READY") {
			await setCachedReadyCurriculum(serverId, data);
		}

		return NextResponse.json(data);
	} catch (error) {
		return cycyErrorResponse(error);
	}
}
