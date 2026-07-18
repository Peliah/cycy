import { cycyApi } from "@/lib/cycy/browser";
import type {
	BootstrapResponse,
	BootstrapResult,
	CurriculumLifecycleStatus,
	CurriculumStatusResponse,
} from "@/lib/cycy/types";

export function isTerminalCurriculumStatus(
	status: CurriculumLifecycleStatus,
): boolean {
	return status === "READY" || status === "FAILED";
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
		const message =
			body &&
			typeof body === "object" &&
			"message" in body &&
			typeof (body as { message: unknown }).message === "string"
				? (body as { message: string }).message
				: `Curriculum request failed (${response.status})`;
		throw new Error(message);
	}
	return body as CurriculumStatusResponse;
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
	onUpdate?: (data: CurriculumStatusResponse) => void;
};

/** Poll until READY/FAILED, timeout, or abort. Stops when terminal. */
export async function pollCurriculum(
	serverId: string,
	options: PollCurriculumOptions = {},
): Promise<CurriculumStatusResponse> {
	const intervalMs = options.intervalMs ?? 5000;
	const timeoutMs = options.timeoutMs ?? 5 * 60_000;
	const started = Date.now();

	let latest = await fetchCurriculum(serverId);
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
		latest = await fetchCurriculum(serverId);
		options.onUpdate?.(latest);
	}

	return latest;
}
