import type { CurriculumContentResponse } from "@/lib/cycy/types";
import { syncCurriculumContentOnce } from "@/lib/learning/sync-curriculum-content-once";

/** Server-only — import from layouts/route handlers, not client components. */

export type LoadCurriculumContentResult =
	| {
			loaded: true;
			skipped?: boolean;
			content?: CurriculumContentResponse;
			upserted: number;
			modulesUpserted: number;
	  }
	| {
			loaded: false;
			reason: "not_ready" | "error" | "already_synced";
			status?: string;
			message?: string;
	  };

/**
 * Fetch Nest curriculum content, persist modules/quizzes, sync module channels.
 * Skips the Nest round-trip when local modules are already synced (faster roadmap loads).
 */
export async function loadCurriculumContentForServer(
	serverId: string,
): Promise<LoadCurriculumContentResult> {
	const result = await syncCurriculumContentOnce(serverId);

	if (result.synced) {
		return {
			loaded: true,
			skipped: result.skipped,
			content: result.content,
			upserted: result.upserted,
			modulesUpserted: result.modulesUpserted,
		};
	}

	if (result.reason === "not_ready") {
		return {
			loaded: false,
			reason: "not_ready",
			status: result.status,
			message: result.message,
		};
	}

	return {
		loaded: false,
		reason: result.reason === "already_synced" ? "already_synced" : "error",
		message: result.message,
	};
}
