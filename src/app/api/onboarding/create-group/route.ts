import { NextResponse } from "next/server";
import { MemberRole } from "@prisma/client";
import { v4 as uuidv4 } from "uuid";

import { createGroupSchema } from "@/lib/onboarding/schema";
import { prisma } from "@/lib/prismadb";
import { getCurrentProfile } from "@/lib/query";

export async function POST(req: Request) {
	try {
		const profile = await getCurrentProfile();
		if (!profile || !("id" in profile)) {
			return new NextResponse("Unauthorized", { status: 401 });
		}

		const body = await req.json();
		const parsed = createGroupSchema.safeParse(body);
		if (!parsed.success) {
			return NextResponse.json(
				{ error: parsed.error.issues[0]?.message ?? "Invalid input" },
				{ status: 400 },
			);
		}

		const { name, imageUrl, learningGoal, learningReason, materials } = parsed.data;

		const server = await prisma.$transaction(
			async (tx) => {
				await tx.profile.update({
					where: { id: profile.id },
					data: { onboardingComplete: true },
				});

				return tx.server.create({
					data: {
						profileId: profile.id,
						name,
						imageUrl: imageUrl || null,
						learningGoal,
						learningReason,
						inviteCode: uuidv4(),
						channels: {
							create: [{ name: "general", profileId: profile.id }],
						},
						members: {
							create: [{ role: MemberRole.ADMIN, profileId: profile.id }],
						},
						curriculum: {
							create: { status: "PENDING" },
						},
						materials: {
							create: materials.map((m) => ({
								fileName: m.fileName,
								fileUrl: m.fileUrl,
								mimeType: m.mimeType,
								status: "UPLOADED",
							})),
						},
					},
					select: { id: true },
				});
			},
			{
				maxWait: 10_000,
				timeout: 20_000,
			},
		);

		return NextResponse.json(server);
	} catch (error) {
		console.error(error, "ONBOARDING CREATE GROUP ERROR");
		return new NextResponse("Internal Error", { status: 500 });
	}
}
