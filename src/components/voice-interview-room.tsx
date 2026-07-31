"use client";

import {
	BarVisualizer,
	LiveKitRoom,
	RoomAudioRenderer,
	useDataChannel,
	useVoiceAssistant,
} from "@livekit/components-react";
import "@livekit/components-styles";
import { Loader2, Mic, PhoneOff, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";

interface VoiceInterviewRoomProps {
	serverId: string;
	roomName: string;
}

type InterviewPhase = "connecting" | "speaking" | "listening" | "thinking" | "complete";

type InterviewUiState = {
	phase: InterviewPhase;
	questionIndex?: number;
	totalQuestions?: number;
	caption?: string;
	hint?: string;
};

export function VoiceInterviewRoom({ serverId, roomName }: VoiceInterviewRoomProps) {
	const router = useRouter();
	const [token, setToken] = useState("");
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		(async () => {
			try {
				const params = new URLSearchParams({ room: roomName, serverId });
				const resp = await fetch(`/api/get-participant-token?${params.toString()}`);
				if (!resp.ok) {
					const body = (await resp.json().catch(() => null)) as { error?: string } | null;
					setError(body?.error ?? "Could not join voice interview");
					return;
				}
				const data = (await resp.json()) as { token?: string };
				if (data.token) setToken(data.token);
			} catch (e) {
				setError(e instanceof Error ? e.message : "Connection failed");
			}
		})();
	}, [roomName, serverId]);

	if (error) {
		return (
			<div className="flex flex-1 flex-col items-center justify-center gap-2 p-6">
				<p className="text-sm text-rose-600">{error}</p>
			</div>
		);
	}

	if (!token) {
		return (
			<div className="flex flex-1 flex-col items-center justify-center">
				<Loader2 className="my-4 h-7 w-7 animate-spin text-[#0A4D4A]" />
				<p className="text-xs text-shell-muted">Connecting to interview room…</p>
			</div>
		);
	}

	return (
		<LiveKitRoom
			video={false}
			audio
			token={token}
			serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
			connect
			onDisconnected={() => router.push(`/servers/${serverId}`)}
			data-lk-theme="default"
			className="flex min-h-[480px] flex-1 flex-col bg-gradient-to-b from-[#F4FAF9] to-white"
		>
			<RoomAudioRenderer />
			<InterviewExperience serverId={serverId} />
		</LiveKitRoom>
	);
}

function InterviewExperience({ serverId }: { serverId: string }) {
	const router = useRouter();
	const { state: agentState, audioTrack, agentTranscriptions } = useVoiceAssistant();
	const [uiState, setUiState] = useState<InterviewUiState>({
		phase: "connecting",
		hint: "Waiting for your interviewer…",
	});

	const { send: sendData } = useDataChannel((msg) => {
		try {
			const parsed = JSON.parse(new TextDecoder().decode(msg.payload)) as {
				type?: string;
				phase?: InterviewPhase;
				questionIndex?: number;
				totalQuestions?: number;
				caption?: string;
				hint?: string;
			};
			if (parsed.type !== "interview-state" || !parsed.phase) return;
			setUiState({
				phase: parsed.phase,
				questionIndex: parsed.questionIndex,
				totalQuestions: parsed.totalQuestions,
				caption: parsed.caption,
				hint: parsed.hint,
			});
		} catch {
			// ignore
		}
	});

	const submitAnswer = useCallback(async () => {
		const payload = new TextEncoder().encode(JSON.stringify({ type: "submit-answer" }));
		await sendData(payload, { reliable: true });
	}, [sendData]);

	const displayPhase = useMemo((): InterviewPhase => {
		if (uiState.phase === "thinking") return "thinking";
		if (uiState.phase === "complete") return "complete";
		if (agentState === "speaking") return "speaking";
		if (agentState === "thinking") return "thinking";
		if (uiState.phase === "listening") return "listening";
		if (agentState === "listening") return "listening";
		return uiState.phase;
	}, [agentState, uiState.phase]);

	const phaseLabel: Record<InterviewPhase, string> = {
		connecting: "Connecting",
		speaking: "Interviewer speaking",
		listening: "Your turn",
		thinking: "Reviewing your answer",
		complete: "Interview complete",
	};

	const liveCaption =
		uiState.caption ??
		agentTranscriptions.at(-1)?.text ??
		"Your interviewer will ask one question at a time.";

	const progress =
		uiState.questionIndex != null && uiState.totalQuestions
			? uiState.questionIndex + 1
			: null;

	return (
		<div className="mx-auto flex w-full max-w-lg flex-1 flex-col px-4 py-6">
			<div className="mb-6 flex items-center justify-between">
				<div className="flex items-center gap-2">
					<span className="flex size-8 items-center justify-center rounded-full bg-[#E8F2F1] text-[#0A4D4A]">
						<Sparkles className="size-4" aria-hidden />
					</span>
					<div>
						<p className="font-display text-sm text-[#0A4D4A]">Mock interview</p>
						<p className="text-xs text-shell-muted">
							{progress ? `Question ${progress} of ${uiState.totalQuestions}` : "Voice mode"}
						</p>
					</div>
				</div>
				<span
					className={`rounded-full px-3 py-1 text-xs font-medium ${
						displayPhase === "speaking"
							? "bg-[#0A4D4A] text-white"
							: displayPhase === "listening"
								? "bg-amber-100 text-amber-900"
								: displayPhase === "thinking"
									? "bg-sky-100 text-sky-900"
									: "bg-shell-nav text-shell-muted"
					}`}
				>
					{phaseLabel[displayPhase]}
				</span>
			</div>

			{uiState.totalQuestions ? (
				<div className="mb-6 flex gap-2">
					{Array.from({ length: uiState.totalQuestions }).map((_, i) => (
						<div
							key={i}
							className={`h-1.5 flex-1 rounded-full transition-colors ${
								uiState.questionIndex != null && i <= uiState.questionIndex
									? "bg-[#0A4D4A]"
									: "bg-[#D8EBE8]"
							}`}
						/>
					))}
				</div>
			) : null}

			<div className="flex flex-1 flex-col items-center justify-center gap-8 py-4">
				<div className="relative flex size-44 items-center justify-center">
					<span
						className={`absolute inset-0 rounded-full ${
							displayPhase === "speaking"
								? "animate-ping bg-[#0A4D4A]/15"
								: displayPhase === "listening"
									? "animate-pulse bg-amber-200/50"
									: "bg-[#E8F2F1]/80"
						}`}
					/>
					<span
						className={`relative flex size-36 items-center justify-center rounded-full border-4 shadow-lg ${
							displayPhase === "speaking"
								? "border-[#0A4D4A] bg-white"
								: displayPhase === "listening"
									? "border-amber-400 bg-amber-50"
									: "border-[#B8D9D4] bg-white"
						}`}
					>
						{audioTrack && displayPhase === "speaking" ? (
							<BarVisualizer
								trackRef={audioTrack}
								barCount={7}
								options={{ minHeight: 8, maxHeight: 56 }}
								className="flex h-20 w-24 items-center justify-center gap-1"
							/>
						) : displayPhase === "thinking" ? (
							<Loader2 className="size-10 animate-spin text-[#0A4D4A]" aria-hidden />
						) : displayPhase === "listening" ? (
							<Mic className="size-10 text-amber-700" aria-hidden />
						) : (
							<Sparkles className="size-10 text-[#0A4D4A]" aria-hidden />
						)}
					</span>
				</div>

				<div className="w-full space-y-2 text-center">
					<p className="text-sm font-medium text-[#0A4D4A]">{phaseLabel[displayPhase]}</p>
					<p className="text-xs text-shell-muted">
						{uiState.hint ?? "Speak naturally, then tap Done answering."}
					</p>
				</div>

				<div className="w-full rounded-2xl border border-[#D8EBE8] bg-white/90 p-4 shadow-sm backdrop-blur">
					<p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-shell-muted">
						Current question
					</p>
					<p className="text-sm leading-relaxed text-foreground">{liveCaption}</p>
				</div>
			</div>

			<div className="mt-auto flex flex-col gap-3 pb-2">
				{displayPhase === "listening" ? (
					<Button
						type="button"
						size="lg"
						className="h-12 w-full bg-[#0A4D4A] text-base hover:bg-[#0A4D4A]/90"
						onClick={() => void submitAnswer()}
					>
						Done answering
					</Button>
				) : displayPhase === "thinking" ? (
					<Button type="button" size="lg" className="h-12 w-full" disabled>
						<Loader2 className="mr-2 size-4 animate-spin" />
						Reviewing…
					</Button>
				) : null}

				<Button
					type="button"
					variant="outline"
					className="h-11 w-full border-shell-border"
					onClick={() => router.push(`/servers/${serverId}`)}
				>
					<PhoneOff className="mr-2 size-4" aria-hidden />
					Leave interview
				</Button>
			</div>
		</div>
	);
}
