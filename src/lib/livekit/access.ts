import { prisma } from "@/lib/prismadb";

import { isVoiceInterviewRoom } from "./rooms";

export type LiveKitAccessResult =
	| { ok: true; displayName: string }
	| { ok: false; status: 403 | 404; error: string };

/**
 * Verify the authenticated profile may join a LiveKit room.
 * Room may be a channel id (AUDIO/VIDEO) or a voice-interview room.
 */
export async function verifyLiveKitRoomAccess(options: {
	profileId: string;
	serverId: string;
	room: string;
}): Promise<LiveKitAccessResult> {
	const { profileId, serverId, room } = options;

	const member = await prisma.member.findFirst({
		where: { profileId, serverId },
		include: { profile: { select: { name: true } } },
	});

	if (!member) {
		return { ok: false, status: 403, error: "Not a member of this course" };
	}

	if (isVoiceInterviewRoom(room, serverId, profileId)) {
		return { ok: true, displayName: member.profile.name };
	}

	const channel = await prisma.channel.findFirst({
		where: { id: room, serverId },
		select: { id: true, type: true },
	});

	if (!channel) {
		return { ok: false, status: 404, error: "Channel not found" };
	}

	if (channel.type !== "AUDIO" && channel.type !== "VIDEO") {
		return {
			ok: false,
			status: 403,
			error: "This channel does not support media calls",
		};
	}

	return { ok: true, displayName: member.profile.name };
}
