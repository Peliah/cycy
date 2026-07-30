import { NextResponse } from "next/server";

import { CycyApiError } from "@/lib/cycy/client";
import { cycyErrorResponse } from "@/lib/cycy/server";
import { syncCurriculumContentOnce } from "@/lib/learning/sync-curriculum-content-once";

/** GET /api/cycy/servers/:serverId/curriculum/content → Nest full curriculum + channel sync */
export async function GET(
	_req: Request,
	{ params }: { params: Promise<{ serverId: string }> },
) {
	try {
		const { serverId } = await params;
		if (!serverId) {
			return NextResponse.json({ message: "serverId is required" }, { status: 400 });
		}

		const result = await syncCurriculumContentOnce(serverId);

		if (!result.synced) {
			if (result.reason === "not_ready") {
				return NextResponse.json(
					{ status: result.status, message: result.message },
					{ status: 409 },
				);
			}
			if (result.reason === "error") {
				return NextResponse.json(
					{ message: result.message ?? "Content sync failed" },
					{ status: 500 },
				);
			}
			return NextResponse.json({ skipped: true, _sync: { upserted: 0, skipped: 0 } });
		}

		return NextResponse.json({
			...(result.content ?? {}),
			skipped: result.skipped ?? false,
			_sync: { upserted: result.upserted, skipped: 0 },
		});
	} catch (error) {
		if (error instanceof CycyApiError && error.status === 409) {
			return NextResponse.json(error.body ?? { message: error.message }, {
				status: 409,
			});
		}
		return cycyErrorResponse(error);
	}
}
