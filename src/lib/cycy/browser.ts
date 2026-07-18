/**
 * Same-origin paths for the Cycy BFF proxies.
 * Use with axios/fetch from the client (Clerk cookie auth on /api/cycy/*).
 */
export const cycyApi = {
	health: () => "/api/cycy/health",
	bootstrap: (serverId: string) => `/api/cycy/servers/${serverId}/bootstrap`,
	curriculum: (serverId: string) => `/api/cycy/servers/${serverId}/curriculum`,
	curriculumContent: (serverId: string) =>
		`/api/cycy/servers/${serverId}/curriculum/content`,
	processMessage: (conversationId: string) =>
		`/api/cycy/conversations/${conversationId}/process`,
	session: (conversationId: string, serverId: string) =>
		`/api/cycy/conversations/${conversationId}/session?serverId=${encodeURIComponent(serverId)}`,
	submitAssessment: () => "/api/cycy/assessments/submit",
	explainBack: () => "/api/cycy/assessments/explain-back",
	progress: (serverId: string) => `/api/cycy/progress/${serverId}`,
	concepts: (serverId: string) => `/api/cycy/courses/${serverId}/concepts`,
} as const;
