/**
 * Smoke test for LiveKit token access control (no LiveKit Cloud connection required).
 *
 * Usage:
 *   npx ts-node --transpile-only scripts/smoke-livekit-token.ts
 *
 * Requires DATABASE_URL and a member + AUDIO channel in the database.
 */

import { AccessToken } from "livekit-server-sdk";

import { verifyLiveKitRoomAccess } from "../src/lib/livekit/access";
import { voiceInterviewRoomName } from "../src/lib/livekit/rooms";
import { prisma } from "../src/lib/prismadb";

async function main() {
	const apiKey = process.env.LIVEKIT_API_KEY;
	const apiSecret = process.env.LIVEKIT_API_SECRET;
	if (!apiKey || !apiSecret) {
		console.warn("LIVEKIT_API_KEY/SECRET not set — skipping JWT mint check");
	} else {
		const at = new AccessToken(apiKey, apiSecret, {
			identity: "smoke-profile",
			name: "Smoke Test",
		});
		at.addGrant({ room: "smoke-room", roomJoin: true, canPublish: true, canSubscribe: true });
		const token = await at.toJwt();
		if (!token || token.split(".").length !== 3) {
			throw new Error("JWT mint failed");
		}
		console.log("OK JWT mint");
	}

	const member = await prisma.member.findFirst({
		select: { profileId: true, serverId: true },
	});
	if (!member) {
		console.warn("No members in DB — skipping membership access check");
		return;
	}

	const audioChannel = await prisma.channel.findFirst({
		where: { serverId: member.serverId, type: "AUDIO" },
		select: { id: true },
	});

	if (audioChannel) {
		const channelAccess = await verifyLiveKitRoomAccess({
			profileId: member.profileId,
			serverId: member.serverId,
			room: audioChannel.id,
		});
		if (!channelAccess.ok) {
			throw new Error(`AUDIO channel access failed: ${channelAccess.error}`);
		}
		console.log("OK AUDIO channel access", audioChannel.id);
	} else {
		console.warn("No AUDIO channel — create one in the sidebar to test peer calls");
	}

	const interviewRoom = voiceInterviewRoomName(member.serverId, member.profileId);
	const interviewAccess = await verifyLiveKitRoomAccess({
		profileId: member.profileId,
		serverId: member.serverId,
		room: interviewRoom,
	});
	if (!interviewAccess.ok) {
		throw new Error(`Voice interview room access failed: ${interviewAccess.error}`);
	}
	console.log("OK voice interview room access", interviewRoom);

	const stranger = await prisma.profile.findFirst({
		where: { id: { not: member.profileId } },
		select: { id: true },
	});
	if (stranger && audioChannel) {
		const denied = await verifyLiveKitRoomAccess({
			profileId: stranger.id,
			serverId: member.serverId,
			room: audioChannel.id,
		});
		if (denied.ok) {
			throw new Error("Expected non-member to be denied");
		}
		console.log("OK non-member denied");
	}

	console.log("Smoke test passed");
}

main()
	.catch((error) => {
		console.error(error);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
