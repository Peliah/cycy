"use client";

import { useUser } from "@clerk/nextjs";
import {
    ControlBar,
    GridLayout,
    LiveKitRoom,
    ParticipantTile,
    RoomAudioRenderer,
    useTracks
} from "@livekit/components-react";
import "@livekit/components-styles";
import { Track } from "livekit-client";
import { StudyAiAssist } from "@/components/study-ai-assist";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";


interface MediaRoomProps {
	serverId: string;
	chatId: string;
	video: boolean;
	audio: boolean;
	studyAssist?: boolean;
	enableRecording?: boolean;
}

export function MediaRoom({
	serverId,
	chatId,
	video,
	audio,
	studyAssist = false,
	enableRecording = false,
}: MediaRoomProps) {
	const { user, isLoaded } = useUser();
	const router = useRouter();
	const [token, setToken] = useState("");
	const [recordingStarted, setRecordingStarted] = useState(false);

	useEffect(() => {
		if (!isLoaded || !user) return;
		(async () => {
			try {
				const params = new URLSearchParams({
					room: chatId,
					serverId,
				});
				const resp = await fetch(`/api/get-participant-token?${params.toString()}`);
				if (!resp.ok) {
					console.error("LiveKit token request failed", resp.status);
					return;
				}
				const data = (await resp.json()) as { token?: string };
				if (data.token) setToken(data.token);
			} catch (e) {
				console.error(e);
			}
		})();
	}, [chatId, isLoaded, serverId, user]);

	useEffect(() => {
		if (!enableRecording || !token || recordingStarted) return;
		setRecordingStarted(true);
		void fetch("/api/livekit/start-recording", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ serverId, channelId: chatId, roomName: chatId }),
		}).catch((error) => console.error("start-recording failed", error));
	}, [chatId, enableRecording, recordingStarted, serverId, token]);

	if (token === "" || !isLoaded) {
		return (
			<div className="flex flex-col flex-1 justify-center items-center">
				<Loader2 className="h-7 w-7 text-zinc-500 animate-spin my-4" />
				<p className="text-zinc-500 dark:text-zinc-400 text-xs">Loading...</p>
			</div>
		);
	}

	return (
		<LiveKitRoom
			video={video}
			audio={audio}
			token={token}
			serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
			connect={true}
			onDisconnected={() => {
				router.push(`/servers/${serverId}`);
			}}
			// Use the default LiveKit theme for nice styles.
			data-lk-theme="default"
			className="flex flex-col flex-1 h-[80%]"
		>
			{/* Your custom component with basic video conferencing functionality. */}
			<MyVideoConference />
			<RoomAudioRenderer />
			{studyAssist && audio ? <StudyAiAssist serverId={serverId} channelId={chatId} /> : null}
			<ControlBar />
		</LiveKitRoom>
	);
}

function MyVideoConference() {
	// `useTracks` returns all camera and screen share tracks. If a user
	// joins without a published camera track, a placeholder track is returned.
	const tracks = useTracks(
		[
			{ source: Track.Source.Camera, withPlaceholder: true },
			{ source: Track.Source.ScreenShare, withPlaceholder: false },
		],
		{ onlySubscribed: false }
	);
	return (
		<GridLayout tracks={tracks} >
			{/* The GridLayout accepts zero or one child. The child is used
      as a template to render all passed in tracks. */}
			<ParticipantTile />
		</GridLayout>
	);
}
