import { getAuth } from "@clerk/nextjs/server";
import type { NextApiRequest } from "next";

import { createCycyClient } from "@/lib/cycy/client";
import { prisma } from "@/lib/prismadb";

/**
 * Upsert LearningSession, then fire Nest /process (fire-and-forget safe).
 * Uses LearningSession.id as Nest conversationId (stable per member+server).
 */
export async function triggerAgentProcess(options: {
	req: NextApiRequest;
	serverId: string;
	memberId: string;
	channelId: string;
	messageId: string;
	content: string;
}): Promise<void> {
	const { req, serverId, memberId, channelId, messageId, content } = options;

	const session = await prisma.learningSession.upsert({
		where: {
			serverId_memberId: { serverId, memberId },
		},
		create: {
			serverId,
			memberId,
			lastChannelId: channelId,
		},
		update: {
			lastChannelId: channelId,
		},
		select: { id: true },
	});

	const authInfo = await getAuth(req);
	const token = await authInfo.getToken();
	if (!token) {
		console.warn("[agent] missing Clerk token; skip /process");
		return;
	}

	const client = createCycyClient({ token });
	await client.processMessage(session.id, {
		serverId,
		memberId,
		message: {
			id: messageId,
			content,
			type: "TEXT",
		},
		conversationType: "AGENT",
	});
}
