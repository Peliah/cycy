import { NextResponse } from "next/server";

import { getApiProfile } from "@/lib/api-auth";
import { dispatchLiveKitAgent } from "@/lib/livekit/dispatch";
import { voiceInterviewRoomName } from "@/lib/livekit/rooms";
import { prisma } from "@/lib/prismadb";

export async function POST(req: Request) {
	const profile = await getApiProfile();
	if (!profile) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const body = (await req.json().catch(() => null)) as { serverId?: string } | null;
	const serverId = body?.serverId;
	if (!serverId) {
		return NextResponse.json({ error: "serverId is required" }, { status: 400 });
	}

	const member = await prisma.member.findFirst({
		where: { profileId: profile.id, serverId },
		select: { id: true },
	});
	if (!member) {
		return NextResponse.json({ error: "Not a member of this course" }, { status: 403 });
	}

	const general = await prisma.channel.findFirst({
		where: { serverId, name: "general" },
		select: { id: true },
	});

	const session = await prisma.learningSession.upsert({
		where: { serverId_memberId: { serverId, memberId: member.id } },
		create: {
			serverId,
			memberId: member.id,
			lastChannelId: general?.id,
		},
		update: {
			lastChannelId: general?.id ?? undefined,
		},
		select: { id: true },
	});

	const roomName = voiceInterviewRoomName(serverId, profile.id);

	try {
		await dispatchLiveKitAgent({
			roomName,
			metadata: {
				mode: "mock_interview",
				serverId,
				profileId: profile.id,
				memberId: member.id,
				conversationId: session.id,
			},
		});
	} catch (error) {
		console.error(error, "DISPATCH INTERVIEW AGENT ERROR");
		return NextResponse.json({ error: "Failed to dispatch voice agent" }, { status: 500 });
	}

	return NextResponse.json({
		roomName,
		conversationId: session.id,
	});
}
