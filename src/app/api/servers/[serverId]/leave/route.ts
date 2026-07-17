import { prisma } from "@/lib/prismadb";
import { getCurrentProfile } from "@/lib/query";
import { NextResponse } from "next/server";

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

		// leave server logic
		const server = await prisma.server.update({
			where: {
				id: serverId,
				profileId: {
					// the owner of the server (admin) can't leave the server
					not: profile.id,
				},
				members: {
					// the user must be a member of the server
					some: {
						profileId: profile.id,
					},
				},
			},
			data: {
				members: {
					deleteMany: {
						profileId: profile.id,
					},
				},
			},
		});

		return NextResponse.json(server);
	} catch (error: unknown) {
		console.log(error, "SERVER ID -- LEAVE SERVER API ERROR");
		return new NextResponse("Internal Error", { status: 500 });
	}
}
