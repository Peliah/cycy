import { NextResponse } from "next/server";

import { getApiProfile } from "@/lib/api-auth";
import { dispatchLiveKitAgent } from "@/lib/livekit/dispatch";
import { prisma } from "@/lib/prismadb";

export async function POST(req: Request) {
	const profile = await getApiProfile();
	if (!profile) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const body = (await req.json().catch(() => null)) as {
		serverId?: string;
		channelId?: string;
	} | null;

	const { serverId, channelId } = body ?? {};
	if (!serverId || !channelId) {
		return NextResponse.json(
			{ error: "serverId and channelId are required" },
			{ status: 400 },
		);
	}

	const channel = await prisma.channel.findFirst({
		where: { id: channelId, serverId, type: "AUDIO" },
		select: { id: true, server: { select: { learningGoal: true } } },
	});
	if (!channel) {
		return NextResponse.json({ error: "Audio channel not found" }, { status: 404 });
	}

	const member = await prisma.member.findFirst({
		where: { profileId: profile.id, serverId },
		select: { id: true },
	});
	if (!member) {
		return NextResponse.json({ error: "Not a member of this course" }, { status: 403 });
	}

	try {
		await dispatchLiveKitAgent({
			roomName: channelId,
			metadata: {
				mode: "study_assist",
				serverId,
				profileId: profile.id,
				memberId: member.id,
				channelId,
				learningGoal: channel.server.learningGoal,
			},
		});
	} catch (error) {
		console.error(error, "DISPATCH STUDY AGENT ERROR");
		return NextResponse.json({ error: "Failed to dispatch study agent" }, { status: 500 });
	}

	return NextResponse.json({ ok: true, roomName: channelId });
}
