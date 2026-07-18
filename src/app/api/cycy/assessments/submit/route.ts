import { NextResponse } from "next/server";

import type { SubmitAssessmentBody } from "@/lib/cycy";
import { cycyErrorResponse, getCycyClient } from "@/lib/cycy/server";

/** POST /api/cycy/assessments/submit → Cycy submit assessment */
export async function POST(req: Request) {
	try {
		const body = (await req.json()) as SubmitAssessmentBody;
		if (
			!body?.conversationId ||
			!body?.serverId ||
			!body?.questionId ||
			!body?.questionType ||
			!body?.answer
		) {
			return NextResponse.json(
				{
					message:
						"conversationId, serverId, questionId, questionType, and answer are required",
				},
				{ status: 400 },
			);
		}

		const client = await getCycyClient();
		const data = await client.submitAssessment(body);
		return NextResponse.json(data);
	} catch (error) {
		return cycyErrorResponse(error);
	}
}
