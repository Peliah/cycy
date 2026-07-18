import { NextResponse } from "next/server";

import { createCycyClient } from "@/lib/cycy";
import {
	allModulesCompleted,
	resolveFinalQuiz,
} from "@/lib/learning/final-exam";
import { prisma } from "@/lib/prismadb";
import { getCurrentProfile } from "@/lib/query";
import { auth } from "@clerk/nextjs/server";

/** GET capstone snapshot: exam unlock, local cert, Nest interview/cert stages */
export async function GET(
	_req: Request,
	{ params }: { params: Promise<{ serverId: string }> },
) {
	try {
		const profile = await getCurrentProfile();
		if (!profile || !("id" in profile)) {
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

		const server = await prisma.server.findUnique({
			where: { id: serverId },
			select: { agentHandle: true, name: true },
		});

		const modulesUnlocked = await allModulesCompleted(serverId, member.id);
		const resolved = await resolveFinalQuiz(serverId);

		const certificate = resolved
			? await prisma.certificate.findUnique({
					where: {
						finalExamId_memberId: {
							finalExamId: resolved.finalExamId,
							memberId: member.id,
						},
					},
					select: {
						id: true,
						verificationCode: true,
						issuedAt: true,
					},
				})
			: null;

		const certificateJson = certificate
			? {
					id: certificate.id,
					verificationCode: certificate.verificationCode,
					issuedAt: certificate.issuedAt.toISOString(),
				}
			: null;

		let nest: {
			certificateStage: string | null;
			interviewStatus: string;
			goalMet: boolean | null;
			rank: string;
			courseScore: number;
		} | null = null;

		try {
			const { getToken } = await auth();
			const token = await getToken();
			if (token) {
				const client = createCycyClient({ token });
				const p = await client.getProgress(serverId);
				nest = {
					certificateStage: p.certificateStage ?? null,
					interviewStatus: p.interviewStatus,
					goalMet: p.goalMet ?? null,
					rank: p.rank,
					courseScore: p.courseScore,
				};
			}
		} catch {
			// Nest progress optional
		}

		return NextResponse.json({
			serverId,
			serverName: server?.name ?? null,
			agentHandle: server?.agentHandle ?? null,
			modulesComplete: modulesUnlocked,
			hasFinalExam: Boolean(resolved),
			certificate: certificateJson,
			nest,
		});
	} catch (error) {
		console.error(error, "LEARN CAPSTONE ERROR");
		return new NextResponse("Internal Error", { status: 500 });
	}
}
