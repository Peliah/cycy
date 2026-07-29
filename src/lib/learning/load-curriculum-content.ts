import { CycyApiError } from "@/lib/cycy/client";
import { getCycyClient } from "@/lib/cycy/server";
import type { CurriculumContentResponse } from "@/lib/cycy/types";
import { persistCurriculumContent } from "@/lib/learning/persist-curriculum-content";
import { syncModuleChannels } from "@/lib/learning/sync-module-channels";
import { prisma } from "@/lib/prismadb";

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

async function isCurriculumAlreadySynced(serverId: string): Promise<boolean> {
	const curriculum = await prisma.curriculum.findUnique({
		where: { serverId },
		select: {
			status: true,
			modules: { select: { externalId: true } },
		},
	});
	if (curriculum?.status !== "READY" || curriculum.modules.length === 0) {
		return false;
	}
	return curriculum.modules.every((module) => Boolean(module.externalId));
}

/**
 * Fetch Nest curriculum content, persist modules/quizzes, sync module channels.
 * Skips the Nest round-trip when local modules are already synced (faster roadmap loads).
 */
export async function loadCurriculumContentForServer(
	serverId: string,
): Promise<LoadCurriculumContentResult> {
	if (await isCurriculumAlreadySynced(serverId)) {
		return {
			loaded: true,
			skipped: true,
			upserted: 0,
			modulesUpserted: 0,
		};
	}

	try {
		console.info(
			`[curriculum/content] fetching Nest content for server ${serverId}`,
		);
		const client = await getCycyClient();
		const content = await client.getCurriculumContent(serverId);

		await prisma.curriculum.updateMany({
			where: { serverId },
			data: {
				status: "READY",
				...(content.summary ? { summary: content.summary } : {}),
			},
		});

		const { modulesUpserted } = await persistCurriculumContent(
			serverId,
			content,
		);
		const { upserted } = await syncModuleChannels(serverId, content.modules);

		console.info(
			`[curriculum/content] modules=${modulesUpserted} channels=${upserted}`,
		);

		return { loaded: true, content, upserted, modulesUpserted, skipped: false };
	} catch (error) {
		if (error instanceof CycyApiError && error.status === 409) {
			const body = error.body;
			const status =
				body &&
				typeof body === "object" &&
				"status" in body &&
				typeof (body as { status: unknown }).status === "string"
					? (body as { status: string }).status
					: undefined;
			const message =
				body &&
				typeof body === "object" &&
				"message" in body &&
				typeof (body as { message: unknown }).message === "string"
					? (body as { message: string }).message
					: error.message;

			return { loaded: false, reason: "not_ready", status, message };
		}

		console.error(error, "LOAD CURRICULUM CONTENT ERROR");
		return {
			loaded: false,
			reason: "error",
			message: error instanceof Error ? error.message : "Unknown error",
		};
	}
}
