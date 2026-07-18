/** Normalize handle to `@Name` form. */
export function normalizeAgentHandle(
	handle: string | null | undefined,
): string | null {
	if (!handle?.trim()) return null;
	const trimmed = handle.trim();
	return trimmed.startsWith("@") ? trimmed : `@${trimmed}`;
}

/** True when message content tags the group's agent handle. */
export function messageMentionsAgent(
	content: string,
	agentHandle: string | null | undefined,
): boolean {
	const handle = normalizeAgentHandle(agentHandle);
	if (!handle) return false;

	const escaped = handle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
	return new RegExp(`(?:^|[\\s([{])${escaped}\\b`, "i").test(content);
}
