"use client";

import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import type {
	GateQuizDialogProps,
	GateQuizPayload,
	GateQuizResult,
} from "@/types/learning";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function GateQuizDialog({
	open,
	onOpenChange,
	serverId,
	moduleId,
	agentHandle,
}: GateQuizDialogProps) {
	const router = useRouter();
	const [quiz, setQuiz] = useState<GateQuizPayload | null>(null);
	const [index, setIndex] = useState(0);
	const [answers, setAnswers] = useState<Record<string, string>>({});
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [result, setResult] = useState<GateQuizResult | null>(null);

	useEffect(() => {
		if (!open) return;
		setResult(null);
		setIndex(0);
		setAnswers({});
		setError(null);
		let cancelled = false;
		void (async () => {
			try {
				const res = await fetch(
					`/api/servers/${serverId}/learn/modules/${moduleId}/quiz`,
				);
				if (!res.ok) throw new Error("Could not load quiz");
				const json = (await res.json()) as GateQuizPayload;
				if (!cancelled) setQuiz(json);
			} catch (e) {
				if (!cancelled) {
					setError(e instanceof Error ? e.message : "Failed");
				}
			}
		})();
		return () => {
			cancelled = true;
		};
	}, [open, serverId, moduleId]);

	const question = quiz?.questions[index];
	const isLast = quiz ? index >= quiz.questions.length - 1 : true;

	const submit = async () => {
		if (!quiz) return;
		setSubmitting(true);
		setError(null);
		try {
			const res = await fetch(
				`/api/servers/${serverId}/learn/modules/${moduleId}/quiz`,
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ answers }),
				},
			);
			const body = (await res.json()) as GateQuizResult & { message?: string };
			if (!res.ok) throw new Error(body.message ?? "Submit failed");
			setResult(body);
			if (body.passed) {
				router.refresh();
			}
		} catch (e) {
			setError(e instanceof Error ? e.message : "Submit failed");
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-lg border-shell-border bg-shell-chat">
				<DialogHeader>
					<DialogTitle className="font-display text-[#0A4D4A]">
						{quiz?.title ?? "Gate quiz"}
					</DialogTitle>
					<DialogDescription>
						{result
							? result.passed
								? "Nice work — module complete."
								: "Not quite — review and try again."
							: `Pass score ${(quiz?.passScore ?? 0.7) * 100}% · Question ${index + 1} of ${quiz?.questions.length ?? "…"}`}
					</DialogDescription>
				</DialogHeader>

				{error && <p className="text-sm text-rose-600">{error}</p>}

				{result ? (
					<div className="space-y-3 text-sm">
						<p>
							Score: {Math.round(result.score * 100)}% (need{" "}
							{Math.round(result.passScore * 100)}%)
						</p>
						{result.passed && (
							<p className="text-[#0A4D4A]">+{result.xpEarned} XP earned</p>
						)}
						{!result.passed && agentHandle && (
							<p className="text-shell-muted">
								Tip: ask {agentHandle} in the Chat tab about what you missed.
							</p>
						)}
					</div>
				) : question ? (
					<div className="space-y-4">
						<p className="text-sm font-medium text-foreground">{question.prompt}</p>
						{question.type === "MCQ" && question.choices ? (
							<RadioGroup
								value={answers[question.id] ?? ""}
								onValueChange={(v) =>
									setAnswers((prev) => ({ ...prev, [question.id]: v }))
								}
							>
								{question.choices.map((c) => (
									<div key={c.id} className="flex items-center gap-2">
										<RadioGroupItem value={c.id} id={`${question.id}-${c.id}`} />
										<Label
											htmlFor={`${question.id}-${c.id}`}
											className="font-normal"
										>
											{c.text}
										</Label>
									</div>
								))}
							</RadioGroup>
						) : (
							<Textarea
								value={answers[question.id] ?? ""}
								onChange={(e) =>
									setAnswers((prev) => ({
										...prev,
										[question.id]: e.target.value,
									}))
								}
								placeholder="Write your answer…"
								rows={4}
							/>
						)}
					</div>
				) : (
					!error && <p className="text-sm text-shell-muted">Loading…</p>
				)}

				<DialogFooter className="gap-2 sm:gap-0">
					{result?.passed && result.nextModule?.channelId ? (
						<Button
							type="button"
							className="bg-[#0A4D4A] hover:bg-[#0A4D4A]/90"
							onClick={() => {
								onOpenChange(false);
								router.push(
									`/servers/${serverId}/channels/${result.nextModule!.channelId}`,
								);
							}}
						>
							Continue to {result.nextModule.title}
						</Button>
					) : result ? (
						<>
							{!result.passed && (
								<Button
									type="button"
									variant="outline"
									onClick={() => {
										setResult(null);
										setIndex(0);
									}}
								>
									Retry
								</Button>
							)}
							<Button type="button" onClick={() => onOpenChange(false)}>
								Close
							</Button>
						</>
					) : (
						<>
							<Button
								type="button"
								variant="outline"
								disabled={index === 0}
								onClick={() => setIndex((i) => Math.max(0, i - 1))}
							>
								Back
							</Button>
							{isLast ? (
								<Button
									type="button"
									className="bg-[#0A4D4A] hover:bg-[#0A4D4A]/90"
									disabled={
										submitting ||
										!question ||
										!(answers[question.id] ?? "").trim()
									}
									onClick={() => void submit()}
								>
									{submitting ? "Submitting…" : "Submit quiz"}
								</Button>
							) : (
								<Button
									type="button"
									disabled={!question || !(answers[question.id] ?? "").trim()}
									onClick={() => setIndex((i) => i + 1)}
								>
									Next
								</Button>
							)}
						</>
					)}
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
