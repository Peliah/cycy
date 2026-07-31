/** LiveKit room name for a 1:1 voice mock interview (learner + AI agent). */
export function voiceInterviewRoomName(serverId: string, profileId: string): string {
	return `voice-interview-${serverId}-${profileId}`;
}

/** True when room name is a dedicated voice-interview room for the given learner. */
export function isVoiceInterviewRoom(
	room: string,
	serverId: string,
	profileId: string,
): boolean {
	return room === voiceInterviewRoomName(serverId, profileId);
}

/** Prefix for study-assist rooms (channel id is the room name). */
export function isChannelRoom(room: string): boolean {
	return !room.startsWith("voice-interview-");
}
