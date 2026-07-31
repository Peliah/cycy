"use client";

import Link from "next/link";
import { Mic } from "lucide-react";

import type { MockInterviewCardProps } from "@/types/learning";

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
	serverId,
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
					<Mic className="size-5" aria-hidden />
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
							Pass the final exam first. Then start the interview in Chat or by
							voice.
						</p>
					) : (
						<>
							<p className="text-sm text-shell-muted">
								Start a real-time voice interview, or continue in Chat by
								mentioning{" "}
								<span className="font-medium text-foreground">
									{handle ?? "the agent"}
								</span>
								.
							</p>
							<Link
								href={`/servers/${serverId}/interview/voice`}
								className="inline-flex items-center gap-2 rounded-lg bg-[#0A4D4A] px-4 py-2 text-sm font-medium text-white hover:bg-[#0A4D4A]/90"
							>
								<Mic className="size-4" aria-hidden />
								Start voice interview
							</Link>
							{handle ? (
								<p className="text-xs text-shell-muted">
									Text option:{" "}
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
