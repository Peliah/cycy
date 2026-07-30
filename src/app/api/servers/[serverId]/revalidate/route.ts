import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { getApiProfile } from "@/lib/api-auth";
import { prisma } from "@/lib/prismadb";

/** POST /api/servers/:serverId/revalidate — refresh server layout after curriculum sync */
export async function POST(
	_req: Request,
	{ params }: { params: Promise<{ serverId: string }> },
) {
	try {
		const profile = await getApiProfile();
		if (!profile) {
			return new NextResponse("Unauthorized", { status: 401 });
		}

		const { serverId } = await params;
		const member = await prisma.member.findFirst({
			where: { serverId, profileId: profile.id },
			select: { id: true },
		});
		if (!member) {
			return new NextResponse("Forbidden", { status: 403 });
		}

		revalidatePath(`/servers/${serverId}`, "layout");
		return NextResponse.json({ ok: true });
	} catch (error) {
		console.error(error, "REVALIDATE SERVER LAYOUT ERROR");
		return new NextResponse("Internal Error", { status: 500 });
	}
}
