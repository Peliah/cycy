import { NextResponse } from "next/server";
import { CurriculumStatus, MemberRole } from "@prisma/client";
import { v4 as uuidv4 } from "uuid";

import { invalidateServerLearningCache } from "@/lib/cache/redis";
import { CycyApiError } from "@/lib/cycy/client";
import { getCycyClient } from "@/lib/cycy/server";
import { createGroupSchema } from "@/lib/onboarding/schema";
import { prisma } from "@/lib/prismadb";
import { getCurrentProfile } from "@/lib/query";

function curriculumStatusFromBootstrap(
	data: unknown,
): CurriculumStatus {
	if (
		data &&
		typeof data === "object" &&
		"status" in data &&
		(data as { status: unknown }).status === "generating"
	) {
		return CurriculumStatus.GENERATING;
	}
	if (
		data &&
		typeof data === "object" &&
		"curriculumId" in data &&
		typeof (data as { curriculumId: unknown }).curriculumId === "string"
	) {
		return CurriculumStatus.READY;
	}
	return CurriculumStatus.GENERATING;
}

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
							create: [{ role: MemberRole.ADMIN, profileId: profile.id }],
						},
						curriculum: {
							create: { status: CurriculumStatus.PENDING },
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

		let curriculumStatus: CurriculumStatus = CurriculumStatus.PENDING;

		try {
			const client = await getCycyClient();
			const bootstrap = await client.bootstrapCurriculum(server.id);
			curriculumStatus = curriculumStatusFromBootstrap(bootstrap);

			const summary =
				bootstrap &&
				typeof bootstrap === "object" &&
				"summary" in bootstrap &&
				typeof (bootstrap as { summary: unknown }).summary === "string"
					? (bootstrap as { summary: string }).summary
					: undefined;

			await prisma.curriculum.update({
				where: { serverId: server.id },
				data: {
					status: curriculumStatus,
					...(summary ? { summary } : {}),
				},
			});
			await invalidateServerLearningCache(server.id);
		} catch (error) {
			console.error(error, "CREATE GROUP BOOTSTRAP ERROR");
			if (error instanceof CycyApiError && error.status >= 500) {
				await prisma.curriculum
					.update({
						where: { serverId: server.id },
						data: { status: CurriculumStatus.FAILED },
					})
					.catch(() => undefined);
				curriculumStatus = CurriculumStatus.FAILED;
			}
			// Soft-fail: group still created; banner can retry bootstrap.
		}

		return NextResponse.json({ id: server.id, curriculumStatus });
	} catch (error) {
		console.error(error, "ONBOARDING CREATE GROUP ERROR");
		return new NextResponse("Internal Error", { status: 500 });
	}
}
