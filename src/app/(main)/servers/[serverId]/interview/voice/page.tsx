import { VoiceInterviewLauncher } from "@/components/voice-interview-launcher";

type PageProps = {
	params: Promise<{ serverId: string }>;
};

export default async function VoiceInterviewPage({ params }: PageProps) {
	const { serverId } = await params;

	return (
		<div className="flex h-full min-h-0 flex-1 flex-col">
			<div className="border-b border-shell-border px-4 py-3">
				<h1 className="font-display text-lg text-[#0A4D4A]">Voice mock interview</h1>
				<p className="text-sm text-shell-muted">
					Speak your answers — the AI interviewer listens and asks follow-up questions.
				</p>
			</div>
			<VoiceInterviewLauncher serverId={serverId} />
		</div>
	);
}
