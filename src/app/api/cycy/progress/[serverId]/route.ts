import { NextResponse } from "next/server";

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

		const client = await getCycyClient();
		const data = await client.getProgress(serverId);
		return NextResponse.json(data);
	} catch (error) {
		return cycyErrorResponse(error);
	}
}
