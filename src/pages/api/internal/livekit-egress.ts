import { MessageAuthorType } from "@prisma/client";
import type { NextApiRequest } from "next";

import { prisma } from "@/lib/prismadb";
import type { NextApiResponseServerIo } from "@/types/server";

type EgressWebhookBody = {
	egressId?: string;
	roomName?: string;
	status?: string;
	file?: { location?: string; filename?: string };
	error?: string;
};

function resolveInternalSecret(): string | undefined {
	return (
		process.env.CYCY_INTERNAL_WEBHOOK_SECRET ?? process.env.CYCY_INTERNAL_SECRET
	);
}

function resolveBackendBaseUrl(): string {
	const base =
		process.env.CYCY_API_URL ??
		process.env.NEXT_PUBLIC_CYCY_API_URL ??
		"http://localhost:4000";
	return base.replace(/\/$/, "");
}

function resolveInternalSecretForBackend(): string | undefined {
	return process.env.CYCY_INTERNAL_SECRET ?? process.env.CYCY_INTERNAL_WEBHOOK_SECRET;
}

async function summarizeViaBackend(input: {
	serverId: string;
	recordingUrl?: string;
	transcript?: string;
	learningGoal?: string | null;
}): Promise<string> {
	const secret = resolveInternalSecretForBackend();
	if (!secret) {
		return "Study call recording saved. Review the recording when you're ready.";
	}

	const response = await fetch(
		`${resolveBackendBaseUrl()}/api/v1/internal/interview/transcript/summarize`,
		{
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"X-Internal-Secret": secret,
			},
			body: JSON.stringify(input),
		},
	);

	if (!response.ok) {
		return "Study call recording saved. A full AI summary will be available soon.";
	}

	const body = (await response.json()) as { summary?: string };
	return body.summary ?? "Study call recording saved.";
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
		const body = (req.body ?? {}) as EgressWebhookBody;
		const egressId = body.egressId;
		const roomName = body.roomName;
		const recordingUrl = body.file?.location ?? body.file?.filename;

		if (!egressId && !roomName) {
			return res.status(400).json({ message: "egressId or roomName required" });
		}

		const transcript = await prisma.callTranscript.findFirst({
			where: egressId ? { egressId } : { roomName },
			include: {
				server: { select: { learningGoal: true } },
			},
		});

		if (!transcript) {
			return res.status(404).json({ message: "CallTranscript not found" });
		}

		if (body.status && body.status !== "EGRESS_COMPLETE" && body.status !== "complete") {
			await prisma.callTranscript.update({
				where: { id: transcript.id },
				data: { status: body.error ? "FAILED" : "RECORDING" },
			});
			return res.status(200).json({ ok: true, pending: true });
		}

		await prisma.callTranscript.update({
			where: { id: transcript.id },
			data: {
				recordingUrl: recordingUrl ?? transcript.recordingUrl,
				status: "TRANSCRIBING",
			},
		});

		const summary = await summarizeViaBackend({
			serverId: transcript.serverId,
			recordingUrl: recordingUrl ?? undefined,
			learningGoal: transcript.server.learningGoal,
		});

		const general = await prisma.channel.findFirst({
			where: { serverId: transcript.serverId, name: "general" },
			select: { id: true },
		});

		const targetChannelId = transcript.channelId ?? general?.id;
		if (targetChannelId) {
			const message = await prisma.message.create({
				data: {
					channelId: targetChannelId,
					content: summary,
					authorType: MessageAuthorType.SYSTEM,
					metadata: {
						type: "CALL_SUMMARY",
						callTranscriptId: transcript.id,
						recordingUrl: recordingUrl ?? null,
					},
				},
				include: {
					member: { include: { profile: true } },
				},
			});

			const channelKey = `chat:${targetChannelId}:messages`;
			res?.socket?.server?.io?.emit(channelKey, message);
		}

		await prisma.callTranscript.update({
			where: { id: transcript.id },
			data: {
				summary,
				status: "READY",
			},
		});

		return res.status(200).json({ ok: true, transcriptId: transcript.id });
	} catch (error) {
		console.error(error, "LIVEKIT EGRESS WEBHOOK ERROR");
		return res.status(500).json({ error: "Internal server error" });
	}
}

export const config = {
	api: {
		bodyParser: {
			sizeLimit: "2mb",
		},
	},
};
