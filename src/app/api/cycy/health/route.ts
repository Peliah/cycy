import { NextResponse } from "next/server";

import { createCycyClient, CycyApiError } from "@/lib/cycy";
import { cycyErrorResponse } from "@/lib/cycy/server";

/** GET /api/cycy/health → Cycy GET /api/v1/health */
export async function GET() {
	try {
		const client = createCycyClient();
		const data = await client.health();
		return NextResponse.json(data);
	} catch (error) {
		if (error instanceof Error && !(error instanceof CycyApiError)) {
			console.error(error, "CYCY HEALTH CONFIG ERROR");
			return NextResponse.json({ message: error.message }, { status: 500 });
		}
		return cycyErrorResponse(error);
	}
}
