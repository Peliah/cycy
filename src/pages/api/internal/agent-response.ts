import type { NextApiRequest } from "next";
import { MessageAuthorType, Prisma } from "@prisma/client";

import { prisma } from "@/lib/prismadb";
import type { NextApiResponseServerIo } from "@/types/server";

/**
 * Nest → frontend webhook contract:
 * POST /api/internal/agent-response
 * Header: X-Internal-Secret
 * Body: { conversationId, messages: [{ authorType, content, memberId?, metadata? }] }
 * conversationId = LearningSession.id from /process
 * messages must be a non-empty array
 */
type IncomingMessage = {
	authorType?: string;
	content?: string;
	memberId?: string;
	metadata?: unknown;
};

type IncomingBody = {
	conversationId?: string;
	memberId?: string;
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
	if (raw === "USER") return MessageAuthorType.USER;
	if (raw === "AI_AGENT") return MessageAuthorType.AI_AGENT;
	return MessageAuthorType.AI_AGENT;
}

function toJsonValue(
	value: unknown,
): Prisma.InputJsonValue | typeof Prisma.JsonNull | undefined {
	if (value === undefined) return undefined;
	if (value === null) return Prisma.JsonNull;
	return value as Prisma.InputJsonValue;
}

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

	const conversationId =
		typeof obj.conversationId === "string" ? obj.conversationId : undefined;
	const memberId =
		typeof obj.memberId === "string" ? obj.memberId : undefined;
	const messages = Array.isArray(obj.messages)
		? (obj.messages as IncomingMessage[])
		: undefined;

	return { conversationId, memberId, messages };
}

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
		const { conversationId, messages } = body;

		if (!conversationId || !Array.isArray(messages) || messages.length === 0) {
			console.warn("[agent-response] bad payload", {
				contentType: req.headers["content-type"],
				bodyType: typeof req.body,
				keys:
					req.body && typeof req.body === "object"
						? Object.keys(req.body as object)
						: [],
				hasConversationId: Boolean(conversationId),
				messageCount: Array.isArray(messages) ? messages.length : null,
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
				memberId: true,
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
			// AI/SYSTEM stay member-less; optional Nest memberId is learner context only
			const memberId =
				authorType === MessageAuthorType.USER
					? (item.memberId ?? body.memberId ?? session.memberId)
					: null;

			const metadata = toJsonValue(item.metadata);

			const message = await prisma.message.create({
				data: {
					content,
					channelId,
					memberId,
					authorType,
					...(metadata !== undefined ? { metadata } : {}),
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
