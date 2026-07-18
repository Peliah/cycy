/** Strip invisible chars that break handle equality. */
function scrub(value: string): string {
	return value.replace(/[\u200B-\u200D\uFEFF]/g, "").trim();
}

/** Normalize handle to `@Name` form. */
export function normalizeAgentHandle(
	handle: string | null | undefined,
): string | null {
	if (!handle?.trim()) return null;
	const trimmed = scrub(handle);
	return trimmed.startsWith("@") ? trimmed : `@${trimmed}`;
}

/** Compare handles ignoring @, case, and non-alphanumerics. */
function handleKey(handle: string): string {
	return scrub(handle)
		.replace(/^@/, "")
		.toLowerCase()
		.replace(/[^a-z0-9]/g, "");
}

/** Pull @tokens out of message text (after light markdown strip). */
export function extractMentions(content: string): string[] {
	const plain = scrub(content).replace(/[*_`~]/g, "");
	const matches = plain.match(/@[A-Za-z0-9_.-]+/g);
	return matches ?? [];
}

/**
 * True when the message should invoke the group agent.
 * Any @token invokes the agent (channel chat has no peer @mentions).
 * Also matches the configured handle without requiring a leading @.
 */
export function messageMentionsAgent(
	content: string,
	agentHandle: string | null | undefined,
): boolean {
	if (!content?.trim()) return false;

	const text = scrub(content);

	// Channel chat: any @token is treated as agent assist
	if (extractMentions(text).length > 0) return true;

	const handle = normalizeAgentHandle(agentHandle);
	if (!handle) return false;

	const needle = handle.toLowerCase();
	if (text.toLowerCase().includes(needle)) return true;

	const bare = handle.replace(/^@/, "");
	const escaped = bare.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
	const bareRe = new RegExp(
		`(?:^|[\\s([{])${escaped}(?=$|[\\s)\\].,!?;:'"])`,
		"i",
	);
	return bareRe.test(text);
}

/** Whether a specific mention token matches the server agent handle. */
export function mentionMatchesHandle(
	mention: string,
	agentHandle: string | null | undefined,
): boolean {
	const handle = normalizeAgentHandle(agentHandle);
	if (!handle) return false;
	return handleKey(mention) === handleKey(handle);
}
