import { NextResponse } from "next/server";

import { getCachedProgress, setCachedProgress } from "@/lib/cache/redis";
import { cycyErrorResponse, getCycyClient } from "@/lib/cycy/server";

/** GET /api/cycy/progress/:serverId → Cycy learner progress */
export async function GET(
	_req: Request,
	{ params }: { params: Promise<{ serverId: string }> },
) {
	try {
		const { serverId } = await params;
		if (!serverId) {
			return NextResponse.json({ message: "serverId is required" }, { status: 400 });
		}

		const cached = await getCachedProgress(serverId);
		if (cached) {
			return NextResponse.json(cached);
		}

		const client = await getCycyClient();
		const data = await client.getProgress(serverId);
		await setCachedProgress(serverId, data);
		return NextResponse.json(data);
	} catch (error) {
		return cycyErrorResponse(error);
	}
}
