import { AccessToken } from "livekit-server-sdk";
import { NextRequest, NextResponse } from "next/server";

import { getApiProfile } from "@/lib/api-auth";
import { verifyLiveKitRoomAccess } from "@/lib/livekit/access";
import { requireLiveKitServerConfig } from "@/lib/livekit/config";

export async function GET(req: NextRequest) {
	const profile = await getApiProfile();
	if (!profile) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const room = req.nextUrl.searchParams.get("room");
	const serverId = req.nextUrl.searchParams.get("serverId");

	if (!room) {
		return NextResponse.json(
			{ error: 'Missing "room" query parameter' },
			{ status: 400 },
		);
	}
	if (!serverId) {
		return NextResponse.json(
			{ error: 'Missing "serverId" query parameter' },
			{ status: 400 },
		);
	}

	const access = await verifyLiveKitRoomAccess({
		profileId: profile.id,
		serverId,
		room,
	});
	if (!access.ok) {
		return NextResponse.json({ error: access.error }, { status: access.status });
	}

	let config: ReturnType<typeof requireLiveKitServerConfig>;
	try {
		config = requireLiveKitServerConfig();
	} catch {
		return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
	}

	const at = new AccessToken(config.apiKey, config.apiSecret, {
		identity: profile.id,
		name: access.displayName,
	});

	at.addGrant({
		room,
		roomJoin: true,
		canPublish: true,
		canSubscribe: true,
	});

	return NextResponse.json({ token: await at.toJwt() });
}
