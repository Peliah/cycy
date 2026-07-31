export const LIVEKIT_AGENT_NAME =
	process.env.LIVEKIT_AGENT_NAME ?? "cycy-voice-agent";

export function requireLiveKitServerConfig(): {
	apiKey: string;
	apiSecret: string;
	wsUrl: string;
} {
	const apiKey = process.env.LIVEKIT_API_KEY;
	const apiSecret = process.env.LIVEKIT_API_SECRET;
	const wsUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL;

	if (!apiKey || !apiSecret || !wsUrl) {
		throw new Error("LiveKit is not configured");
	}

	return { apiKey, apiSecret, wsUrl };
}
