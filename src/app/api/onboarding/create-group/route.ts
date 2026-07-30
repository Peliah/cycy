import { NextResponse } from "next/server";
import { CurriculumStatus } from "@prisma/client";
import { v4 as uuidv4 } from "uuid";

import { getApiProfile } from "@/lib/api-auth";
import { invalidateServerLearningCache } from "@/lib/cache/redis";
import {
	BackendInternalError,
	enqueueEnrichInternal,
	provisionTemplateInternal,
} from "@/lib/cycy/backend-internal";
import { createGroupSchema } from "@/lib/onboarding/schema";
import { prisma } from "@/lib/prismadb";

export async function POST(req: Request) {
	try {
		const profile = await getApiProfile();
		if (!profile) {
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

		const { name, imageUrl, learningGoal, learningReason, materials } =
			parsed.data;

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
							create: [{ role: "ADMIN", profileId: profile.id }],
						},
						curriculum: {
							create: { status: CurriculumStatus.PENDING },
						},
						...(materials.length > 0
							? {
									materials: {
										create: materials.map((m) => ({
											fileName: m.fileName,
											fileUrl: m.fileUrl,
											mimeType: m.mimeType,
											extractedText:
												m.extractedText?.slice(0, 50_000) ?? null,
											status: m.extractedText ? "READY" : "UPLOADED",
										})),
									},
								}
							: {}),
					},
					select: { id: true },
				});
			},
			{
				maxWait: 10_000,
				timeout: 20_000,
			},
		);

		try {
			const provision = await provisionTemplateInternal(server.id);

			await prisma.curriculum.update({
				where: { serverId: server.id },
				data: {
					status: CurriculumStatus.READY,
					bootstrapPhase: null,
					summary: provision.summary,
					contentVersion: provision.contentVersion ?? 1,
				},
			});

			await invalidateServerLearningCache(server.id);
			enqueueEnrichInternal(server.id);

			return NextResponse.json({
				id: server.id,
				curriculumStatus: CurriculumStatus.READY,
				contentVersion: provision.contentVersion ?? 1,
			});
		} catch (error) {
			console.error(error, "CREATE GROUP PROVISION ERROR");
			await prisma.curriculum
				.update({
					where: { serverId: server.id },
					data: { status: CurriculumStatus.FAILED, bootstrapPhase: null },
				})
				.catch(() => undefined);

			const message =
				error instanceof BackendInternalError
					? error.message
					: "Could not set up your learning path. Try again from the server page.";
			return NextResponse.json({ error: message }, { status: 502 });
		}
	} catch (error) {
		console.error(error, "ONBOARDING CREATE GROUP ERROR");
		return new NextResponse("Internal Error", { status: 500 });
	}
}
