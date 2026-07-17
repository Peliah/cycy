import { prisma } from "@/lib/prismadb";
import { getCurrentProfile } from "@/lib/query";
import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";

export async function PATCH(
	req: Request,
	{ params }: { params: Promise<{ serverId: string }> }
) {
	try {
		const { serverId } = await params;
		const profile = await getCurrentProfile();
		if (!profile) {
			return new NextResponse("Unauthorized", { status: 401 });
		}
		if (!serverId) {
			return new NextResponse("Server not found", { status: 404 });
		}

		const server = await prisma.server.update({
			where: {
				id: serverId,
				profileId: profile.id,
			},
			data: {
				inviteCode: uuidv4(),
			},
		});

		return NextResponse.json(server);
	} catch (error: unknown) {
		console.log(error, "SERVER ID -- INVITE CODE API ERROR");
		return new NextResponse("Internal Error", { status: 500 });
	}
}
