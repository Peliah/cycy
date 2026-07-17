import { Hash } from "lucide-react";

interface ChatWelcomeProps {
	name: string;
	type: "channel" | "conversation";
}

export function ChatWelcome({ name, type }: ChatWelcomeProps) {
	return (
		<div className="mb-4 space-y-2 px-4">
			{type === "channel" && (
				<div className="flex size-[72px] items-center justify-center rounded-2xl bg-shell-active text-shell-accent">
					<Hash className="size-10" />
				</div>
			)}
			<p className="font-display text-xl font-semibold tracking-tight text-foreground md:text-3xl">
				{type === "channel" ? "Welcome to #" : ""}
				{name}
			</p>
			<p className="text-sm text-shell-muted">
				{type === "channel"
					? `This is the start of the #${name} channel.`
					: `This is the start of the conversation with ${name}.`}
			</p>
		</div>
	);
}
