import { prisma } from "@/lib/prismadb";
import { getCurrentProfile } from "@/lib/query";
import { NextResponse } from "next/server";

export async function PATCH(
	req: Request,
	{ params }: { params: Promise<{ memberId: string }> }
) {
	try {
		const { memberId } = await params;
		const profile = await getCurrentProfile();
		const { searchParams } = new URL(req.url);
		const { role } = await req.json();
		const serverId = searchParams.get("serverId");
		if (!profile) {
			return new NextResponse("Unauthorized", { status: 401 });
		}
		if (!serverId) {
			return new NextResponse("Server not found", { status: 404 });
		}
		if (!memberId) {
			return new NextResponse("Member not found", { status: 404 });
		}

		const server = await prisma.server.update({
			where: {
				id: serverId,
				profileId: profile.id,
			},
			data: {
				members: {
					update: {
						where: {
							id: memberId,
							profileId: {
								// To prevent the current login user to change their own role
								not: profile.id,
							},
						},
						data: {
							role,
						},
					},
				},
			},
			include: {
				members: {
					include: {
						profile: true,
					},
					orderBy: {
						role: "asc",
					},
				},
			},
		});

		return NextResponse.json(server);
	} catch (error: unknown) {
		console.log(error, "MEMBER ID  API ERROR");
		return new NextResponse("Internal Error", { status: 500 });
	}
}
export async function DELETE(
	req: Request,
	{ params }: { params: Promise<{ memberId: string }> }
) {
	try {
		const { memberId } = await params;
		const profile = await getCurrentProfile();
		const { searchParams } = new URL(req.url);
		const serverId = searchParams.get("serverId");
		if (!profile) {
			return new NextResponse("Unauthorized", { status: 401 });
		}
		if (!serverId) {
			return new NextResponse("Server not found", { status: 404 });
		}
		if (!memberId) {
			return new NextResponse("Member not found", { status: 404 });
		}

		const server = await prisma.server.update({
			where: {
				id: serverId,
				profileId: profile.id,
			},
			data: {
				members: {
					deleteMany: {
						id: memberId,
						profileId: {
							// admin's can't kick themselves
							not: profile.id,
						},
					},
				},
			},
			include: {
				members: {
					include: {
						profile: true,
					},
					orderBy: {
						role: "asc",
					},
				},
			},
		});

		return NextResponse.json(server);
	} catch (error: unknown) {
		console.log(error, "MEMBER ID  API ERROR");
		return new NextResponse("Internal Error", { status: 500 });
	}
}
