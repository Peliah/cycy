import { QuizQuestionType } from "@prisma/client";
import { NextResponse } from "next/server";

import {
	allModulesCompleted,
	issueCertificate,
	resolveFinalQuiz,
} from "@/lib/learning/final-exam";
import { prisma } from "@/lib/prismadb";
import { getCurrentProfile } from "@/lib/query";

type Choice = { id: string; text: string; correct?: boolean };

type SubmitBody = {
	answers: Record<string, string>;
};

/** GET final exam status + questions when unlocked */
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

		const unlocked = await allModulesCompleted(serverId, member.id);
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

		const certJson = certificate
			? {
					id: certificate.id,
					verificationCode: certificate.verificationCode,
					issuedAt: certificate.issuedAt.toISOString(),
				}
			: null;

		const lastAttempt = resolved
			? await prisma.quizAttempt.findFirst({
					where: { quizId: resolved.quiz.id, memberId: member.id },
					orderBy: { createdAt: "desc" },
					select: {
						score: true,
						passed: true,
						createdAt: true,
					},
				})
			: null;

		const lastAttemptJson = lastAttempt
			? {
					score: lastAttempt.score,
					passed: lastAttempt.passed,
					createdAt: lastAttempt.createdAt.toISOString(),
				}
			: null;

		if (!unlocked) {
			return NextResponse.json({
				status: "LOCKED" as const,
				message: "Complete every module gate quiz to unlock the final exam.",
				hasExam: Boolean(resolved),
				certificate: null,
				lastAttempt: null,
				quiz: null,
			});
		}

		if (!resolved) {
			return NextResponse.json({
				status: "UNAVAILABLE" as const,
				message: "Final exam is not ready yet for this curriculum.",
				hasExam: false,
				certificate: certJson,
				lastAttempt: lastAttemptJson,
				quiz: null,
			});
		}

		if (certificate) {
			return NextResponse.json({
				status: "PASSED" as const,
				message: "Final exam passed. Your certificate is ready.",
				hasExam: true,
				certificate: certJson,
				lastAttempt: lastAttemptJson,
				quiz: null,
			});
		}

		return NextResponse.json({
			status: "AVAILABLE" as const,
			message: null,
			hasExam: true,
			certificate: null,
			lastAttempt: lastAttemptJson,
			quiz: {
				id: resolved.quiz.id,
				title: resolved.quiz.title,
				passScore: resolved.passScore,
				questions: resolved.quiz.questions.map((q) => ({
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
			},
		});
	} catch (error) {
		console.error(error, "LEARN EXAM GET ERROR");
		return new NextResponse("Internal Error", { status: 500 });
	}
}

/** POST submit final exam answers */
export async function POST(
	req: Request,
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

		const unlocked = await allModulesCompleted(serverId, member.id);
		if (!unlocked) {
			return NextResponse.json(
				{ message: "Final exam is locked until all modules are complete" },
				{ status: 403 },
			);
		}

		const resolved = await resolveFinalQuiz(serverId);
		if (!resolved) {
			return NextResponse.json(
				{ message: "Final exam not available" },
				{ status: 404 },
			);
		}

		const existingCert = await prisma.certificate.findUnique({
			where: {
				finalExamId_memberId: {
					finalExamId: resolved.finalExamId,
					memberId: member.id,
				},
			},
		});
		if (existingCert) {
			return NextResponse.json({
				passed: true,
				score: 1,
				passScore: resolved.passScore,
				certificate: {
					id: existingCert.id,
					verificationCode: existingCert.verificationCode,
					issuedAt: existingCert.issuedAt.toISOString(),
				},
			});
		}

		const body = (await req.json()) as SubmitBody;
		const answers = body.answers ?? {};

		let correct = 0;
		let graded = 0;

		for (const q of resolved.quiz.questions) {
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
				graded += 1;
				if (answer.trim().length >= 8) {
					correct += 1;
				}
			}
		}

		const score = graded === 0 ? 0 : correct / graded;
		const passed = score >= resolved.passScore;

		await prisma.quizAttempt.create({
			data: {
				quizId: resolved.quiz.id,
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
				passScore: resolved.passScore,
				certificate: null,
			});
		}

		const certificate = await issueCertificate({
			finalExamId: resolved.finalExamId,
			memberId: member.id,
			profileId: profile.id,
		});

		return NextResponse.json({
			passed: true,
			score,
			passScore: resolved.passScore,
			certificate: {
				id: certificate.id,
				verificationCode: certificate.verificationCode,
				issuedAt: certificate.issuedAt.toISOString(),
			},
		});
	} catch (error) {
		console.error(error, "LEARN EXAM SUBMIT ERROR");
		return new NextResponse("Internal Error", { status: 500 });
	}
}
