import { NextResponse } from "next/server";

import { cycyErrorResponse, getCycyClient } from "@/lib/cycy/server";

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

		const client = await getCycyClient();
		const data = await client.bootstrapCurriculum(serverId);
		const status = "status" in data && data.status === "generating" ? 202 : 200;
		return NextResponse.json(data, { status });
	} catch (error) {
		return cycyErrorResponse(error);
	}
}
