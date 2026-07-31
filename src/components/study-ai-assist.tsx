"use client";

import { useRoomContext } from "@livekit/components-react";
import { Bot, Loader2, Mic } from "lucide-react";
import { useCallback, useState } from "react";

import { Button } from "@/components/ui/button";

type StudyAiAssistProps = {
	serverId: string;
	channelId: string;
};

export function StudyAiAssist({ serverId, channelId }: StudyAiAssistProps) {
	const room = useRoomContext();
	const [dispatching, setDispatching] = useState(false);
	const [agentJoined, setAgentJoined] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [asking, setAsking] = useState(false);

	const inviteAgent = useCallback(async () => {
		setDispatching(true);
		setError(null);
		try {
			const resp = await fetch("/api/livekit/dispatch-study-agent", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ serverId, channelId }),
			});
			if (!resp.ok) {
				const body = (await resp.json().catch(() => null)) as { error?: string } | null;
				throw new Error(body?.error ?? "Could not invite AI tutor");
			}
			setAgentJoined(true);
		} catch (e) {
			setError(e instanceof Error ? e.message : "Invite failed");
		} finally {
			setDispatching(false);
		}
	}, [channelId, serverId]);

	const askAi = useCallback(async () => {
		if (!room) return;
		setAsking(true);
		try {
			const payload = new TextEncoder().encode(JSON.stringify({ type: "ask-ai" }));
			await room.localParticipant.publishData(payload, { reliable: true });
		} finally {
			setTimeout(() => setAsking(false), 800);
		}
	}, [room]);

	return (
		<div className="border-t border-shell-border bg-shell-chat px-4 py-3">
			<div className="mx-auto flex max-w-2xl flex-wrap items-center gap-3">
				<span className="flex items-center gap-2 text-sm font-medium text-[#0A4D4A]">
					<Bot className="size-4" aria-hidden />
					AI study tutor
				</span>
				{!agentJoined ? (
					<Button
						type="button"
						size="sm"
						variant="outline"
						disabled={dispatching}
						onClick={() => void inviteAgent()}
					>
						{dispatching ? (
							<>
								<Loader2 className="mr-2 size-4 animate-spin" />
								Inviting…
							</>
						) : (
							"Invite AI tutor"
						)}
					</Button>
				) : (
					<Button
						type="button"
						size="sm"
						className="bg-[#0A4D4A] hover:bg-[#0A4D4A]/90"
						disabled={asking}
						onClick={() => void askAi()}
					>
						<Mic className="mr-2 size-4" aria-hidden />
						{asking ? "Listening…" : "Ask AI"}
					</Button>
				)}
				<p className="text-xs text-shell-muted">
					{agentJoined
						? "AI listens by default. Press Ask AI, then speak your question."
						: "Invite the tutor to join this audio room."}
				</p>
				{error ? <p className="w-full text-xs text-rose-600">{error}</p> : null}
			</div>
		</div>
	);
}
