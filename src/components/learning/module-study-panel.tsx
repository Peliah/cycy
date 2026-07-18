"use client";

import { renderChatMarkdown } from "@/components/chat/chat-markdown";
import { GateQuizDialog } from "@/components/learning/gate-quiz-dialog";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type {
	MarkdownBodyProps,
	ModuleStudyPanelProps,
	ModuleStudyPayload,
} from "@/types/learning";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

function MarkdownBody({ content }: MarkdownBodyProps) {
	const html = useMemo(() => renderChatMarkdown(content), [content]);
	return (
		<div
			className="prose prose-sm max-w-none text-foreground prose-headings:font-display prose-headings:text-[#0A4D4A]"
			// eslint-disable-next-line react/no-danger
			dangerouslySetInnerHTML={{ __html: html }}
		/>
	);
}

export function ModuleStudyPanel({
	serverId,
	moduleId,
}: ModuleStudyPanelProps) {
	const [data, setData] = useState<ModuleStudyPayload | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [quizOpen, setQuizOpen] = useState(false);
	const [now, setNow] = useState(() => Date.now());

	useEffect(() => {
		let cancelled = false;
		void (async () => {
			try {
				const res = await fetch(
					`/api/servers/${serverId}/learn/modules/${moduleId}`,
				);
				if (!res.ok) {
					const body = await res.json().catch(() => null);
					throw new Error(
						(body as { message?: string })?.message ?? "Could not load module",
					);
				}
				const json = (await res.json()) as ModuleStudyPayload;
				if (!cancelled) {
					setData(json);
					setError(null);
				}
			} catch (e) {
				if (!cancelled) {
					setError(e instanceof Error ? e.message : "Failed to load");
				}
			}
		})();
		return () => {
			cancelled = true;
		};
	}, [serverId, moduleId]);

	useEffect(() => {
		if (!data?.startedAt || data.status === "COMPLETED") return;
		const t = window.setInterval(() => setNow(Date.now()), 30_000);
		return () => window.clearInterval(t);
	}, [data?.startedAt, data?.status]);

	if (error) {
		return (
			<div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
				<p className="text-sm text-shell-muted">{error}</p>
				<Button asChild variant="outline" size="sm">
					<Link href={`/servers/${serverId}`}>Back to group</Link>
				</Button>
			</div>
		);
	}

	if (!data) {
		return (
			<div className="flex flex-1 items-center justify-center text-sm text-shell-muted">
				Loading module…
			</div>
		);
	}

	if (data.status === "LOCKED") {
		return (
			<div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
				<p className="font-display text-lg text-[#0A4D4A]">
					You don’t have access yet
				</p>
				<p className="max-w-sm text-sm text-shell-muted">
					This module is locked. Pass the gate quiz on the previous module to
					unlock it.
				</p>
				<Button asChild variant="outline" size="sm">
					<Link href={`/servers/${serverId}`}>Back to group</Link>
				</Button>
			</div>
		);
	}

	const elapsedMin = data.startedAt
		? (now - new Date(data.startedAt).getTime()) / 60_000
		: 0;
	const remaining = Math.max(0, data.timeLimitMinutes - elapsedMin);
	const timePct = Math.min(
		100,
		Math.round((elapsedMin / data.timeLimitMinutes) * 100),
	);
	const nearLimit = remaining <= data.timeLimitMinutes * 0.2 && data.status !== "COMPLETED";

	const canQuiz =
		data.quiz &&
		data.status !== "COMPLETED" &&
		(data.status === "IN_PROGRESS" || data.status === "AVAILABLE");

	return (
		<div className="flex min-h-0 flex-1 flex-col">
			<div className="flex flex-wrap items-center gap-2 border-b border-shell-border px-4 py-3">
				<h2 className="font-display text-lg text-[#0A4D4A]">{data.title}</h2>
				<Badge variant="outline" className="capitalize">
					{data.status.toLowerCase().replace("_", " ")}
				</Badge>
				<span className="text-xs text-shell-muted">{data.xpReward} XP</span>
				{data.status !== "COMPLETED" && (
					<div className="ml-auto w-full max-w-[200px] sm:w-40">
						<div
							className={cn(
								"mb-1 flex justify-between text-[11px]",
								nearLimit ? "text-amber-700" : "text-shell-muted",
							)}
						>
							<span>Time</span>
							<span>{Math.ceil(remaining)}m left</span>
						</div>
						<Progress value={timePct} className="h-1.5" />
					</div>
				)}
			</div>

			<ScrollArea className="min-h-0 flex-1 px-4 py-4">
				<div className="mx-auto max-w-2xl space-y-6">
					<section>
						<MarkdownBody content={data.content} />
					</section>

					{data.concepts.length > 0 && (
						<section>
							<h3 className="mb-2 font-display text-base text-[#0A4D4A]">
								Concepts
							</h3>
							<Accordion type="multiple" className="w-full">
								{data.concepts.map((c) => (
									<AccordionItem key={c.id} value={c.id}>
										<AccordionTrigger className="text-left text-sm">
											{c.title}
										</AccordionTrigger>
										<AccordionContent className="space-y-3 text-sm text-shell-muted">
											{c.description && <p>{c.description}</p>}
											<div>
												<p className="font-medium text-foreground">Explanation</p>
												<p className="mt-1 whitespace-pre-wrap">
													{c.studyUnit.explanation}
												</p>
											</div>
											<div>
												<p className="font-medium text-foreground">
													Worked example
												</p>
												<p className="mt-1 whitespace-pre-wrap">
													{c.studyUnit.workedExample}
												</p>
											</div>
										</AccordionContent>
									</AccordionItem>
								))}
							</Accordion>
						</section>
					)}
				</div>
			</ScrollArea>

			<div className="border-t border-shell-border px-4 py-3">
				{data.status === "COMPLETED" ? (
					<p className="text-sm text-[#0A4D4A]">
						Module complete. Open the next module from the roadmap or sidebar.
					</p>
				) : canQuiz ? (
					<Button
						type="button"
						className="bg-[#0A4D4A] hover:bg-[#0A4D4A]/90"
						onClick={() => setQuizOpen(true)}
					>
						Take gate quiz
						{data.quiz ? ` (${data.quiz.questionCount})` : ""}
					</Button>
				) : (
					<p className="text-sm text-shell-muted">No gate quiz for this module.</p>
				)}
			</div>

			{data.quiz && (
				<GateQuizDialog
					open={quizOpen}
					onOpenChange={setQuizOpen}
					serverId={serverId}
					moduleId={moduleId}
					agentHandle={data.agentHandle}
				/>
			)}
		</div>
	);
}
