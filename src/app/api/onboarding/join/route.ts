import { NextResponse } from "next/server";

import { joinGroupSchema } from "@/lib/onboarding/schema";
import { prisma } from "@/lib/prismadb";
import { getCurrentProfile } from "@/lib/query";

export async function POST(req: Request) {
	try {
		const profile = await getCurrentProfile();
		if (!profile || !("id" in profile)) {
			return new NextResponse("Unauthorized", { status: 401 });
		}

		const body = await req.json();
		const parsed = joinGroupSchema.safeParse(body);
		if (!parsed.success) {
			return NextResponse.json(
				{ error: parsed.error.issues[0]?.message ?? "Invalid input" },
				{ status: 400 },
			);
		}

		const raw = parsed.data.inviteCode.trim();
		const fromPath = raw.match(/invite\/([^/?#]+)/)?.[1];
		const code = fromPath ?? raw;

		const server = await prisma.server.findUnique({
			where: { inviteCode: code },
		});

		if (!server) {
			return NextResponse.json({ error: "Invite code not found" }, { status: 404 });
		}

		await prisma.profile.update({
			where: { id: profile.id },
			data: { onboardingComplete: true },
		});

		return NextResponse.json({ inviteCode: code, serverId: server.id });
	} catch (error) {
		console.error(error, "ONBOARDING JOIN ERROR");
		return new NextResponse("Internal Error", { status: 500 });
	}
}
