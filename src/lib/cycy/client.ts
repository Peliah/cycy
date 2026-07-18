import type {
	BootstrapResponse,
	BootstrapResult,
	ConversationSessionResponse,
	CourseConceptsResponse,
	CurriculumContentResponse,
	CurriculumStatusResponse,
	ExplainBackBody,
	ExplainBackResponse,
	HealthResponse,
	ProcessMessageBody,
	ProcessMessageResponse,
	ProgressResponse,
	SubmitAssessmentBody,
	SubmitAssessmentResponse,
} from "@/lib/cycy/types";

export class CycyApiError extends Error {
	readonly status: number;
	readonly body: unknown;

	constructor(message: string, status: number, body: unknown) {
		super(message);
		this.name = "CycyApiError";
		this.status = status;
		this.body = body;
	}
}

export type CycyClientOptions = {
	/** Clerk session JWT. Omit only for public endpoints like health. */
	token?: string | null;
	baseUrl?: string;
	fetch?: typeof fetch;
};

function resolveBaseUrl(explicit?: string): string {
	const base =
		explicit ??
		process.env.CYCY_API_URL ??
		process.env.NEXT_PUBLIC_CYCY_API_URL;

	if (!base) {
		throw new Error(
			"CYCY_API_URL is not configured. Add it to your environment (e.g. https://cycy-backend.onrender.com).",
		);
	}

	return base.replace(/\/$/, "");
}

async function parseBody(response: Response): Promise<unknown> {
	const text = await response.text();
	if (!text) return null;
	try {
		return JSON.parse(text) as unknown;
	} catch {
		return text;
	}
}

function errorMessage(body: unknown, fallback: string): string {
	if (typeof body === "string" && body.trim()) return body;
	if (body && typeof body === "object") {
		const record = body as Record<string, unknown>;
		if (typeof record.message === "string") return record.message;
		if (Array.isArray(record.message)) {
			return record.message.map(String).join(", ");
		}
		if (typeof record.error === "string") return record.error;
	}
	return fallback;
}

export function createCycyClient(options: CycyClientOptions = {}) {
	const baseUrl = resolveBaseUrl(options.baseUrl);
	const fetchImpl = options.fetch ?? fetch;

	async function request<T>(
		path: string,
		init: RequestInit = {},
		{ auth = true }: { auth?: boolean } = {},
	): Promise<T> {
		const headers = new Headers(init.headers);

		if (init.body && !headers.has("Content-Type")) {
			headers.set("Content-Type", "application/json");
		}

		if (auth) {
			if (!options.token) {
				throw new CycyApiError(
					"Missing Clerk session token for Cycy API request",
					401,
					null,
				);
			}
			headers.set("Authorization", `Bearer ${options.token}`);
		}

		const response = await fetchImpl(`${baseUrl}${path}`, {
			...init,
			headers,
		});

		const body = await parseBody(response);

		if (!response.ok) {
			throw new CycyApiError(
				errorMessage(body, `Cycy API ${response.status}`),
				response.status,
				body,
			);
		}

		return body as T;
	}

	return {
		/** GET /api/v1/health — no auth */
		health: () =>
			request<HealthResponse>("/api/v1/health", { method: "GET" }, { auth: false }),

		/** POST /api/v1/servers/:serverId/bootstrap */
		bootstrapCurriculum: (serverId: string) =>
			request<BootstrapResponse | BootstrapResult>(
				`/api/v1/servers/${serverId}/bootstrap`,
				{ method: "POST" },
			),

		/** GET /api/v1/servers/:serverId/curriculum */
		getCurriculum: (serverId: string) =>
			request<CurriculumStatusResponse>(
				`/api/v1/servers/${serverId}/curriculum`,
				{ method: "GET" },
			),

		/** GET /api/v1/servers/:serverId/curriculum/content — full modules/concepts when READY */
		getCurriculumContent: (serverId: string) =>
			request<CurriculumContentResponse>(
				`/api/v1/servers/${serverId}/curriculum/content`,
				{ method: "GET" },
			),

		/** POST /api/v1/conversations/:conversationId/process */
		processMessage: (conversationId: string, body: ProcessMessageBody) =>
			request<ProcessMessageResponse>(
				`/api/v1/conversations/${conversationId}/process`,
				{ method: "POST", body: JSON.stringify(body) },
			),

		/** GET /api/v1/conversations/:conversationId/session?serverId= */
		getSession: (conversationId: string, serverId: string) =>
			request<ConversationSessionResponse>(
				`/api/v1/conversations/${conversationId}/session?serverId=${encodeURIComponent(serverId)}`,
				{ method: "GET" },
			),

		/** POST /api/v1/assessments/submit */
		submitAssessment: (body: SubmitAssessmentBody) =>
			request<SubmitAssessmentResponse>("/api/v1/assessments/submit", {
				method: "POST",
				body: JSON.stringify(body),
			}),

		/** POST /api/v1/assessments/explain-back */
		submitExplainBack: (body: ExplainBackBody) =>
			request<ExplainBackResponse>("/api/v1/assessments/explain-back", {
				method: "POST",
				body: JSON.stringify(body),
			}),

		/** GET /api/v1/progress/:serverId */
		getProgress: (serverId: string) =>
			request<ProgressResponse>(`/api/v1/progress/${serverId}`, {
				method: "GET",
			}),

		/** GET /api/v1/courses/:serverId/concepts */
		listConcepts: (serverId: string) =>
			request<CourseConceptsResponse>(
				`/api/v1/courses/${serverId}/concepts`,
				{ method: "GET" },
			),
	};
}

export type CycyClient = ReturnType<typeof createCycyClient>;
