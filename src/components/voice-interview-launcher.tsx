"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { VoiceInterviewRoom } from "@/components/voice-interview-room";
import { voiceInterviewRoomName } from "@/lib/livekit/rooms";

type VoiceInterviewLauncherProps = {
	serverId: string;
};

export function VoiceInterviewLauncher({ serverId }: VoiceInterviewLauncherProps) {
	const router = useRouter();
	const [roomName, setRoomName] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	const dispatchStarted = useRef(false);

	useEffect(() => {
		if (dispatchStarted.current) return;
		dispatchStarted.current = true;

		let cancelled = false;
		(async () => {
			try {
				const resp = await fetch("/api/livekit/dispatch-interview-agent", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ serverId }),
				});
				if (!resp.ok) {
					const body = (await resp.json().catch(() => null)) as { error?: string } | null;
					throw new Error(body?.error ?? "Could not start voice interview");
				}
				const data = (await resp.json()) as { roomName?: string };
				if (!cancelled) {
					setRoomName(data.roomName ?? voiceInterviewRoomName(serverId, "unknown"));
				}
			} catch (e) {
				if (!cancelled) {
					setError(e instanceof Error ? e.message : "Failed to start");
				}
			}
		})();

		return () => {
			cancelled = true;
		};
	}, [serverId]);

	if (error) {
		return (
			<div className="flex flex-1 flex-col items-center justify-center gap-3 p-6">
				<p className="text-sm text-rose-600">{error}</p>
				<button
					type="button"
					className="text-sm text-[#0A4D4A] underline"
					onClick={() => router.push(`/servers/${serverId}`)}
				>
					Back to course
				</button>
			</div>
		);
	}

	if (!roomName) {
		return (
			<div className="flex flex-1 flex-col items-center justify-center">
				<Loader2 className="my-4 h-7 w-7 animate-spin text-zinc-500" />
				<p className="text-xs text-zinc-500">Starting voice interview…</p>
			</div>
		);
	}

	return <VoiceInterviewRoom serverId={serverId} roomName={roomName} />;
}
