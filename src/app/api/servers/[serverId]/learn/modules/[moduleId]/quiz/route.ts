import { ModuleProgressStatus, QuizQuestionType } from "@prisma/client";
import { NextResponse } from "next/server";

import {
	completeModuleAndUnlockNext,
	computeXpEarned,
	ensureMemberModuleProgress,
} from "@/lib/learning/module-progress";
import { prisma } from "@/lib/prismadb";
import { getCurrentProfile } from "@/lib/query";

type Choice = { id: string; text: string; correct?: boolean };

/** GET quiz questions (without revealing correct answers for MCQ until submit) */
export async function GET(
	_req: Request,
	{ params }: { params: Promise<{ serverId: string; moduleId: string }> },
) {
	try {
		const profile = await getCurrentProfile();
		if (!profile || !("id" in profile)) {
			return new NextResponse("Unauthorized", { status: 401 });
		}

		const { serverId, moduleId } = await params;
		const member = await prisma.member.findFirst({
			where: { serverId, profileId: profile.id },
			select: { id: true },
		});
		if (!member) {
			return new NextResponse("Forbidden", { status: 403 });
		}

		const progress = await prisma.moduleProgress.findUnique({
			where: { memberId_moduleId: { memberId: member.id, moduleId } },
		});
		if (
			!progress ||
			progress.status === ModuleProgressStatus.LOCKED
		) {
			return NextResponse.json({ message: "Module is locked" }, { status: 403 });
		}

		const quiz = await prisma.quiz.findUnique({
			where: { moduleId },
			include: {
				questions: { orderBy: { order: "asc" } },
			},
		});
		if (!quiz) {
			return NextResponse.json({ message: "No gate quiz" }, { status: 404 });
		}

		return NextResponse.json({
			id: quiz.id,
			title: quiz.title,
			passScore: quiz.passScore,
			questions: quiz.questions.map((q) => ({
				id: q.id,
				order: q.order,
				type: q.type,
				prompt: q.prompt,
				choices: Array.isArray(q.choices)
					? (q.choices as Choice[]).map((c) => ({
							id: c.id,
							text: c.text,
						}))
					: null,
			})),
		});
	} catch (error) {
		console.error(error, "LEARN QUIZ GET ERROR");
		return new NextResponse("Internal Error", { status: 500 });
	}
}

type SubmitBody = {
	answers: Record<string, string>;
};

/** POST submit gate quiz answers */
export async function POST(
	req: Request,
	{ params }: { params: Promise<{ serverId: string; moduleId: string }> },
) {
	try {
		const profile = await getCurrentProfile();
		if (!profile || !("id" in profile)) {
			return new NextResponse("Unauthorized", { status: 401 });
		}

		const { serverId, moduleId } = await params;
		const member = await prisma.member.findFirst({
			where: { serverId, profileId: profile.id },
			select: { id: true },
		});
		if (!member) {
			return new NextResponse("Forbidden", { status: 403 });
		}

		await ensureMemberModuleProgress(serverId, member.id);

		const progress = await prisma.moduleProgress.findUnique({
			where: { memberId_moduleId: { memberId: member.id, moduleId } },
		});
		if (
			!progress ||
			progress.status === ModuleProgressStatus.LOCKED
		) {
			return NextResponse.json({ message: "Module is locked" }, { status: 403 });
		}

		const mod = await prisma.module.findFirst({
			where: { id: moduleId, curriculum: { serverId } },
			select: {
				id: true,
				xpReward: true,
				timeLimitMinutes: true,
			},
		});
		if (!mod) {
			return NextResponse.json({ message: "Module not found" }, { status: 404 });
		}

		const quiz = await prisma.quiz.findUnique({
			where: { moduleId },
			include: { questions: true },
		});
		if (!quiz) {
			return NextResponse.json({ message: "No gate quiz" }, { status: 404 });
		}

		const body = (await req.json()) as SubmitBody;
		const answers = body.answers ?? {};

		let correct = 0;
		let graded = 0;

		for (const q of quiz.questions) {
			const answer = answers[q.id];
			if (answer === undefined || answer === "") continue;

			if (q.type === QuizQuestionType.MCQ) {
				graded += 1;
				const choices = (q.choices as Choice[] | null) ?? [];
				const correctId =
					q.correctAnswer ??
					choices.find((c) => c.correct)?.id ??
					null;
				if (correctId && answer === correctId) {
					correct += 1;
				}
			} else {
				// Structural: accept non-empty as pass for v1 (Nest rubric later)
				graded += 1;
				if (answer.trim().length >= 8) {
					correct += 1;
				}
			}
		}

		const score = graded === 0 ? 0 : correct / graded;
		const passed = score >= quiz.passScore;

		await prisma.quizAttempt.create({
			data: {
				quizId: quiz.id,
				memberId: member.id,
				answers,
				score,
				passed,
			},
		});

		if (!passed) {
			return NextResponse.json({
				passed: false,
				score,
				passScore: quiz.passScore,
				xpEarned: 0,
			});
		}

		const xpEarned = computeXpEarned(
			mod.xpReward,
			score,
			progress.startedAt,
			mod.timeLimitMinutes,
		);

		await completeModuleAndUnlockNext({
			memberId: member.id,
			profileId: profile.id,
			moduleId: mod.id,
			serverId,
			score,
			xpEarned,
		});

		const next = await prisma.module.findFirst({
			where: {
				curriculum: { serverId },
				progress: {
					some: {
						memberId: member.id,
						status: ModuleProgressStatus.AVAILABLE,
					},
				},
			},
			orderBy: { order: "asc" },
			select: {
				id: true,
				title: true,
				externalId: true,
			},
		});

		let nextChannelId: string | null = null;
		if (next?.externalId) {
			const ch = await prisma.channel.findFirst({
				where: { serverId, externalModuleId: next.externalId },
				select: { id: true },
			});
			nextChannelId = ch?.id ?? null;
		}

		return NextResponse.json({
			passed: true,
			score,
			passScore: quiz.passScore,
			xpEarned,
			nextModule: next
				? { id: next.id, title: next.title, channelId: nextChannelId }
				: null,
		});
	} catch (error) {
		console.error(error, "LEARN QUIZ SUBMIT ERROR");
		return new NextResponse("Internal Error", { status: 500 });
	}
}
