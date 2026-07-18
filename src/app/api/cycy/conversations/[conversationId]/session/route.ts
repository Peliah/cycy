import { NextRequest, NextResponse } from "next/server";

import { cycyErrorResponse, getCycyClient } from "@/lib/cycy/server";

/** GET /api/cycy/conversations/:conversationId/session?serverId= → Cycy session */
export async function GET(
	req: NextRequest,
	{ params }: { params: Promise<{ conversationId: string }> },
) {
	try {
		const { conversationId } = await params;
		const serverId = req.nextUrl.searchParams.get("serverId");

		if (!conversationId) {
			return NextResponse.json(
				{ message: "conversationId is required" },
				{ status: 400 },
			);
		}
		if (!serverId) {
			return NextResponse.json({ message: "serverId is required" }, { status: 400 });
		}

		const client = await getCycyClient();
		const data = await client.getSession(conversationId, serverId);
		return NextResponse.json(data);
	} catch (error) {
		return cycyErrorResponse(error);
	}
}
