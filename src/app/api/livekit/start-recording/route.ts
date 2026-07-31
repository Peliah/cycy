import {
	EncodedFileOutput,
	EncodedFileType,
	EgressClient,
	WebhookConfig,
} from "livekit-server-sdk";
import { NextResponse } from "next/server";

import { getApiProfile } from "@/lib/api-auth";
import { requireLiveKitServerConfig } from "@/lib/livekit/config";
import { prisma } from "@/lib/prismadb";

function appBaseUrl(): string {
	return (
		process.env.NEXT_PUBLIC_APP_URL ??
		(process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")
	).replace(/\/$/, "");
}

export async function POST(req: Request) {
	const profile = await getApiProfile();
	if (!profile) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const body = (await req.json().catch(() => null)) as {
		serverId?: string;
		channelId?: string;
		roomName?: string;
	} | null;

	const { serverId, channelId, roomName } = body ?? {};
	if (!serverId || !roomName) {
		return NextResponse.json(
			{ error: "serverId and roomName are required" },
			{ status: 400 },
		);
	}

	const member = await prisma.member.findFirst({
		where: { profileId: profile.id, serverId },
		select: { id: true },
	});
	if (!member) {
		return NextResponse.json({ error: "Not a member of this course" }, { status: 403 });
	}

	let config: ReturnType<typeof requireLiveKitServerConfig>;
	try {
		config = requireLiveKitServerConfig();
	} catch {
		return NextResponse.json({ error: "LiveKit is not configured" }, { status: 500 });
	}

	const httpUrl = config.wsUrl.replace(/^wss:/, "https:").replace(/^ws:/, "http:");
	const egressClient = new EgressClient(httpUrl, config.apiKey, config.apiSecret);

	const transcript = await prisma.callTranscript.create({
		data: {
			serverId,
			channelId: channelId ?? null,
			roomName,
			profileId: profile.id,
			status: "RECORDING",
		},
	});

	const webhookUrl = `${appBaseUrl()}/api/internal/livekit-egress`;

	try {
		const info = await egressClient.startRoomCompositeEgress(
			roomName,
			new EncodedFileOutput({
				fileType: EncodedFileType.MP4,
				filepath: `recordings/${serverId}/${roomName}-{time}.mp4`,
			}),
			{
				audioOnly: true,
				webhooks: [new WebhookConfig({ url: webhookUrl })],
			},
		);

		await prisma.callTranscript.update({
			where: { id: transcript.id },
			data: { egressId: info.egressId },
		});

		return NextResponse.json({ transcriptId: transcript.id, egressId: info.egressId });
	} catch (error) {
		await prisma.callTranscript.update({
			where: { id: transcript.id },
			data: { status: "FAILED" },
		});
		console.error(error, "START RECORDING ERROR");
		return NextResponse.json({ error: "Failed to start recording" }, { status: 500 });
	}
}
