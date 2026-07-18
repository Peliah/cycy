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

/** Accept the documented shape plus common Nest/axios variants. */
function normalizeBody(raw: unknown): IncomingBody {
	let value: unknown = raw;

	if (typeof value === "string") {
		try {
			value = JSON.parse(value) as unknown;
		} catch {
			return {};
		}
	}

	if (!value || typeof value !== "object") return {};

	const obj = value as Record<string, unknown>;
	const nested =
		obj.data && typeof obj.data === "object"
			? (obj.data as Record<string, unknown>)
			: obj;

	const conversationId =
		(typeof nested.conversationId === "string" && nested.conversationId) ||
		(typeof nested.conversation_id === "string" && nested.conversation_id) ||
		undefined;

	let messages: IncomingMessage[] | undefined;
	if (Array.isArray(nested.messages)) {
		messages = nested.messages as IncomingMessage[];
	} else if (nested.message && typeof nested.message === "object") {
		messages = [nested.message as IncomingMessage];
	} else if (Array.isArray(nested.message)) {
		messages = nested.message as IncomingMessage[];
	}

	return { conversationId, messages };
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
		const body = normalizeBody(req.body);
		const conversationId = body.conversationId;
		const messages = body.messages;

		if (!conversationId || !Array.isArray(messages) || messages.length === 0) {
			console.warn("[agent-response] bad payload", {
				contentType: req.headers["content-type"],
				bodyType: typeof req.body,
				keys:
					req.body && typeof req.body === "object"
						? Object.keys(req.body as object)
						: [],
				normalized: {
					hasConversationId: Boolean(conversationId),
					messageCount: Array.isArray(messages) ? messages.length : null,
				},
			});
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
