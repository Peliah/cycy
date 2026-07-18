import { getAuth } from "@clerk/nextjs/server";
import { MessageAuthorType } from "@prisma/client";
import type { NextApiRequest } from "next";

import { createCycyClient } from "@/lib/cycy/client";
import { prisma } from "@/lib/prismadb";
import type { NextApiResponseServerIo } from "@/types/server";

/**
 * Upsert LearningSession, post a short "thinking" line, then fire Nest /process.
 * Uses LearningSession.id as Nest conversationId (stable per member+server).
 */
export async function triggerAgentProcess(options: {
	req: NextApiRequest;
	res: NextApiResponseServerIo;
	serverId: string;
	memberId: string;
	channelId: string;
	messageId: string;
	content: string;
}): Promise<void> {
	const { req, res, serverId, memberId, channelId, messageId, content } =
		options;

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

	const thinking = await prisma.message.create({
		data: {
			content: "Agent is thinking…",
			channelId,
			memberId: null,
			authorType: MessageAuthorType.SYSTEM,
		},
		include: {
			member: { include: { profile: true } },
		},
	});
	const channelKey = `chat:${channelId}:messages`;
	res?.socket?.server?.io?.emit(channelKey, thinking);

	const authInfo = await getAuth(req);
	const token = await authInfo.getToken();
	if (!token) {
		console.warn("[agent] missing Clerk token; skip /process");
		return;
	}

	console.info(
		`[agent] process session=${session.id} server=${serverId} channel=${channelId}`,
	);

	const client = createCycyClient({ token });
	const result = await client.processMessage(session.id, {
		serverId,
		memberId,
		message: {
			id: messageId,
			content,
			type: "TEXT",
		},
		conversationType: "AGENT",
	});

	console.info(`[agent] /process ok`, result);
}
