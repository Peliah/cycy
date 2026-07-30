import type { CurriculumContentResponse } from "@/lib/cycy/types";
import { persistCurriculumContent } from "@/lib/learning/persist-curriculum-content";
import { syncModuleChannels } from "@/lib/learning/sync-module-channels";
import { prisma } from "@/lib/prismadb";

/** Server-only — legacy fallback when old servers lack provisioned externalId. */

export type SyncCurriculumContentResult =
	| {
			synced: true;
			skipped?: boolean;
			content?: CurriculumContentResponse;
			upserted: number;
			modulesUpserted: number;
	  }
	| {
			synced: false;
			reason: "not_ready" | "error" | "already_synced";
			status?: string;
			message?: string;
	  };

const inFlight = new Map<string, Promise<SyncCurriculumContentResult>>();

async function isCurriculumAlreadyProvisioned(serverId: string): Promise<boolean> {
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

/** Legacy Nest mirror — skipped when shell-first provision already wrote externalId + channels. */
export async function syncCurriculumContentOnce(
	serverId: string,
): Promise<SyncCurriculumContentResult> {
	if (await isCurriculumAlreadyProvisioned(serverId)) {
		return {
			synced: true,
			skipped: true,
			upserted: 0,
			modulesUpserted: 0,
		};
	}

	const existing = inFlight.get(serverId);
	if (existing) return existing;

	const promise = runLegacySync(serverId).finally(() => {
		inFlight.delete(serverId);
	});
	inFlight.set(serverId, promise);
	return promise;
}

async function runLegacySync(serverId: string): Promise<SyncCurriculumContentResult> {
	try {
		const { getCycyClient } = await import("@/lib/cycy/server");
		const { CycyApiError } = await import("@/lib/cycy/client");
		const client = await getCycyClient();
		const content = await client.getCurriculumContent(serverId);

		await prisma.curriculum.updateMany({
			where: { serverId },
			data: {
				status: "READY",
				bootstrapPhase: null,
				...(content.summary ? { summary: content.summary } : {}),
			},
		});

		const { modulesUpserted } = await persistCurriculumContent(serverId, content);
		const { upserted } = await syncModuleChannels(serverId, content.modules);

		return {
			synced: true,
			content,
			upserted,
			modulesUpserted,
			skipped: false,
		};
	} catch (error) {
		const { CycyApiError } = await import("@/lib/cycy/client");
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

			return { synced: false, reason: "not_ready", status, message };
		}

		console.error(error, "LEGACY SYNC CURRICULUM CONTENT ERROR");
		return {
			synced: false,
			reason: "error",
			message: error instanceof Error ? error.message : "Unknown error",
		};
	}
}
