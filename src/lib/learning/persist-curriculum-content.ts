import { Prisma, QuizKind, QuizQuestionType } from "@prisma/client";

import type {
	CurriculumContentResponse,
	ModuleContent,
	QuizQuestionContent,
} from "@/lib/cycy/types";
import { prisma } from "@/lib/prismadb";

function normalizeHandle(handle: string | null | undefined): string | null {
	if (!handle?.trim()) return null;
	const trimmed = handle.trim();
	return trimmed.startsWith("@") ? trimmed : `@${trimmed}`;
}

function mapQuestionType(type: QuizQuestionContent["type"]): QuizQuestionType {
	return type === "STRUCTURAL" ? QuizQuestionType.STRUCTURAL : QuizQuestionType.MCQ;
}

async function upsertGateQuiz(
	tx: Prisma.TransactionClient,
	curriculumId: string,
	moduleId: string,
	gate: NonNullable<ModuleContent["gateQuiz"]>,
) {
	const existing = await tx.quiz.findUnique({
		where: { moduleId },
		select: { id: true },
	});

	const quizId = existing
		? (
				await tx.quiz.update({
					where: { id: existing.id },
					data: {
						title: gate.title,
						passScore: gate.passScore,
						kind: QuizKind.GATE,
					},
					select: { id: true },
				})
			).id
		: (
				await tx.quiz.create({
					data: {
						curriculumId,
						moduleId,
						title: gate.title,
						passScore: gate.passScore,
						kind: QuizKind.GATE,
					},
					select: { id: true },
				})
			).id;

	await tx.quizQuestion.deleteMany({ where: { quizId } });

	if (gate.questions.length > 0) {
		await tx.quizQuestion.createMany({
			data: gate.questions.map((q) => ({
				quizId,
				order: q.order,
				type: mapQuestionType(q.type),
				prompt: q.prompt,
				choices: (q.choices ?? undefined) as
					| Prisma.InputJsonValue
					| undefined,
				correctAnswer:
					q.correctAnswer ??
					q.choices?.find((c) => c.correct)?.id ??
					null,
				rubric: q.rubric ?? null,
			})),
		});
	}

	return quizId;
}

/**
 * Mirror Nest curriculum content into local Module / Quiz / FinalExam tables.
 */
export async function persistCurriculumContent(
	serverId: string,
	content: CurriculumContentResponse,
): Promise<{ modulesUpserted: number }> {
	const curriculum = await prisma.curriculum.findUnique({
		where: { serverId },
		select: { id: true },
	});
	if (!curriculum) {
		throw new Error(`Curriculum not found for server ${serverId}`);
	}

	let agentHandle: string | null = null;
	let agentName: string | null = null;
	try {
		const { getCycyClient } = await import("@/lib/cycy/server");
		const client = await getCycyClient();
		const concepts = await client.listConcepts(serverId);
		agentHandle = normalizeHandle(concepts.agentHandle);
		agentName =
			typeof concepts.subject === "string" && concepts.subject.trim()
				? concepts.subject.trim()
				: null;
	} catch {
		// Concepts endpoint optional — content alone is enough
	}

	// Fallback so @mentions can work even if concepts API omits handle
	if (!agentHandle) {
		agentHandle = "@Agent";
	}

	await prisma.server.update({
		where: { id: serverId },
		data: {
			agentHandle,
			...(agentName ? { agentName } : {}),
			...(content.learningGoal ? { learningGoal: content.learningGoal } : {}),
			...(typeof content.learningReason === "string"
				? { learningReason: content.learningReason }
				: {}),
		},
	});

	let modulesUpserted = 0;

	const sortedModules = [...content.modules].sort((a, b) => a.order - b.order);
	const firstOrder = sortedModules[0]?.order;

	await prisma.$transaction(
		async (tx) => {
			const members = await tx.member.findMany({
				where: { serverId },
				select: { id: true },
			});

			for (const mod of sortedModules) {
				const existing = await tx.module.findFirst({
					where: {
						curriculumId: curriculum.id,
						OR: [{ externalId: mod.id }, { order: mod.order }],
					},
					select: { id: true },
				});

				const data = {
					externalId: mod.id,
					order: mod.order,
					title: mod.title,
					content: mod.content,
					conceptsJson: mod.concepts as unknown as Prisma.InputJsonValue,
					xpReward: 100,
					timeLimitMinutes: 60,
				};

				const moduleRow = existing
					? await tx.module.update({
							where: { id: existing.id },
							data,
							select: { id: true },
						})
					: await tx.module.create({
							data: {
								curriculumId: curriculum.id,
								...data,
							},
							select: { id: true },
						});

				if (mod.gateQuiz) {
					await upsertGateQuiz(
						tx,
						curriculum.id,
						moduleRow.id,
						mod.gateQuiz,
					);
				}

				const isFirst = mod.order === firstOrder;
				for (const member of members) {
					const existingProgress = await tx.moduleProgress.findUnique({
						where: {
							memberId_moduleId: {
								memberId: member.id,
								moduleId: moduleRow.id,
							},
						},
						select: { id: true },
					});
					if (!existingProgress) {
						await tx.moduleProgress.create({
							data: {
								memberId: member.id,
								moduleId: moduleRow.id,
								status: isFirst ? "AVAILABLE" : "LOCKED",
							},
						});
					}
				}

				modulesUpserted += 1;
			}

			if (content.finalExam) {
				const exam = content.finalExam;
				let finalQuiz = await tx.quiz.findFirst({
					where: { curriculumId: curriculum.id, kind: QuizKind.FINAL },
					select: { id: true },
				});

				if (finalQuiz) {
					await tx.quiz.update({
						where: { id: finalQuiz.id },
						data: {
							title: "Final exam",
							passScore: exam.passScore,
						},
					});
				} else {
					finalQuiz = await tx.quiz.create({
						data: {
							curriculumId: curriculum.id,
							kind: QuizKind.FINAL,
							title: "Final exam",
							passScore: exam.passScore,
						},
						select: { id: true },
					});
				}

				await tx.quizQuestion.deleteMany({ where: { quizId: finalQuiz.id } });
				if (exam.questions.length > 0) {
					await tx.quizQuestion.createMany({
						data: exam.questions.map((q) => ({
							quizId: finalQuiz!.id,
							order: q.order,
							type: mapQuestionType(q.type),
							prompt: q.prompt,
							choices: (q.choices ?? undefined) as
								| Prisma.InputJsonValue
								| undefined,
							correctAnswer:
								q.correctAnswer ??
								q.choices?.find((c) => c.correct)?.id ??
								null,
							rubric: q.rubric ?? null,
						})),
					});
				}

				await tx.finalExam.upsert({
					where: { curriculumId: curriculum.id },
					create: {
						curriculumId: curriculum.id,
						quizId: finalQuiz.id,
						passScore: exam.passScore,
					},
					update: {
						quizId: finalQuiz.id,
						passScore: exam.passScore,
					},
				});
			}
		},
		{ maxWait: 15_000, timeout: 60_000 },
	);

	return { modulesUpserted };
}
