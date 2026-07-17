import { ChatVideoButton } from "@/components/chat/chat-video-button";
import { MobileToggle } from "@/components/mobile-toggle";
import { SocketIndicator } from "@/components/socket-indicator";
import { UserAvatar } from "@/components/user/user-avatar";
import { Hash } from "lucide-react";

interface ChatHeaderProps {
	name: string;
	type: "conversation" | "channel";
	imageUrl?: string;
	serverId: string;
}

export function ChatHeader({ name, type, imageUrl, serverId }: ChatHeaderProps) {
	return (
		<div className="flex h-12 items-center border-b border-shell-border bg-shell-chat px-3 text-sm font-semibold">
			<MobileToggle serverId={serverId} />
			{type === "channel" && (
				<Hash className="mr-2 size-5 text-shell-muted" />
			)}
			{type === "conversation" && (
				<UserAvatar src={imageUrl} className="mr-2 size-8" />
			)}
			<p className="font-display text-base font-semibold tracking-tight text-foreground">
				{name}
			</p>
			<div className="ml-auto flex items-center gap-2">
				{type === "conversation" && <ChatVideoButton />}
				<SocketIndicator />
			</div>
		</div>
	);
}
