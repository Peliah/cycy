import { AgentDispatchClient } from "livekit-server-sdk";

import { LIVEKIT_AGENT_NAME, requireLiveKitServerConfig } from "@/lib/livekit/config";

export async function dispatchLiveKitAgent(options: {
  roomName: string;
  metadata: Record<string, unknown>;
}): Promise<void> {
  const { apiKey, apiSecret, wsUrl } = requireLiveKitServerConfig();
  const httpUrl = wsUrl.replace(/^wss:/, "https:").replace(/^ws:/, "http:");

  const client = new AgentDispatchClient(httpUrl, apiKey, apiSecret);
  await client.createDispatch(options.roomName, LIVEKIT_AGENT_NAME, {
    metadata: JSON.stringify(options.metadata),
  });
}
