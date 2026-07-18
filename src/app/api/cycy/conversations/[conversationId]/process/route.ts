import { NextResponse } from "next/server";

import type { ProcessMessageBody } from "@/lib/cycy";
import { cycyErrorResponse, getCycyClient } from "@/lib/cycy/server";

/** POST /api/cycy/conversations/:conversationId/process → Cycy process message */
export async function POST(
	req: Request,
	{ params }: { params: Promise<{ conversationId: string }> },
) {
	try {
		const { conversationId } = await params;
		if (!conversationId) {
			return NextResponse.json(
				{ message: "conversationId is required" },
				{ status: 400 },
			);
		}

		const body = (await req.json()) as ProcessMessageBody;
		if (!body?.serverId || !body?.memberId || !body?.message?.content) {
			return NextResponse.json(
				{ message: "serverId, memberId, and message.content are required" },
				{ status: 400 },
			);
		}

		const client = await getCycyClient();
		const data = await client.processMessage(conversationId, body);
		return NextResponse.json(data, { status: 202 });
	} catch (error) {
		return cycyErrorResponse(error);
	}
}
