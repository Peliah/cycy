import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { createCycyClient, CycyApiError } from "@/lib/cycy/client";

/** Server-only helpers — import from `@/lib/cycy/server`, not from client components. */

/** Authenticated Cycy client using the current Clerk session JWT. */
export async function getCycyClient() {
	const { getToken, userId } = await auth();
	if (!userId) {
		throw new CycyApiError("Unauthorized", 401, null);
	}

	const token = await getToken();
	if (!token) {
		throw new CycyApiError("Missing Clerk session token", 401, null);
	}

	return createCycyClient({ token });
}

/** Map Cycy client errors to Next.js responses for BFF routes. */
export function cycyErrorResponse(error: unknown) {
	if (error instanceof CycyApiError) {
		if (error.body !== null && error.body !== undefined) {
			return NextResponse.json(error.body, { status: error.status });
		}
		return NextResponse.json({ message: error.message }, { status: error.status });
	}

	console.error(error, "CYCY API ERROR");
	return new NextResponse("Internal Error", { status: 500 });
}
