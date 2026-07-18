import type { NextApiRequest } from "next";
import { MessageAuthorType } from "@prisma/client";

import { prisma } from "@/lib/prismadb";
import type { NextApiResponseServerIo } from "@/types/server";

type IncomingMessage = {
	authorType?: string;
	content?: string;
	metadata?: unknown;
};

type IncomingBody = {
	conversationId?: string;
	messages?: IncomingMessage[];
};

function resolveInternalSecret(): string | undefined {
	return (
		process.env.CYCY_INTERNAL_WEBHOOK_SECRET ??
		process.env.CYCY_INTERNAL_SECRET
	);
}

function mapAuthorType(raw: string | undefined): MessageAuthorType {
	if (raw === "SYSTEM") return MessageAuthorType.SYSTEM;
	if (raw === "AI_AGENT") return MessageAuthorType.AI_AGENT;
	return MessageAuthorType.AI_AGENT;
}

/**
 * Nest → frontend webhook. conversationId is LearningSession.id;
 * messages land in lastChannelId and emit on chat:{channelId}:messages.
 */
export default async function handler(
	req: NextApiRequest,
	res: NextApiResponseServerIo,
) {
	if (req.method !== "POST") {
		return res.status(405).json({ message: "Method not allowed" });
	}

	const secret = resolveInternalSecret();
	const header =
		(req.headers["x-internal-secret"] as string | undefined) ??
		(req.headers["X-Internal-Secret"] as string | undefined);

	if (!secret || !header || header !== secret) {
		return res.status(401).json({ message: "Unauthorized" });
	}

	try {
		const body = req.body as IncomingBody;
		const conversationId = body.conversationId;
		const messages = body.messages;

		if (!conversationId || !Array.isArray(messages) || messages.length === 0) {
			return res.status(400).json({
				message: "conversationId and messages are required",
			});
		}

		const session = await prisma.learningSession.findUnique({
			where: { id: conversationId },
			select: {
				id: true,
				lastChannelId: true,
				server: { select: { agentName: true, agentHandle: true } },
			},
		});

		if (!session?.lastChannelId) {
			return res.status(404).json({
				message: "Learning session or channel not found",
			});
		}

		const channelId = session.lastChannelId;
		const channelKey = `chat:${channelId}:messages`;
		let saved = 0;

		for (const item of messages) {
			const content = item.content?.trim();
			if (!content) continue;

			const authorType = mapAuthorType(item.authorType);
			const message = await prisma.message.create({
				data: {
					content,
					channelId,
					memberId: null,
					authorType,
				},
				include: {
					member: {
						include: {
							profile: true,
						},
					},
				},
			});

			res?.socket?.server?.io?.emit(channelKey, message);
			saved += 1;
		}

		return res.status(200).json({ saved, emitted: true });
	} catch (error) {
		console.error(error, "AGENT RESPONSE WEBHOOK ERROR");
		return res.status(500).json({ error: "Internal server error" });
	}
}
