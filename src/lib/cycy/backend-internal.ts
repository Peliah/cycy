/** Server-only — internal Nest calls without Clerk JWT. */

function resolveBackendBaseUrl(): string {
	const base =
		process.env.CYCY_API_URL ??
		process.env.NEXT_PUBLIC_CYCY_API_URL ??
		"http://localhost:4000";
	return base.replace(/\/$/, "");
}

function internalSecret(): string {
	const secret =
		process.env.CYCY_INTERNAL_SECRET ??
		process.env.CYCY_INTERNAL_WEBHOOK_SECRET;
	if (!secret) {
		throw new Error("CYCY_INTERNAL_SECRET is not configured");
	}
	return secret;
}

export class BackendInternalError extends Error {
	readonly status: number;
	readonly body: unknown;

	constructor(message: string, status: number, body: unknown) {
		super(message);
		this.name = "BackendInternalError";
		this.status = status;
		this.body = body;
	}
}

export type ProvisionTemplateResult = {
	curriculumId: string;
	moduleCount: number;
	conceptCount: number;
	goalCriteria: string[];
	summary: string;
	contentVersion?: number;
};

async function internalPost<T>(path: string): Promise<T> {
	const response = await fetch(`${resolveBackendBaseUrl()}/api/v1${path}`, {
		method: "POST",
		headers: {
			"X-Internal-Secret": internalSecret(),
		},
	});

	const body: unknown = await response.json().catch(() => null);
	if (!response.ok) {
		const message =
			body &&
			typeof body === "object" &&
			"message" in body &&
			typeof (body as { message: unknown }).message === "string"
				? (body as { message: string }).message
				: `Backend internal request failed (${response.status})`;
		throw new BackendInternalError(message, response.status, body);
	}

	return body as T;
}

/** Synchronous template shell (~1–2s). Retries briefly for Neon read-after-write lag. */
export async function provisionTemplateInternal(
	serverId: string,
): Promise<ProvisionTemplateResult> {
	const maxAttempts = 4;
	let lastError: unknown;

	for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
		try {
			return await internalPost<ProvisionTemplateResult>(
				`/internal/servers/${serverId}/provision-template`,
			);
		} catch (error) {
			lastError = error;
			const retryable =
				error instanceof BackendInternalError &&
				(error.status === 400 || error.status === 500) &&
				attempt < maxAttempts - 1;
			if (!retryable) throw error;
			await new Promise((resolve) => setTimeout(resolve, 400 * (attempt + 1)));
		}
	}

	throw lastError;
}

/** Fire-and-forget AI enrich — do not await in onboarding critical path. */
export function enqueueEnrichInternal(serverId: string): void {
	const url = `${resolveBackendBaseUrl()}/api/v1/internal/servers/${serverId}/enrich`;
	void fetch(url, {
		method: "POST",
		headers: {
			"X-Internal-Secret": internalSecret(),
		},
	}).catch((error) => {
		console.error(error, "ENQUEUE ENRICH ERROR");
	});
}
