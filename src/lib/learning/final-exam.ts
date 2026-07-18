import { ModuleProgressStatus, QuizKind } from "@prisma/client";
import { randomBytes } from "node:crypto";

import { prisma } from "@/lib/prismadb";

export function createVerificationCode(): string {
	return randomBytes(6).toString("hex").toUpperCase();
}

export async function allModulesCompleted(
	serverId: string,
	memberId: string,
): Promise<boolean> {
	const curriculum = await prisma.curriculum.findUnique({
		where: { serverId },
		select: {
			modules: { select: { id: true } },
		},
	});
	if (!curriculum || curriculum.modules.length === 0) return false;

	const completed = await prisma.moduleProgress.count({
		where: {
			memberId,
			status: ModuleProgressStatus.COMPLETED,
			moduleId: { in: curriculum.modules.map((m) => m.id) },
		},
	});

	return completed >= curriculum.modules.length;
}

export async function getFinalExamBundle(serverId: string) {
	const curriculum = await prisma.curriculum.findUnique({
		where: { serverId },
		select: {
			id: true,
			finalExam: {
				select: {
					id: true,
					passScore: true,
					quizId: true,
					quiz: {
						select: {
							id: true,
							title: true,
							passScore: true,
							questions: { orderBy: { order: "asc" } },
						},
					},
				},
			},
		},
	});

	return curriculum?.finalExam ?? null;
}

/** Prefer FinalExam row; fall back to FINAL kind quiz if outline exists without FinalExam link. */
export async function resolveFinalQuiz(serverId: string) {
	const exam = await getFinalExamBundle(serverId);
	if (exam?.quiz) {
		return {
			finalExamId: exam.id,
			passScore: exam.passScore ?? exam.quiz.passScore,
			quiz: exam.quiz,
		};
	}

	const curriculum = await prisma.curriculum.findUnique({
		where: { serverId },
		select: { id: true },
	});
	if (!curriculum) return null;

	const quiz = await prisma.quiz.findFirst({
		where: { curriculumId: curriculum.id, kind: QuizKind.FINAL },
		select: {
			id: true,
			title: true,
			passScore: true,
			questions: { orderBy: { order: "asc" } },
		},
	});
	if (!quiz) return null;

	const finalExam = await prisma.finalExam.upsert({
		where: { curriculumId: curriculum.id },
		create: {
			curriculumId: curriculum.id,
			quizId: quiz.id,
			passScore: quiz.passScore,
		},
		update: {
			quizId: quiz.id,
			passScore: quiz.passScore,
		},
		select: { id: true, passScore: true },
	});

	return {
		finalExamId: finalExam.id,
		passScore: finalExam.passScore,
		quiz,
	};
}

export async function issueCertificate(args: {
	finalExamId: string;
	memberId: string;
	profileId: string;
}) {
	const existing = await prisma.certificate.findUnique({
		where: {
			finalExamId_memberId: {
				finalExamId: args.finalExamId,
				memberId: args.memberId,
			},
		},
	});
	if (existing) return existing;

	return prisma.certificate.create({
		data: {
			finalExamId: args.finalExamId,
			memberId: args.memberId,
			profileId: args.profileId,
			verificationCode: createVerificationCode(),
		},
	});
}
