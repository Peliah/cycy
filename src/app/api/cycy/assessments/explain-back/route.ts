import { NextResponse } from "next/server";

import type { ExplainBackBody } from "@/lib/cycy";
import { cycyErrorResponse, getCycyClient } from "@/lib/cycy/server";

/** POST /api/cycy/assessments/explain-back → Cycy explain-back grading */
export async function POST(req: Request) {
	try {
		const body = (await req.json()) as ExplainBackBody;
		if (
			!body?.conversationId ||
			!body?.serverId ||
			!body?.conceptId ||
			!body?.answer
		) {
			return NextResponse.json(
				{
					message: "conversationId, serverId, conceptId, and answer are required",
				},
				{ status: 400 },
			);
		}

		const client = await getCycyClient();
		const data = await client.submitExplainBack(body);
		return NextResponse.json(data);
	} catch (error) {
		return cycyErrorResponse(error);
	}
}
