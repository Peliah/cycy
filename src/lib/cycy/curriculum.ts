import { cycyApi } from "@/lib/cycy/browser";
import type {
	BootstrapResponse,
	BootstrapResult,
	CurriculumContentResponse,
	CurriculumLifecycleStatus,
	CurriculumStatusResponse,
} from "@/lib/cycy/types";

export type LocalCurriculumStatus = {
	serverId: string;
	status: CurriculumLifecycleStatus;
	summary: string | null;
	bootstrapPhase: string | null;
	contentVersion: number;
	updatedAt: string;
	recoveredFromStale?: boolean;
};

export function isTerminalCurriculumStatus(
	status: CurriculumLifecycleStatus,
): boolean {
	return status === "READY" || status === "FAILED";
}

function errorMessageFromBody(body: unknown, fallback: string): string {
	if (
		body &&
		typeof body === "object" &&
		"message" in body &&
		typeof (body as { message: unknown }).message === "string"
	) {
		return (body as { message: string }).message;
	}
	return fallback;
}

/** Local DB status — no Nest round-trip (shared Neon Curriculum row). */
export async function fetchLocalCurriculumStatus(
	serverId: string,
): Promise<LocalCurriculumStatus> {
	const response = await fetch(cycyApi.curriculumStatusLocal(serverId), {
		method: "GET",
		credentials: "include",
	});
	const body: unknown = await response.json().catch(() => null);
	if (!response.ok) {
		throw new Error(
			errorMessageFromBody(
				body,
				`Curriculum status request failed (${response.status})`,
			),
		);
	}
	return body as LocalCurriculumStatus;
}

export async function fetchCurriculum(
	serverId: string,
): Promise<CurriculumStatusResponse> {
	const response = await fetch(cycyApi.curriculum(serverId), {
		method: "GET",
		credentials: "include",
	});
	const body: unknown = await response.json().catch(() => null);
	if (!response.ok) {
		throw new Error(
			errorMessageFromBody(
				body,
				`Curriculum request failed (${response.status})`,
			),
		);
	}
	return body as CurriculumStatusResponse;
}

/** Poll local DB while bootstrap is in progress; Nest BFF when terminal details needed. */
export async function fetchCurriculumStatusForPoll(
	serverId: string,
	status: CurriculumLifecycleStatus,
): Promise<LocalCurriculumStatus | CurriculumStatusResponse> {
	if (isTerminalCurriculumStatus(status)) {
		return fetchCurriculum(serverId);
	}
	return fetchLocalCurriculumStatus(serverId);
}

/** Full Nest curriculum content (modules/concepts). Visible in browser Network as /curriculum/content */
export async function fetchCurriculumContent(
	serverId: string,
): Promise<CurriculumContentResponse | null> {
	const response = await fetch(cycyApi.curriculumContent(serverId), {
		method: "GET",
		credentials: "include",
	});
	const body: unknown = await response.json().catch(() => null);

	// Not ready yet — caller can keep polling status.
	if (response.status === 409) return null;

	if (!response.ok) {
		throw new Error(
			errorMessageFromBody(
				body,
				`Curriculum content request failed (${response.status})`,
			),
		);
	}
	return body as CurriculumContentResponse;
}

export async function bootstrapCurriculumRequest(
	serverId: string,
): Promise<BootstrapResponse | BootstrapResult> {
	const response = await fetch(cycyApi.bootstrap(serverId), {
		method: "POST",
		credentials: "include",
	});
	const body: unknown = await response.json().catch(() => null);
	if (!response.ok) {
		const message =
			body &&
			typeof body === "object" &&
			"message" in body &&
			typeof (body as { message: unknown }).message === "string"
				? (body as { message: string }).message
				: `Bootstrap failed (${response.status})`;
		throw new Error(message);
	}
	return body as BootstrapResponse | BootstrapResult;
}

export type PollCurriculumOptions = {
	intervalMs?: number;
	timeoutMs?: number;
	signal?: AbortSignal;
	onUpdate?: (data: LocalCurriculumStatus) => void;
};

/** Poll local status until READY/FAILED, timeout, or abort. */
export async function pollCurriculum(
	serverId: string,
	options: PollCurriculumOptions = {},
): Promise<LocalCurriculumStatus> {
	const intervalMs = options.intervalMs ?? 10_000;
	const timeoutMs = options.timeoutMs ?? 5 * 60_000;
	const started = Date.now();

	let latest = await fetchLocalCurriculumStatus(serverId);
	options.onUpdate?.(latest);

	while (!isTerminalCurriculumStatus(latest.status)) {
		if (options.signal?.aborted) {
			throw new DOMException("Aborted", "AbortError");
		}
		if (Date.now() - started >= timeoutMs) {
			return latest;
		}
		await new Promise<void>((resolve, reject) => {
			const timer = window.setTimeout(() => resolve(), intervalMs);
			options.signal?.addEventListener(
				"abort",
				() => {
					window.clearTimeout(timer);
					reject(new DOMException("Aborted", "AbortError"));
				},
				{ once: true },
			);
		});
		latest = await fetchLocalCurriculumStatus(serverId);
		options.onUpdate?.(latest);
	}

	return latest;
}

async function revalidateServerLayout(serverId: string): Promise<void> {
	await fetch(`/api/servers/${serverId}/revalidate`, { method: "POST" });
}

/** Sync Nest content once and refresh server layout (deduped on server). */
export async function syncCurriculumContentClient(
	serverId: string,
): Promise<boolean> {
	try {
		const res = await fetch(cycyApi.curriculumContent(serverId), {
			method: "GET",
			credentials: "include",
		});
		if (res.status === 409) return false;
		if (!res.ok) {
			throw new Error(`Curriculum content sync failed (${res.status})`);
		}
		await revalidateServerLayout(serverId);
		return true;
	} catch (error) {
		console.error(error, "CURRICULUM CONTENT CLIENT ERROR");
		return false;
	}
}
