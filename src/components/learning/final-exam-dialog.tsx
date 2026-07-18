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
	FinalExamDialogProps,
	FinalExamGetResponse,
	FinalExamSubmitResult,
} from "@/types/learning";
import { useEffect, useState } from "react";

export function FinalExamDialog({
	open,
	onOpenChange,
	serverId,
	onPassed,
}: FinalExamDialogProps) {
	const [payload, setPayload] = useState<FinalExamGetResponse | null>(null);
	const [index, setIndex] = useState(0);
	const [answers, setAnswers] = useState<Record<string, string>>({});
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [result, setResult] = useState<FinalExamSubmitResult | null>(null);

	useEffect(() => {
		if (!open) return;
		setResult(null);
		setIndex(0);
		setAnswers({});
		setError(null);
		let cancelled = false;
		void (async () => {
			try {
				const res = await fetch(`/api/servers/${serverId}/learn/exam`);
				if (!res.ok) throw new Error("Could not load final exam");
				const json = (await res.json()) as FinalExamGetResponse;
				if (!cancelled) setPayload(json);
			} catch (e) {
				if (!cancelled) {
					setError(e instanceof Error ? e.message : "Failed");
				}
			}
		})();
		return () => {
			cancelled = true;
		};
	}, [open, serverId]);

	const quiz = payload?.quiz;
	const question = quiz?.questions[index];
	const isLast = quiz ? index >= quiz.questions.length - 1 : true;

	const submit = async () => {
		setSubmitting(true);
		setError(null);
		try {
			const res = await fetch(`/api/servers/${serverId}/learn/exam`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ answers }),
			});
			const body = (await res.json()) as FinalExamSubmitResult;
			if (!res.ok) throw new Error(body.message ?? "Submit failed");
			setResult(body);
			if (body.passed) onPassed?.();
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
						{quiz?.title ?? "Final exam"}
					</DialogTitle>
					<DialogDescription>
						{result
							? result.passed
								? "You passed — certificate unlocked."
								: "Not quite — review and try again."
							: `Pass score ${Math.round((quiz?.passScore ?? 0.7) * 100)}% · Question ${index + 1} of ${quiz?.questions.length ?? "…"}`}
					</DialogDescription>
				</DialogHeader>

				{error && <p className="text-sm text-rose-600">{error}</p>}

				{payload && payload.status !== "AVAILABLE" && !result && (
					<p className="text-sm text-shell-muted">
						{payload.message ?? "Exam is not available."}
					</p>
				)}

				{result ? (
					<div className="space-y-3 text-sm">
						<p>
							Score: {Math.round(result.score * 100)}% (need{" "}
							{Math.round(result.passScore * 100)}%)
						</p>
						{result.passed && result.certificate && (
							<p className="font-mono text-[#0A4D4A]">
								Code: {result.certificate.verificationCode}
							</p>
						)}
						<DialogFooter className="gap-2 sm:justify-start">
							{!result.passed && (
								<Button
									type="button"
									variant="outline"
									onClick={() => {
										setResult(null);
										setIndex(0);
										setAnswers({});
									}}
								>
									Retry
								</Button>
							)}
							<Button type="button" onClick={() => onOpenChange(false)}>
								Close
							</Button>
						</DialogFooter>
					</div>
				) : quiz && question ? (
					<div className="space-y-4">
						<p className="text-sm font-medium text-foreground">
							{question.prompt}
						</p>
						{question.type === "MCQ" && question.choices ? (
							<RadioGroup
								value={answers[question.id] ?? ""}
								onValueChange={(value) =>
									setAnswers((prev) => ({ ...prev, [question.id]: value }))
								}
								className="space-y-2"
							>
								{question.choices.map((c) => (
									<div
										key={c.id}
										className="flex items-center gap-2 rounded-lg border border-shell-border px-3 py-2"
									>
										<RadioGroupItem value={c.id} id={c.id} />
										<Label htmlFor={c.id} className="flex-1 cursor-pointer text-sm">
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
								className="border-shell-border bg-shell-nav"
							/>
						)}
						<DialogFooter className="gap-2 sm:justify-between">
							<Button
								type="button"
								variant="ghost"
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
										submitting || !(answers[question.id] ?? "").trim()
									}
									onClick={() => void submit()}
								>
									{submitting ? "Submitting…" : "Submit exam"}
								</Button>
							) : (
								<Button
									type="button"
									disabled={!(answers[question.id] ?? "").trim()}
									onClick={() => setIndex((i) => i + 1)}
								>
									Next
								</Button>
							)}
						</DialogFooter>
					</div>
				) : (
					!error &&
					payload?.status === "AVAILABLE" && (
						<p className="text-sm text-shell-muted">Loading questions…</p>
					)
				)}
			</DialogContent>
		</Dialog>
	);
}
