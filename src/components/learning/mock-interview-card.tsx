"use client";

import type { MockInterviewCardProps } from "@/types/learning";
import { MessageSquare } from "lucide-react";

function statusLabel(status: string | null): string {
	switch (status) {
		case "passed":
			return "Passed";
		case "failed":
			return "Needs another attempt";
		case "in_progress":
			return "In progress";
		case "not_started":
			return "Not started";
		case "not_applicable":
			return "Not required yet";
		default:
			return status ?? "Unknown";
	}
}

export function MockInterviewCard({
	agentHandle,
	interviewStatus,
	certificateStage,
	modulesComplete,
	hasLocalCertificate,
}: MockInterviewCardProps) {
	const ready =
		modulesComplete && (hasLocalCertificate || certificateStage === "provisional");
	const handle = agentHandle?.startsWith("@")
		? agentHandle
		: agentHandle
			? `@${agentHandle}`
			: null;

	return (
		<div className="rounded-xl border border-shell-border bg-shell-chat p-5">
			<div className="flex items-start gap-3">
				<span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-shell-nav text-[#0A4D4A]">
					<MessageSquare className="size-5" aria-hidden />
				</span>
				<div className="min-w-0 flex-1 space-y-2">
					<p className="font-display text-lg text-[#0A4D4A]">Mock interview</p>
					<p className="text-sm text-shell-muted">
						Status:{" "}
						<span className="font-medium text-foreground">
							{statusLabel(interviewStatus)}
						</span>
						{certificateStage ? (
							<>
								{" "}
								· Nest cert stage:{" "}
								<span className="font-medium text-foreground">
									{certificateStage}
								</span>
							</>
						) : null}
					</p>
					{!ready ? (
						<p className="text-sm text-shell-muted">
							Pass the final exam first. Then start the interview in Chat by
							tagging the agent.
						</p>
					) : (
						<>
							<p className="text-sm text-shell-muted">
								In the Chat tab, mention{" "}
								<span className="font-medium text-foreground">
									{handle ?? "the agent"}
								</span>{" "}
								and ask to begin the mock interview. Replies arrive in the same
								channel.
							</p>
							{handle ? (
								<p className="text-xs text-shell-muted">
									Suggested message:{" "}
									<span className="font-mono text-foreground">
										{handle} let&apos;s start the mock interview
									</span>
								</p>
							) : null}
						</>
					)}
				</div>
			</div>
		</div>
	);
}
